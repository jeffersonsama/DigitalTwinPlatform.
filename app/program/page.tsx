import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { ProgramSchedule, type SessionView } from '@/components/program/program-schedule'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { computeSessionStatus } from '@/lib/program'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('program')} | ICESCO Crisis Forum 2026`, description: t('program.pageDescription') }
}

export default async function ProgramPage() {
  await requireEnabledPage('program')
  const { t } = await getTranslations()

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
    <AppShell title={t('program')}>
      <ProgramSchedule days={days} sessions={sessionViews} isLoggedIn={!!user} />
      <SiteFooter />
    </AppShell>
  )
}
