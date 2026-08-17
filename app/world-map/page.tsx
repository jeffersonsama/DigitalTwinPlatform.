import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { MapDashboard } from '@/components/world-map/map-dashboard'
import { getGlobalStats, getCountryEngagement } from '@/lib/stats'

export const metadata: Metadata = {
  title: 'World Map | ICESCO Crisis Forum 2026',
  description:
    'Track live global engagement across ICESCO Member States on an interactive world map.',
}

export default async function WorldMapPage() {
  const [stats, countries] = await Promise.all([getGlobalStats(), getCountryEngagement()])

  return (
    <AppShell title="Global Engagement">
      <MapDashboard
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
