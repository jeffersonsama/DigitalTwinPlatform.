import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { MapDashboard } from '@/components/world-map/map-dashboard'

export const metadata: Metadata = {
  title: 'World Map | ICESCO Crisis Forum 2026',
  description:
    'Track live global engagement across ICESCO Member States on an interactive world map.',
}

export default function WorldMapPage() {
  return (
    <AppShell title="Global Engagement">
      <MapDashboard />
    </AppShell>
  )
}
