import Image from 'next/image'
import { globalStats } from '@/lib/data'

const bigStats = [
  { label: 'Countries Online', value: globalStats.countriesConnected.toString() },
  { label: 'Participants', value: globalStats.participantsOnline.toLocaleString() },
  { label: 'Ideas Shared', value: globalStats.ideasShared.toLocaleString() },
  { label: 'Projects Initiated', value: globalStats.projectsInitiated.toString() },
  { label: 'Challenges Completed', value: globalStats.challengesCompleted.toString() },
]

const highlights = [
  { label: 'Most Active Country', value: 'Türkiye' },
  { label: 'Most Discussed Crisis', value: 'Floods' },
  { label: 'Top AI Insight', value: 'Invest in early warning & community education' },
]

export function PulseWall() {
  return (
    <main className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-navy-950">
      {/* Stage backdrop */}
      <Image
        src="/images/pulse-stage.png"
        alt=""
        fill
        className="object-cover opacity-25"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/85 to-navy-950" />
      <div className="grid-glow pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-14 text-center md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-accent" />
          Live
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white md:text-6xl">
          ICESCO Global Pulse
        </h1>
        <p className="mt-3 text-balance text-sm text-white/70 md:text-lg">
          Uniting the Islamic World for a Resilient Future
        </p>

        {/* Big stats */}
        <div className="mt-12 grid w-full grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {bigStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-6 backdrop-blur"
            >
              <p className="font-display text-3xl font-extrabold tabular-nums text-cyan-accent md:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-white/60 md:text-xs">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-icesco/40 to-navy-900 p-5 text-left"
            >
              <p className="text-[11px] uppercase tracking-wide text-cyan-accent">{h.label}</p>
              <p className="mt-1.5 text-pretty text-lg font-bold text-white">{h.value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
