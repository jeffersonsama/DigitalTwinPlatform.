import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { PulseWall } from '@/components/pulse/pulse-wall'
import { getGlobalStats, getCountryEngagement } from '@/lib/stats'

export const metadata: Metadata = {
  title: 'Global Pulse | ICESCO Crisis Forum 2026',
  description:
    'The ICESCO Global Pulse LED wall — a live, big-screen view of forum-wide engagement and impact.',
}

export default async function GlobalPulsePage() {
  const [stats, countries] = await Promise.all([getGlobalStats(), getCountryEngagement()])

  return (
    <AppShell title="ICESCO Global Pulse">
      <PulseWall
        countriesConnected={stats.countriesConnected}
        participantsOnline={stats.participantsOnline}
        ideasShared={stats.ideasShared}
        projectsInitiated={stats.projectsInitiated}
        challengesCompleted={stats.challengesCompleted}
        countries={countries}
      />
    </AppShell>
  )
}
