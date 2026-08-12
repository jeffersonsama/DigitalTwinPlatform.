import { Check, Radio, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineStep {
  time: string
  label: string
  status: 'done' | 'live' | 'upcoming'
}

export function CrisisTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Crisis Timeline
      </h2>
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-0">
        {steps.map((step, i) => (
          <div key={`${step.time}-${step.label}`} className="relative flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center">
            {i < steps.length - 1 && (
              <span className="absolute left-[11px] top-6 h-[calc(100%+1rem)] w-0.5 bg-border md:left-auto md:right-[-50%] md:top-3 md:h-0.5 md:w-full" />
            )}
            <div
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                step.status === 'done' && 'bg-icesco-teal text-white',
                step.status === 'live' && 'bg-forum-orange text-white',
                step.status === 'upcoming' && 'border-2 border-border bg-card text-muted-foreground',
              )}
            >
              {step.status === 'done' && <Check className="h-3.5 w-3.5" />}
              {step.status === 'live' && <Radio className="h-3.5 w-3.5" />}
              {step.status === 'upcoming' && <Clock className="h-3.5 w-3.5" />}
            </div>
            <div className="md:mt-2">
              <p className="text-xs font-semibold text-foreground">{step.time}</p>
              <p className="text-xs text-muted-foreground">{step.label}</p>
              {step.status === 'live' && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-forum-orange/10 px-2 py-0.5 text-[10px] font-semibold text-forum-orange">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forum-orange" />
                  LIVE
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
