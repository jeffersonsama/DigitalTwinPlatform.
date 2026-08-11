import type { Metadata } from 'next'
import { DarkTopbar } from '@/components/nav/dark-topbar'
import { PulseWall } from '@/components/pulse/pulse-wall'

export const metadata: Metadata = {
  title: 'Global Pulse | ICESCO Crisis Forum 2026',
  description:
    'The ICESCO Global Pulse LED wall — a live, big-screen view of forum-wide engagement and impact.',
}

export default function GlobalPulsePage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <DarkTopbar active="/global-pulse" title="ICESCO Global Pulse" />
      <PulseWall />
    </div>
  )
}
