import Image from 'next/image'
import { GlobalMap } from '@/components/world-map/global-map'
import type { CountryEngagement } from '@/lib/stats'

const highlights = [
  { label: 'Most Active Country', value: 'Türkiye' },
  { label: 'Most Discussed Crisis', value: 'Floods' },
  { label: 'Top AI Insight', value: 'Invest in early warning & community education' },
]

export function PulseWall({
  countriesConnected,
  participantsOnline,
  ideasShared,
  projectsInitiated,
  challengesCompleted,
  countries,
}: {
  countriesConnected: number
  participantsOnline: number
  ideasShared: number
  projectsInitiated: number
  challengesCompleted: number
  countries: CountryEngagement[]
}) {
  const bigStats = [
    { label: 'Countries Online', value: countriesConnected.toString() },
    { label: 'Participants', value: participantsOnline.toLocaleString() },
    { label: 'Ideas Shared', value: ideasShared.toLocaleString() },
    { label: 'Projects Initiated', value: projectsInitiated.toString() },
    { label: 'Challenges Completed', value: challengesCompleted.toString() },
  ]
  const topCountries = countries.slice(0, 6)
  const max = Math.max(1, ...topCountries.map((c) => c.value))

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

      {/* Moved here from the old World Map page — global engagement map + top countries */}
      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 pb-14 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-white/10 bg-navy-900 p-4 text-left">
            <h2 className="mb-3 text-sm font-semibold text-white">Top Active Countries</h2>
            <ul className="flex flex-col gap-3">
              {topCountries.map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span aria-hidden>{c.flag}</span> {c.name}
                    </span>
                    <span className="font-mono tabular-nums text-white/60">{c.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-icesco-blue"
                      style={{ width: `${(c.value / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4 text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-2.5 py-1 text-xs font-semibold text-cyan-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-accent" />
              Global Engagement · Live
            </span>
          </div>
          <GlobalMap markers={countries} />
        </section>
      </div>
    </main>
  )
}
