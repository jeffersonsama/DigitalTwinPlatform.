import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { TwinCity } from '@/components/digital-twin/twin-city'

export const metadata: Metadata = {
  title: 'Digital Twin City | ICESCO Crisis Forum 2026',
  description:
    'Explore a live digital twin of a smart city, monitoring the real-time status of critical infrastructure.',
}

export default function DigitalTwinPage() {
  return (
    <AppShell title="ICESCO Digital Twin City">
      <TwinCity />
    </AppShell>
  )
}
