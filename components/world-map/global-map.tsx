'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import type { CountryEngagement } from '@/lib/stats'
import { cn } from '@/lib/utils'

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const activityColor: Record<'high' | 'medium' | 'low', string> = {
  high: '#22d3ee',
  medium: '#38bdf8',
  low: '#60a5fa',
}

export function GlobalMap({ markers }: { markers: CountryEngagement[] }) {
  const [hover, setHover] = useState<string | null>(null)

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        width={980}
        height={480}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0f2036"
                stroke="#1e3a5f"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: '#16304f' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {markers.map((m) => {
          const r = m.activity === 'high' ? 6 : m.activity === 'medium' ? 4.5 : 3.5
          const color = activityColor[m.activity]
          return (
            <Marker
              key={m.name}
              coordinates={[m.lng, m.lat]}
              onMouseEnter={() => setHover(m.name)}
              onMouseLeave={() => setHover(null)}
            >
              <circle r={r * 2.4} fill={color} opacity={0.12} />
              <circle r={r} fill={color}>
                <animate
                  attributeName="opacity"
                  values="1;0.4;1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
              {hover === m.name && (
                <g transform={`translate(0, ${-r - 6})`}>
                  <text
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {m.name} · {m.value.toLocaleString()}
                  </text>
                </g>
              )}
            </Marker>
          )
        })}
      </ComposableMap>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/70">
        <span className="flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-full')} style={{ background: activityColor.high }} />
          High Activity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: activityColor.medium }} />
          Medium Activity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: activityColor.low }} />
          Low Activity
        </span>
      </div>
    </div>
  )
}
