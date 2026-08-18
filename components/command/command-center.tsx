import {
  Wifi,
  Server,
  Cpu,
  Radio,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Users,
  MonitorPlay,
} from 'lucide-react'
import { commandStreams, topCountries } from '@/lib/data'
import { PageVisibilityPanel, type TogglePageView } from '@/components/command/page-visibility-panel'

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action && <span className="text-[11px] text-white/40">{action}</span>}
      </div>
      {children}
    </section>
  )
}

function StreamGrid() {
  return (
    <Panel title="Live Streams" action="4 active">
      <div className="grid grid-cols-2 gap-3">
        {commandStreams.map((s, i) => (
          <div
            key={s}
            className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-navy-800 to-navy-950"
          >
            <div className="grid-glow absolute inset-0 opacity-60" />
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Radio className="h-2.5 w-2.5" /> LIVE
            </div>
            <MonitorPlay className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/20" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-x-1 bg-black/50 px-2 py-1">
              <span className="truncate text-[11px] font-medium text-white">{s}</span>
              <span className="shrink-0 text-[10px] text-cyan-accent">{(i + 3) * 412}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function AnalyticsBars() {
  const bars = [
    { label: 'Engagement', value: 85 },
    { label: 'Retention', value: 78 },
    { label: 'Interactions', value: 92 },
  ]
  return (
    <Panel title="Real-time Analytics">
      <div className="flex flex-col gap-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/70">{b.label}</span>
              <span className="font-semibold text-cyan-accent">{b.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-icesco-blue to-cyan-accent"
                style={{ width: `${b.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function TopCountriesPanel() {
  const max = Math.max(...topCountries.map((c) => c.value))
  return (
    <Panel title="Top Countries">
      <div className="flex flex-col gap-2.5">
        {topCountries.slice(0, 5).map((c) => (
          <div key={c.name} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-white/70">
              {c.flag} {c.name}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-accent"
                style={{ width: `${(c.value / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-white/50">{c.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SystemStatus() {
  const items = [
    { icon: Radio, label: 'Streaming', value: 'Online', ok: true },
    { icon: Wifi, label: 'Network', value: 'Stable', ok: true },
    { icon: Server, label: 'Servers', value: 'Operational', ok: true },
    { icon: Cpu, label: 'AI Services', value: 'Running', ok: true },
  ]
  return (
    <Panel title="System Status">
      <div className="flex flex-col gap-2.5">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm text-white/80">
              <it.icon className="h-4 w-4 text-cyan-accent" />
              {it.label}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function DiscussedTopics() {
  const topics = [
    { label: 'Early Warning Systems', sentiment: 'Positive', pct: 88, tone: 'text-emerald-400' },
    { label: 'Climate Adaptation', sentiment: 'Positive', pct: 82, tone: 'text-emerald-400' },
    { label: 'Youth Empowerment', sentiment: 'Neutral', pct: 74, tone: 'text-amber-400' },
    { label: 'Cultural Heritage Protection', sentiment: 'Negative', pct: 41, tone: 'text-red-400' },
  ]
  return (
    <Panel title="Most Discussed Topics">
      <div className="flex flex-col gap-3">
        {topics.map((t) => (
          <div key={t.label} className="flex items-center justify-between text-sm">
            <span className="text-white/80">{t.label}</span>
            <span className={`text-xs font-medium ${t.tone}`}>
              {t.sentiment} · {t.pct}%
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ParticipantsPanel() {
  const points = [20, 35, 30, 48, 44, 62, 58, 75, 70, 88, 82, 96]
  const w = 240
  const h = 70
  const max = 100
  const step = w / (points.length - 1)
  const line = points.map((p, i) => `${i * step},${h - (p / max) * h}`).join(' ')
  return (
    <Panel title="Participants" action="Live">
      <p className="font-display text-3xl font-bold text-white">31,420</p>
      <p className="mb-3 flex items-center gap-1 text-xs text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" /> +2,345 today
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
        <polyline
          points={`0,${h} ${line} ${w},${h}`}
          fill="rgba(43,184,222,0.15)"
          stroke="none"
        />
        <polyline points={line} fill="none" stroke="#2bb8de" strokeWidth="2" />
      </svg>
    </Panel>
  )
}

function AiInsights() {
  return (
    <Panel title="AI Insights">
      <div className="flex gap-3 rounded-lg bg-cyan-accent/10 p-3">
        <Sparkles className="h-5 w-5 shrink-0 text-cyan-accent" />
        <p className="text-sm text-white/80">
          Engagement peaks during interactive polls. Recommend scheduling the next Q&amp;A within
          15 minutes to sustain momentum.
        </p>
      </div>
    </Panel>
  )
}

function Alerts() {
  const alerts = [
    { level: 'High Traffic', detail: 'Workshop A', tone: 'text-amber-400 bg-amber-400/10' },
    { level: 'Translation Delay', detail: 'French Channel', tone: 'text-red-400 bg-red-400/10' },
  ]
  return (
    <Panel title="Alerts">
      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <div key={a.level} className={`flex items-center gap-2 rounded-lg p-2.5 ${a.tone}`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">{a.level}</p>
              <p className="opacity-70">{a.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function CommandCenter({ pages }: { pages: TogglePageView[] }) {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-4 p-4 md:p-6">
      <PageVisibilityPanel pages={pages} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <StreamGrid />
          <AnalyticsBars />
          <TopCountriesPanel />
        </div>
        <div className="flex flex-col gap-4">
          <SystemStatus />
          <DiscussedTopics />
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-icesco-blue to-icesco p-4">
            <Users className="h-8 w-8 text-cyan-accent" />
            <div>
              <p className="font-display text-2xl font-bold text-white">31,420</p>
              <p className="text-xs text-white/70">Active participants right now</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <ParticipantsPanel />
          <AiInsights />
          <Alerts />
        </div>
      </div>
    </main>
  )
}
