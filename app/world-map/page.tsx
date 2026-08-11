import type { Metadata } from 'next'
import { DarkTopbar } from '@/components/nav/dark-topbar'
import { MapDashboard } from '@/components/world-map/map-dashboard'

export const metadata: Metadata = {
  title: 'World Map | ICESCO Crisis Forum 2026',
  description:
    'Track live global engagement across ICESCO Member States on an interactive world map.',
}

export default function WorldMapPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <DarkTopbar active="/world-map" title="Global Engagement" />
      <MapDashboard />
    </div>
  )
}
