import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { TwinCity } from '@/components/digital-twin/twin-city'
import { prisma } from '@/lib/db'
import { requireEnabledPage } from '@/lib/auth'
import type { TwinBuilding } from '@/components/digital-twin/twin-scene'

export const metadata: Metadata = {
  title: 'Digital Twin City | ICESCO Crisis Forum 2026',
  description:
    'Explore a live digital twin of a smart city, monitoring the real-time status of critical infrastructure.',
}

export default async function DigitalTwinPage() {
  await requireEnabledPage('digitalTwin')

  const rows = await prisma.twinBuilding.findMany({ orderBy: { name: 'asc' } })
  const buildings: TwinBuilding[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status === 'flood_risk' ? 'flood-risk' : b.status,
    x: b.x,
    y: b.y,
  }))

  return (
    <AppShell title="ICESCO Digital Twin City">
      <TwinCity buildings={buildings} />
    </AppShell>
  )
}
