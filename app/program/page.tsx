import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { ProgramSchedule, type SessionView } from '@/components/program/program-schedule'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { computeSessionStatus } from '@/lib/program'

export const metadata: Metadata = {
  title: 'Program | ICESCO Crisis Forum 2026',
  description: 'The full three-day agenda of the ICESCO Crisis Management Knowledge Forum 2026.',
}

export default async function ProgramPage() {
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

  const sessionViews: SessionView[] = sessions.map((s) => ({
    id: s.id,
    day: s.dayId,
    time: s.time,
    duration: s.duration,
    title: s.title,
    track: s.track,
    room: s.room,
    speaker: s.speaker?.name ?? null,
    status: computeSessionStatus(s.startsAt, s.endsAt),
    bookmarked: bookmarkedIds.has(s.id),
  }))

  return (
    <AppShell title="Program">
      <ProgramSchedule days={days} sessions={sessionViews} isLoggedIn={!!user} />
      <SiteFooter />
    </AppShell>
  )
}
