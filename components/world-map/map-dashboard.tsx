import { Globe2, Users, Radio, FolderKanban, Trophy } from 'lucide-react'
import { GlobalMap } from './global-map'
import type { CountryEngagement } from '@/lib/stats'

export function MapDashboard({
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
  const overview = [
    { label: 'Countries Online', value: countriesConnected, icon: Globe2 },
    { label: 'Participants', value: participantsOnline.toLocaleString(), icon: Users },
    { label: 'Voice Shared', value: ideasShared.toLocaleString(), icon: Radio },
    { label: 'Projects Initiated', value: projectsInitiated, icon: FolderKanban },
    { label: 'Challenges Completed', value: challengesCompleted, icon: Trophy },
  ]
  const topCountries = countries.slice(0, 6)
  const max = Math.max(1, ...topCountries.map((c) => c.value))

  return (
    <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Left column */}
      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Live Overview</h2>
          <ul className="flex flex-col gap-2.5">
            {overview.map((o) => (
              <li key={o.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-accent/15 text-cyan-accent">
                  <o.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-base font-bold text-white">{o.value}</span>
                  <span className="block text-[11px] text-white/60">{o.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
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

      {/* Map */}
      <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-2.5 py-1 text-xs font-semibold text-cyan-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-accent" />
            Global Engagement · Live
          </span>
        </div>
        <GlobalMap markers={countries} />
      </section>
    </main>
  )
}
