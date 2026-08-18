'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { HEARTBEAT_EVENT } from '@/components/shell/presence-heartbeat'
import { cn } from '@/lib/utils'

export interface ResourceReadTimerProps {
  initialSecondsSpent: number
  thresholdSeconds: number
  initialCompleted: boolean
}

/** Même principe que SessionAttendanceMeter, pour la lecture Knowledge Hub : le heartbeat
 * global (mounté dans le shell) envoie un battement par minute tant que cette page reste
 * visible, et lib/gamification/presence.ts décide seul du moment où l'XP est créditée. */
export function ResourceReadTimer({ initialSecondsSpent, thresholdSeconds, initialCompleted }: ResourceReadTimerProps) {
  const [secondsSpent, setSecondsSpent] = useState(initialSecondsSpent)
  const [completed, setCompleted] = useState(initialCompleted)

  useEffect(() => {
    function onHeartbeat(event: Event) {
      const detail = (event as CustomEvent).detail as { type?: string; activeSeconds?: number; completed?: boolean } | undefined
      if (!detail || detail.type !== 'resource' || typeof detail.activeSeconds !== 'number') return
      setSecondsSpent(detail.activeSeconds)
      if (detail.completed) setCompleted(true)
    }
    window.addEventListener(HEARTBEAT_EVENT, onHeartbeat)
    return () => window.removeEventListener(HEARTBEAT_EVENT, onHeartbeat)
  }, [])

  useEffect(() => {
    if (completed) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') setSecondsSpent((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [completed])

  const pct = Math.min(100, Math.round((secondsSpent / Math.max(thresholdSeconds, 1)) * 100))
  const remaining = Math.max(0, thresholdSeconds - secondsSpent)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {completed ? (
            <CheckCircle2 className="h-4 w-4 text-icesco-teal" />
          ) : (
            <Clock className="h-4 w-4 text-forum-orange" />
          )}
          {completed ? 'Lecture validée' : 'Lecture en cours'}
        </span>
        <span className="text-xs text-muted-foreground">{Math.min(secondsSpent, thresholdSeconds)}s / {thresholdSeconds}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all', completed ? 'bg-icesco-teal' : 'bg-forum-orange')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {completed ? '+10 XP crédités dans votre Passeport.' : `Restez encore ${remaining}s sur cette page pour valider la lecture.`}
      </p>
    </div>
  )
}
