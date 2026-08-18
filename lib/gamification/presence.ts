import { prisma } from '@/lib/db'
import { awardXp } from './xp'
import { issueCertificateOnce, evaluateParticipationCertificate } from './certificates'
import { XP, PRESENCE, PANEL_ATTENDANCE_RATIO } from './config'

export type HeartbeatContext = { type: 'live' } | { type: 'resource'; resourceId: string } | { type: 'general' }

export interface HeartbeatResult {
  type: 'panel' | 'resource' | 'general'
  activeSeconds: number
  thresholdSeconds: number
  suivi?: boolean
  completed?: boolean
  sessionTitle?: string
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Écoulé réel depuis le dernier battement, jamais celui déclaré par le client — plafonné pour
 * qu'une mise en veille / un onglet resté ouvert plusieurs heures ne compte pas d'un coup. */
function elapsedSince(last: Date | null, now: Date): number {
  if (!last) return PRESENCE.HEARTBEAT_INTERVAL_SECONDS
  const seconds = Math.floor((now.getTime() - last.getTime()) / 1000)
  return Math.max(0, Math.min(seconds, PRESENCE.MAX_ELAPSED_SECONDS_PER_TICK))
}

export async function processHeartbeat(userId: string, context: HeartbeatContext): Promise<HeartbeatResult | null> {
  const now = new Date()

  if (context.type === 'resource') {
    return processResourceHeartbeat(userId, context.resourceId, now)
  }

  if (context.type === 'live') {
    const liveSession = await prisma.programSession.findFirst({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
    })
    if (liveSession) return processPanelHeartbeat(userId, liveSession, now)
  }

  return processGeneralHeartbeat(userId, now)
}

async function processPanelHeartbeat(
  userId: string,
  session: { id: string; title: string; startsAt: Date; endsAt: Date },
  now: Date,
): Promise<HeartbeatResult> {
  const existing = await prisma.sessionAttendance.findUnique({
    where: { userId_sessionId: { userId, sessionId: session.id } },
  })
  const elapsed = elapsedSince(existing?.lastHeartbeatAt ?? null, now)
  const activeSeconds = (existing?.activeSeconds ?? 0) + elapsed

  const attendance = await prisma.sessionAttendance.upsert({
    where: { userId_sessionId: { userId, sessionId: session.id } },
    create: { userId, sessionId: session.id, activeSeconds, lastHeartbeatAt: now },
    update: { activeSeconds, lastHeartbeatAt: now },
  })

  const owedXp = Math.floor(activeSeconds / PRESENCE.PANEL_SECONDS_PER_XP)
  const deltaXp = owedXp - attendance.xpAwarded
  if (deltaXp > 0) {
    await awardXp(userId, {
      key: `PRESENCE_PANEL:${userId}:${session.id}:${owedXp}`,
      amount: deltaXp,
      title: session.title,
      meta: 'Panel',
    })
    await prisma.sessionAttendance.update({ where: { id: attendance.id }, data: { xpAwarded: owedXp } })
  }

  const durationSeconds = Math.max(1, Math.floor((session.endsAt.getTime() - session.startsAt.getTime()) / 1000))
  let suivi = attendance.suivi
  if (!suivi && activeSeconds / durationSeconds >= PANEL_ATTENDANCE_RATIO) {
    suivi = true
    await prisma.sessionAttendance.update({ where: { id: attendance.id }, data: { suivi: true } })
    await issueCertificateOnce(userId, {
      type: 'panel',
      title: session.title,
      sourceKey: `PANEL_CERT:${session.id}:${userId}`,
    })
    await evaluateParticipationCertificate(userId)
  }

  return {
    type: 'panel',
    activeSeconds,
    thresholdSeconds: Math.round(durationSeconds * PANEL_ATTENDANCE_RATIO),
    suivi,
    sessionTitle: session.title,
  }
}

async function processResourceHeartbeat(userId: string, resourceId: string, now: Date): Promise<HeartbeatResult | null> {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
  if (!resource) return null

  const existing = await prisma.resourceRead.findUnique({ where: { userId_resourceId: { userId, resourceId } } })
  if (existing?.completedAt) {
    return { type: 'resource', activeSeconds: existing.secondsSpent, thresholdSeconds: PRESENCE.RESOURCE_READ_THRESHOLD_SECONDS, completed: true }
  }

  const elapsed = elapsedSince(existing?.lastHeartbeatAt ?? null, now)
  const secondsSpent = (existing?.secondsSpent ?? 0) + elapsed
  const justCompleted = secondsSpent >= PRESENCE.RESOURCE_READ_THRESHOLD_SECONDS

  await prisma.resourceRead.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    create: { userId, resourceId, secondsSpent, lastHeartbeatAt: now, completedAt: justCompleted ? now : null },
    update: { secondsSpent, lastHeartbeatAt: now, completedAt: justCompleted ? now : null },
  })

  if (justCompleted) {
    await awardXp(userId, {
      key: `RESOURCE_READ:${userId}:${resourceId}`,
      amount: XP.RESOURCE_READ,
      title: resource.title,
      meta: 'Knowledge Hub',
    })
    await maybeAwardDiversityBonus(userId)
  }

  return {
    type: 'resource',
    activeSeconds: secondsSpent,
    thresholdSeconds: PRESENCE.RESOURCE_READ_THRESHOLD_SECONDS,
    completed: justCompleted,
  }
}

async function maybeAwardDiversityBonus(userId: string): Promise<void> {
  const [allCategories, readCategories] = await Promise.all([
    prisma.resource.findMany({ select: { category: true }, distinct: ['category'] }),
    prisma.resourceRead.findMany({
      where: { userId, completedAt: { not: null } },
      select: { resource: { select: { category: true } } },
    }),
  ])
  const allSet = new Set(allCategories.map((c) => c.category))
  const readSet = new Set(readCategories.map((r) => r.resource.category))
  const coversAll = allSet.size > 0 && [...allSet].every((c) => readSet.has(c))
  if (!coversAll) return

  await awardXp(userId, {
    key: `RESOURCE_DIVERSITY:${userId}`,
    amount: XP.RESOURCE_DIVERSITY_BONUS,
    title: 'Curiosité transverse',
    meta: 'Knowledge Hub',
  })
}

async function processGeneralHeartbeat(userId: string, now: Date): Promise<HeartbeatResult> {
  const day = dayKey(now)
  const existing = await prisma.presenceDay.findUnique({ where: { userId_day: { userId, day } } })
  const elapsed = elapsedSince(existing?.lastHeartbeatAt ?? null, now)
  const generalSeconds = (existing?.generalSeconds ?? 0) + elapsed

  const record = await prisma.presenceDay.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, generalSeconds, lastHeartbeatAt: now },
    update: { generalSeconds, lastHeartbeatAt: now },
  })

  const owedXp = Math.min(Math.floor(generalSeconds / PRESENCE.GENERAL_SECONDS_PER_XP), PRESENCE.GENERAL_DAILY_XP_CAP)
  const deltaXp = owedXp - record.generalXpAwarded
  if (deltaXp > 0) {
    await awardXp(userId, {
      key: `PRESENCE_GENERAL:${userId}:${day}:${owedXp}`,
      amount: deltaXp,
      title: 'Présence sur la plateforme',
      meta: 'Présence',
    })
    await prisma.presenceDay.update({ where: { id: record.id }, data: { generalXpAwarded: owedXp } })
  }

  return {
    type: 'general',
    activeSeconds: generalSeconds,
    thresholdSeconds: PRESENCE.GENERAL_DAILY_XP_CAP * PRESENCE.GENERAL_SECONDS_PER_XP,
  }
}
