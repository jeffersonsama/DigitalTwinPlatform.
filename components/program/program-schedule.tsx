'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MapPin, User, Radio, Check, CalendarDays, Play } from 'lucide-react'
import { programDays, programSessions } from '@/lib/data'
import { cn } from '@/lib/utils'

const trackTone: Record<string, string> = {
  Plenary: 'bg-icesco/10 text-icesco',
  Keynote: 'bg-forum-orange/10 text-forum-orange',
  Panel: 'bg-icesco-blue/10 text-icesco-blue',
  Workshop: 'bg-icesco-teal/10 text-icesco-teal',
  Youth: 'bg-cyan-accent/15 text-icesco-blue',
  Tech: 'bg-icesco-blue/10 text-icesco-blue',
  Training: 'bg-icesco-teal/10 text-icesco-teal',
}

export function ProgramSchedule() {
  const [day, setDay] = useState(programDays[0].id)
  const sessions = programSessions.filter((s) => s.day === day)

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">Forum Program</h1>
          <p className="text-sm text-muted-foreground">Three days of sessions, workshops and simulations.</p>
        </div>
      </header>

      {/* Day selector */}
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        {programDays.map((d) => (
          <button
            key={d.id}
            onClick={() => setDay(d.id)}
            className={cn(
              'flex shrink-0 flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-colors',
              day === d.id
                ? 'border-icesco-blue bg-icesco-blue text-white'
                : 'border-border bg-card text-foreground hover:border-icesco-blue',
            )}
          >
            <span className="text-sm font-semibold">{d.label}</span>
            <span className={cn('text-xs', day === d.id ? 'text-white/80' : 'text-muted-foreground')}>{d.date}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <ol className="flex flex-col gap-3">
        {sessions.map((s) => (
          <li
            key={s.title}
            className={cn(
              'flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-5',
              s.status === 'live' ? 'border-forum-orange/60' : 'border-border',
            )}
          >
            {/* Time */}
            <div className="flex shrink-0 items-center gap-2 sm:w-24 sm:flex-col sm:items-start sm:gap-0.5">
              <span className="font-display text-lg font-bold text-foreground">{s.time}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {s.duration}
              </span>
            </div>

            <span className="hidden h-12 w-px shrink-0 bg-border sm:block" />

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', trackTone[s.track] ?? 'bg-secondary text-foreground')}>
                  {s.track}
                </span>
                {s.status === 'live' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-forum-orange/10 px-2 py-0.5 text-[11px] font-semibold text-forum-orange">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forum-orange" /> LIVE
                  </span>
                )}
                {s.status === 'done' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Check className="h-3 w-3 text-icesco-teal" /> Completed
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-pretty font-semibold text-foreground">{s.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {s.speaker}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {s.room}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="shrink-0 self-start sm:self-center">
              {s.status === 'live' ? (
                <Link
                  href="/live"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forum-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forum-orange/90"
                >
                  <Radio className="h-4 w-4" /> Join
                </Link>
              ) : s.status === 'done' ? (
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                  <Play className="h-3.5 w-3.5" /> Replay
                </button>
              ) : (
                <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-icesco-blue hover:text-icesco-blue">
                  Add to plan
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
