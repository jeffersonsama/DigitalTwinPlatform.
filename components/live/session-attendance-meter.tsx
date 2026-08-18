'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { HEARTBEAT_EVENT } from '@/components/shell/presence-heartbeat'
import { cn } from '@/lib/utils'

export interface SessionAttendanceMeterProps {
  sessionTitle: string
  initialActiveSeconds: number
  thresholdSeconds: number
  initialSuivi: boolean
}

function formatMinutes(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.max(0, Math.floor(totalSeconds % 60))
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Décompte d'assiduité affiché pendant qu'un panel est en direct. Le temps affiché suit le
 * heartbeat global (components/shell/presence-heartbeat.tsx) — il ne fait que refléter le
 * temps déjà validé côté serveur, avec un ticking local entre deux battements pour rester lisible
 * seconde par seconde. Le certificat de panel et l'XP restent décidés uniquement côté serveur
 * (lib/gamification/presence.ts). */
export function SessionAttendanceMeter({
  sessionTitle,
  initialActiveSeconds,
  thresholdSeconds,
  initialSuivi,
}: SessionAttendanceMeterProps) {
  const [activeSeconds, setActiveSeconds] = useState(initialActiveSeconds)
  const [suivi, setSuivi] = useState(initialSuivi)

  useEffect(() => {
    function onHeartbeat(event: Event) {
      const detail = (event as CustomEvent).detail as { type?: string; activeSeconds?: number; suivi?: boolean } | undefined
      if (!detail || detail.type !== 'panel' || typeof detail.activeSeconds !== 'number') return
      setActiveSeconds(detail.activeSeconds)
      if (detail.suivi) setSuivi(true)
    }
    window.addEventListener(HEARTBEAT_EVENT, onHeartbeat)
    return () => window.removeEventListener(HEARTBEAT_EVENT, onHeartbeat)
  }, [])

  useEffect(() => {
    if (suivi) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') setActiveSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [suivi])

  const pct = Math.min(100, Math.round((activeSeconds / Math.max(thresholdSeconds, 1)) * 100))
  const remaining = Math.max(0, thresholdSeconds - activeSeconds)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
          {suivi ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-icesco-teal" />
          ) : (
            <Clock className="h-4 w-4 shrink-0 text-forum-orange" />
          )}
          <span className="truncate">{suivi ? 'Panel validé' : `Assiduité — ${sessionTitle}`}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatMinutes(activeSeconds)} / {formatMinutes(thresholdSeconds)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all', suivi ? 'bg-icesco-teal' : 'bg-forum-orange')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {suivi
          ? 'Certificat de panel émis dans votre Passeport.'
          : `Encore ${formatMinutes(remaining)} de présence active pour valider ce panel.`}
      </p>
    </div>
  )
}
