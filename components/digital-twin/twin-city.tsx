'use client'

import { useState } from 'react'
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Activity,
  Building2,
  Gauge,
} from 'lucide-react'
import { TwinScene, statusStyles, type TwinBuilding } from './twin-scene'
import { cn } from '@/lib/utils'

export function TwinCity({ buildings: twinBuildings }: { buildings: TwinBuilding[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(twinBuildings[0]?.id ?? null)
  const selected = twinBuildings.find((b) => b.id === selectedId)

  const counts = {
    operational: twinBuildings.filter((b) => b.status === 'operational').length,
    warning: twinBuildings.filter((b) => b.status === 'warning').length,
    risk: twinBuildings.filter((b) => b.status === 'flood-risk').length,
  }

  return (
    <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-3">
        {/* Status header + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Live City Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Moderate Risk
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[Layers, ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
              <button
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-cyan-accent"
                aria-label="City control"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <TwinScene buildings={twinBuildings} selectedId={selectedId} onSelect={setSelectedId} />

        {/* Legend + quick counts */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Operational · {counts.operational}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Warning · {counts.warning}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Flood Risk · {counts.risk}
          </span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="flex flex-col gap-4">
        {selected && (
          <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="h-4 w-4 text-cyan-accent" />
              <h2 className="text-sm font-semibold">{selected.name}</h2>
            </div>
            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                statusStyles[selected.status].chip,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', statusStyles[selected.status].dot)} />
              {statusStyles[selected.status].label}
            </span>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-white/50">Capacity</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">84%</dd>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-white/50">Power</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">Stable</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Activity className="h-4 w-4 text-cyan-accent" />
            <h2 className="text-sm font-semibold">Infrastructure</h2>
          </div>
          <div className="flex flex-col gap-1">
            {twinBuildings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  selectedId === b.id ? 'bg-white/10' : 'hover:bg-white/5',
                )}
              >
                <span className="text-white/80">{b.name}</span>
                <span
                  className={cn('h-2 w-2 rounded-full', statusStyles[b.status].dot)}
                  aria-label={statusStyles[b.status].label}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-icesco-blue to-icesco p-4">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Gauge className="h-4 w-4 text-cyan-accent" />
            <h2 className="text-sm font-semibold">Resilience Index</h2>
          </div>
          <p className="font-display text-3xl font-bold text-white">7.8</p>
          <p className="text-xs text-white/70">out of 10 · improving</p>
        </section>
      </aside>
    </main>
  )
}
