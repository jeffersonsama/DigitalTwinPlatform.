'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { awardXp } from '@/lib/gamification/xp'
import { issueCertificateOnce, upsertCareerCertificate } from '@/lib/gamification/certificates'
import { processHeartbeat, type HeartbeatContext, type HeartbeatResult } from '@/lib/gamification/presence'
import { XP } from '@/lib/gamification/config'

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function contextFromPathname(pathname: string): HeartbeatContext {
  const knowledgeMatch = pathname.match(/^\/knowledge\/([^/?#]+)/)
  if (knowledgeMatch) return { type: 'resource', resourceId: knowledgeMatch[1] }
  if (pathname === '/live' || pathname.startsWith('/live/')) return { type: 'live' }
  return { type: 'general' }
}

/** Appelée toutes les ~60s par components/shell/presence-heartbeat.tsx tant que l'onglet est
 * visible. Le client ne fait que signaler "je suis sur cette page" — c'est processHeartbeat qui
 * décide seul du temps écoulé, de l'XP due et des seuils franchis. */
export async function recordHeartbeat(pathname: string): Promise<HeartbeatResult | null> {
  const user = await requireUser()
  return processHeartbeat(user.id, contextFromPathname(pathname))
}

/** Idempotent via la clé du jour — appelée sans risque à chaque montage du shell. */
export async function ensureDailyLogin(): Promise<void> {
  const user = await requireUser()
  const now = new Date()
  const today = todayKey(now)

  const { awarded } = await awardXp(user.id, {
    key: `LOGIN:${user.id}:${today}`,
    amount: XP.LOGIN_DAILY,
    title: 'Connexion quotidienne',
    meta: 'Connexion',
  })
  if (!awarded) return

  const priorDayKeys: string[] = []
  for (let i = 1; i < XP.LOGIN_STREAK_DAYS; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    priorDayKeys.push(`LOGIN:${user.id}:${todayKey(d)}`)
  }
  const priorLogins = await prisma.activityLogEntry.count({ where: { key: { in: priorDayKeys } } })
  if (priorLogins === priorDayKeys.length) {
    await awardXp(user.id, {
      key: `LOGIN_STREAK:${user.id}:${today}`,
      amount: XP.LOGIN_STREAK_BONUS,
      title: `Régularité — ${XP.LOGIN_STREAK_DAYS} jours consécutifs`,
      meta: 'Connexion',
    })
  }
}

export async function recordShareIntent(channel: string): Promise<void> {
  const user = await requireUser()
  await awardXp(user.id, {
    key: `SHARE:${user.id}:${todayKey()}:${channel}`,
    amount: XP.SHARE_INTENT,
    title: `Partage — ${channel}`,
    meta: 'Partage',
  })
  revalidatePath('/passport')
}

/** Pont Crisis City → Passeport pour les 4 ateliers post-session uniquement (S1-S4) — jamais
 * pour les scénarios narratifs, qui restent hors XP Passeport (docs/xp-certification-system.md
 * §3.8/§4). Appelée depuis components/crisis-city/atelier/engine/xpBridge.js, dans un try/catch
 * qui ne bloque jamais le crédit interne du jeu (badge + XP Crisis City) en cas d'échec. */
export async function awardWorkshopXp(jeuId: string): Promise<void> {
  const user = await requireUser()
  const label = `Atelier ${jeuId.toUpperCase()} complété`
  await awardXp(user.id, {
    key: `ATELIER_${jeuId.toUpperCase()}_PASSEPORT`,
    amount: XP.ATELIER_WORKSHOP,
    title: label,
    meta: 'Workshop',
  })
  await issueCertificateOnce(user.id, {
    type: 'workshop',
    title: label,
    sourceKey: `WORKSHOP_CERT:${user.id}:${jeuId}`,
  })
  revalidatePath('/passport')
  revalidatePath('/certificates')
}

/** Certificats `game`/`career` Crisis City — reflètent le profil du jeu narratif mais n'y sont
 * jamais fusionnés côté XP Passeport (le jeu appelle cette action, jamais awardXp). Appelée
 * depuis components/crisis-city/engine/useProgress.js#completeScenario. */
export async function awardScenarioCompletion(scenarioId: string, scenarioTitle: string, gradeTitle: string): Promise<void> {
  const user = await requireUser()
  await issueCertificateOnce(user.id, {
    type: 'game',
    title: scenarioTitle,
    sourceKey: `GAME_CERT:${user.id}:${scenarioId}`,
  })
  await upsertCareerCertificate(user.id, gradeTitle)
  revalidatePath('/passport')
  revalidatePath('/certificates')
}
