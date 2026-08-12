import Link from 'next/link'
import { Target, Globe2, Users, CalendarClock, ArrowRight } from 'lucide-react'

function formatNum(n: number) {
  return n.toLocaleString('en-US')
}

export function StatRow({
  countriesConnected,
  participantsOnline,
  participantsDelta,
  sessionsToday,
}: {
  countriesConnected: number
  participantsOnline: number
  participantsDelta: number
  sessionsToday: number
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-icesco to-icesco-blue p-5 text-white">
        <div>
          <div className="flex items-center gap-2 text-cyan-accent">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Today&apos;s Mission</span>
          </div>
          <p className="mt-3 text-sm font-medium leading-snug text-white/90">
            Strengthen Early Warning Systems in Our Communities
          </p>
        </div>
        <Link
          href="/crisis-simulation"
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-icesco transition-colors hover:bg-white/90"
        >
          Start Mission
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <StatCard icon={Globe2} label="Countries Connected" value={formatNum(countriesConnected)} sub="Member States" />
      <StatCard
        icon={Users}
        label="Participants Online"
        value={formatNum(participantsOnline)}
        sub={`+${formatNum(participantsDelta)} today`}
        accent
      />
      <StatCard icon={CalendarClock} label="Sessions Today" value={formatNum(sessionsToday)} sub="Live & On-demand" />
    </section>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Globe2
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
          <Icon className="h-4 w-4 text-icesco-blue" />
        </div>
      </div>
      <div className="mt-4">
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
        <p className={`mt-1 text-xs ${accent ? 'text-icesco-teal' : 'text-muted-foreground'}`}>
          {sub}
        </p>
      </div>
    </div>
  )
}
