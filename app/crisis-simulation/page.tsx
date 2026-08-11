import type { Metadata } from 'next'
import { DarkTopbar } from '@/components/nav/dark-topbar'
import { CrisisSimulation } from '@/components/simulation/crisis-simulation'

export const metadata: Metadata = {
  title: 'Crisis Simulation | ICESCO Crisis Forum 2026',
  description:
    'Lead a real-time earthquake response simulation: manage resources, protect infrastructure, and make critical decisions.',
}

export default function CrisisSimulationPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <DarkTopbar active="/crisis-simulation" title="Crisis Simulation" />
      <CrisisSimulation />
    </div>
  )
}
