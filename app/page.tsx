import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { StatRow } from '@/components/home/stat-row'
import { CrisisTimeline, type TimelineStep } from '@/components/home/crisis-timeline'
import { prisma } from '@/lib/db'
import { computeSessionStatus } from '@/lib/program'
import { getGlobalStats } from '@/lib/stats'

export default async function HomePage() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

  const [stats, newUsersToday, sessionsToday, day1Sessions] = await Promise.all([
    getGlobalStats(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.programSession.count({ where: { startsAt: { gte: startOfToday, lt: endOfToday } } }),
    prisma.programSession.findMany({ where: { dayId: 'day1' }, orderBy: { startsAt: 'asc' } }),
  ])

  const timelineSteps: TimelineStep[] = day1Sessions.map((s) => ({
    time: s.time,
    label: s.title,
    status: computeSessionStatus(s.startsAt, s.endsAt),
  }))

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <Hero />
        <StatRow
          countriesConnected={stats.countriesConnected}
          participantsOnline={stats.participantsOnline}
          participantsDelta={newUsersToday}
          sessionsToday={sessionsToday}
        />
        <CrisisTimeline steps={timelineSteps} />
      </main>
      <SiteFooter />
    </AppShell>
  )
}
