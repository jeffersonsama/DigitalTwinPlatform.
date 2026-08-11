'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export type TwinStatus = 'operational' | 'warning' | 'flood-risk'

export interface TwinBuilding {
  id: string
  name: string
  status: TwinStatus
  x: number
  y: number
}

const statusStyles: Record<TwinStatus, { dot: string; chip: string; label: string }> = {
  operational: {
    dot: 'bg-emerald-400',
    chip: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
    label: 'Operational',
  },
  warning: {
    dot: 'bg-amber-400',
    chip: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
    label: 'Warning',
  },
  'flood-risk': {
    dot: 'bg-red-500',
    chip: 'border-red-500/40 bg-red-500/15 text-red-300',
    label: 'Flood Risk',
  },
}

interface TwinSceneProps {
  buildings: readonly TwinBuilding[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** When true a crisis epicenter ripple is rendered. */
  crisis?: boolean
  epicenter?: { x: number; y: number }
  className?: string
}

/**
 * Interactive digital-twin viewport.
 *
 * The base render is currently a pre-rendered isometric city image with an
 * absolutely positioned marker layer. It is intentionally structured so the
 * <BaseLayer /> can later be swapped for a React Three Fiber <Canvas> without
 * touching the marker / control logic that surrounds it.
 */
export function TwinScene({
  buildings,
  selectedId,
  onSelect,
  crisis,
  epicenter,
  className,
}: TwinSceneProps) {
  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-navy-950',
        className,
      )}
    >
      {/* BaseLayer — replace with an R3F <Canvas> for a true 3D twin */}
      <Image
        src="/images/digital-twin-city.png"
        alt="Isometric digital twin of the smart city"
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 900px"
        priority
      />
      <div className="grid-glow pointer-events-none absolute inset-0 opacity-40" />

      {/* Crisis epicenter */}
      {crisis && epicenter && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${epicenter.x}%`, top: `${epicenter.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          <span className="absolute inset-0 -m-8 animate-ping rounded-full border border-red-500/60" />
          <span className="absolute inset-0 -m-16 animate-ping rounded-full border border-red-500/30 [animation-delay:0.4s]" />
          <span className="block h-4 w-4 rounded-full bg-red-500 shadow-[0_0_20px_6px_rgba(239,68,68,0.7)]" />
        </div>
      )}

      {/* Marker layer */}
      {buildings.map((b) => {
        const s = statusStyles[b.status]
        const active = selectedId === b.id
        return (
          <button
            key={b.id}
            onClick={() => onSelect?.(b.id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            aria-label={`${b.name} — ${s.label}`}
          >
            <span className="relative flex items-center justify-center">
              <span className={cn('absolute h-4 w-4 animate-ping rounded-full opacity-60', s.dot)} />
              <span
                className={cn(
                  'relative h-2.5 w-2.5 rounded-full ring-2 ring-white/40',
                  s.dot,
                  active && 'ring-cyan-accent',
                )}
              />
            </span>
            <span
              className={cn(
                'mt-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium backdrop-blur transition-transform',
                s.chip,
                active ? 'scale-105' : 'group-hover:scale-105',
              )}
              style={{ position: 'absolute', left: '50%', top: '100%' }}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
              {b.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { statusStyles }
