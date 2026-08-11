import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { CrisisSimulation } from '@/components/simulation/crisis-simulation'

export const metadata: Metadata = {
  title: 'Crisis Simulation | ICESCO Crisis Forum 2026',
  description:
    'Lead a real-time earthquake response simulation: manage resources, protect infrastructure, and make critical decisions.',
}

export default function CrisisSimulationPage() {
  return (
    <AppShell title="Crisis Simulation">
      <CrisisSimulation />
    </AppShell>
  )
}
