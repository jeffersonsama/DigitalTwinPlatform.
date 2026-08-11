import { Globe, Cpu, Boxes, Network, ShieldCheck } from 'lucide-react'
import { IcescoLogo } from '@/components/brand/icesco-logo'

const features = [
  { icon: Globe, title: 'Multilingual', sub: 'AR / EN / FR' },
  { icon: Cpu, title: 'AI Powered', sub: 'Insights & Assistant' },
  { icon: Boxes, title: 'Digital Twin', sub: 'Real-time Simulation' },
  { icon: Network, title: 'Global Collaboration', sub: 'Connect & Co-create' },
  { icon: ShieldCheck, title: 'Secure & Inclusive', sub: 'Accessible to All' },
]

export function SiteFooter() {
  return (
    <footer className="bg-icesco text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25">
                <f.icon className="h-5 w-5 text-cyan-accent" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-white/60">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <IcescoLogo variant="light" />
          <p className="text-xs text-white/60">
            ICESCO Crisis Management Knowledge Forum 2026 — Building Resilient Communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
