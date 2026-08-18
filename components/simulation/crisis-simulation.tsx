'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Timer,
  Target,
  Boxes,
  ChevronRight,
  ShieldCheck,
  HeartPulse,
  Radio,
  Send,
} from 'lucide-react'
import { TwinScene } from '@/components/digital-twin/twin-scene'
import { twinBuildings } from '@/lib/data'
import { useLocale, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const objectives = [
  { label: 'Save lives', icon: HeartPulse },
  { label: 'Protect critical infrastructure', icon: ShieldCheck },
  { label: 'Coordinate response', icon: Radio },
  { label: 'Manage resources', icon: Boxes },
]

const resources = [
  { label: 'Rescue Teams', value: 120 },
  { label: 'Medical Units', value: 45 },
  { label: 'Vehicles', value: 75 },
  { label: 'Shelters', value: 30 },
]

const decisions = [
  { label: 'Evacuate the area', tone: 'primary' as const },
  { label: 'Deploy medical teams', tone: 'default' as const },
  { label: 'Secure critical buildings', tone: 'default' as const },
  { label: 'Request international aid', tone: 'default' as const },
]

const situation = [
  ['Magnitude', '7.2'],
  ['Epicenter', '7.5 km'],
  ['Population', '125,000'],
  ['Injured', '2,930'],
]

function useCountdown(start = 165) {
  const [seconds, setSeconds] = useState(start)
  const ref = useRef(seconds)
  ref.current = seconds
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

const simTabLabelKeys: Record<'log' | 'map' | 'media', TranslationKey> = {
  log: 'simulation.tabs.log',
  map: 'simulation.tabs.map',
  media: 'simulation.tabs.media',
}

export function CrisisSimulation() {
  const { t } = useLocale()
  const time = useCountdown()
  const [log, setLog] = useState<string[]>([
    'Simulation started · Earthquake scenario',
    'Aftershock detected near telemetry center',
  ])
  const [tab, setTab] = useState<'log' | 'map' | 'media'>('map')

  function decide(label: string) {
    setLog((l) => [t('simulation.log.decisionPrefix', { label }), ...l])
  }

  return (
    <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* Left: role + objectives + resources */}
      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <p className="text-xs uppercase tracking-wide text-white/50">{t('simulation.yourRole')}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-accent/20 text-cyan-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Civil Protection</p>
              <p className="text-xs text-white/60">Team Leader</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Target className="h-4 w-4 text-cyan-accent" />
            <h2 className="text-sm font-semibold">{t('simulation.objectives')}</h2>
          </div>
          <ul className="flex flex-col gap-2">
            {objectives.map((o) => (
              <li key={o.label} className="flex items-center gap-2 text-sm text-white/80">
                <o.icon className="h-4 w-4 text-cyan-accent/80" />
                {o.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Boxes className="h-4 w-4 text-cyan-accent" />
            <h2 className="text-sm font-semibold">{t('live.tabs.resources')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {resources.map((r) => (
              <div key={r.label} className="rounded-lg bg-white/5 p-2.5">
                <p className="font-display text-lg font-bold text-white">{r.value}</p>
                <p className="text-[11px] text-white/60">{r.label}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* Center: scene */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {t('simulation.scenarioBadge')}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
            <Timer className="h-4 w-4 text-cyan-accent" />
            <span className="font-mono text-sm font-semibold tabular-nums text-white">{time}</span>
            <span className="text-[11px] text-white/50">{t('simulation.remaining')}</span>
          </div>
        </div>

        <TwinScene buildings={twinBuildings} crisis epicenter={{ x: 52, y: 55 }} />

        {/* Tabs */}
        <div className="rounded-xl border border-white/10 bg-navy-900">
          <div className="flex items-center gap-1 border-b border-white/10 px-2">
            {(['log', 'map', 'media'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={cn(
                  'relative px-3 py-2.5 text-sm capitalize transition-colors',
                  tab === tabKey ? 'text-white' : 'text-white/50 hover:text-white/80',
                )}
              >
                {t(simTabLabelKeys[tabKey])}
                {tab === tabKey && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cyan-accent" />}
              </button>
            ))}
          </div>
          <div className="max-h-40 overflow-y-auto p-3">
            {tab === 'log' && (
              <ul className="flex flex-col gap-1.5 text-sm">
                {log.map((entry, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/70">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-accent" />
                    {entry}
                  </li>
                ))}
              </ul>
            )}
            {tab === 'map' && <p className="text-sm text-white/60">{t('simulation.hazardMapDescription')}</p>}
            {tab === 'media' && (
              <div className="relative h-28 w-full overflow-hidden rounded-lg">
                <Image
                  src="/images/hero-city.png"
                  alt={t('simulation.fieldFootageAlt')}
                  fill
                  className="object-cover"
                  sizes="600px"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: situation + decisions */}
      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">{t('simulation.situationReport')}</h2>
          <dl className="flex flex-col gap-2">
            {situation.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm last:border-0">
                <dt className="text-white/60">{k}</dt>
                <dd className="font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">{t('simulation.makeADecision')}</h2>
          <div className="flex flex-col gap-2">
            {decisions.map((d) => (
              <button
                key={d.label}
                onClick={() => decide(d.label)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  d.tone === 'primary'
                    ? 'bg-orange text-white hover:bg-orange/90'
                    : 'bg-white/5 text-white/80 hover:bg-white/10',
                )}
              >
                {d.label}
                <ChevronRight className="h-4 w-4 opacity-70" />
              </button>
            ))}
          </div>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const input = e.currentTarget.elements.namedItem('msg') as HTMLInputElement
            if (input.value.trim()) {
              setLog((l) => [t('simulation.log.youPrefix', { message: input.value.trim() }), ...l])
              input.value = ''
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-navy-900 p-2"
        >
          <input
            name="msg"
            placeholder={t('simulation.sendUpdatePlaceholder')}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-accent text-navy-950 transition-colors hover:bg-cyan-accent/90"
            aria-label={t('simulation.sendUpdate')}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </main>
  )
}
