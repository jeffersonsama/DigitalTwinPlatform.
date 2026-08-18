import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { ProgramSchedule, type SessionView } from '@/components/program/program-schedule'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { computeSessionStatus } from '@/lib/program'
import { PANEL_ATTENDANCE_RATIO } from '@/lib/gamification/config'

export const metadata: Metadata = {
  title: 'Program | ICESCO Crisis Forum 2026',
  description: 'The full three-day agenda of the ICESCO Crisis Management Knowledge Forum 2026.',
}

export default async function ProgramPage() {
  await requireEnabledPage('program')

  const [days, sessions, user] = await Promise.all([
    prisma.programDay.findMany({ orderBy: { id: 'asc' } }),
    prisma.programSession.findMany({ orderBy: { startsAt: 'asc' }, include: { speaker: true } }),
    getCurrentUser(),
  ])

  const bookmarkedIds = user
    ? new Set(
        (await prisma.bookmark.findMany({ where: { userId: user.id }, select: { sessionId: true } })).map(
          (b) => b.sessionId,
        ),
      )
    : new Set<string>()

  const attendanceBySessionId = user
    ? new Map(
        (await prisma.sessionAttendance.findMany({ where: { userId: user.id } })).map((a) => [a.sessionId, a]),
      )
    : new Map()

  const sessionViews: SessionView[] = sessions.map((s) => {
    const status = computeSessionStatus(s.startsAt, s.endsAt)
    const attendance = attendanceBySessionId.get(s.id)
    return {
      id: s.id,
      day: s.dayId,
      time: s.time,
      duration: s.duration,
      title: s.title,
      track: s.track,
      room: s.room,
      speaker: s.speaker?.name ?? null,
      status,
      bookmarked: bookmarkedIds.has(s.id),
      attendance:
        status === 'live' && user
          ? {
              activeSeconds: attendance?.activeSeconds ?? 0,
              thresholdSeconds: Math.round(
                ((s.endsAt.getTime() - s.startsAt.getTime()) / 1000) * PANEL_ATTENDANCE_RATIO,
              ),
              suivi: attendance?.suivi ?? false,
            }
          : null,
    }
  })

  return (
    <AppShell title="Program">
      <ProgramSchedule days={days} sessions={sessionViews} isLoggedIn={!!user} />
      <SiteFooter />
    </AppShell>
  )
}
