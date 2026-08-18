'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, CircleDot, Lightbulb, RefreshCw } from 'lucide-react'
import { aiKeyPoints, aiDecisions } from '@/lib/data'

/** Cadence du rafraichissement automatique cote UI. Doit rester cohérente
 * avec aiConfig.liveSummary.autoCycleMinutes (lib/ai/config.ts) — dupliquee
 * ici plutot qu'importee car ce composant est cote client et ce fichier de
 * config est reserve au serveur (il lit des variables d'environnement). */
const AUTO_REFRESH_MS = 10 * 60 * 1000

interface Props {
  /** Identifiant de la session live. A rendre dynamique (issu de l'URL ou du
   * ProgramSession en cours) une fois la page /live liee a une session
   * precise plutot qu'affichee de facon statique. */
  sessionId?: string
  className?: string
}

interface SummaryState {
  keyPoints: string[]
  decisions: string[]
  loading: boolean
  usingFallback: boolean
}

export function AiSummaryPanel({ sessionId = 'current-live-session', className = '' }: Props) {
  // Tant qu'aucun resume reel n'a encore ete genere (pipeline STT/LLM pas
  // encore branche en amont), on affiche les exemples de lib/data.ts plutot
  // qu'un panneau vide — clairement marque comme tel dans l'UI.
  const [state, setState] = useState<SummaryState>({
    keyPoints: aiKeyPoints,
    decisions: aiDecisions,
    loading: false,
    usingFallback: true,
  })

  const fetchSummary = useCallback(
    async (mode: 'auto' | 'on-demand') => {
      setState((s) => ({ ...s, loading: true }))
      try {
        const response =
          mode === 'auto'
            ? await fetch(`/api/ai/live-summary?sessionId=${encodeURIComponent(sessionId)}`)
            : await fetch('/api/ai/live-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              })

        if (!response.ok) throw new Error('Reponse non-OK')
        const data = await response.json()

        // Un transcript encore vide donne des tableaux vides — dans ce cas on
        // garde l'affichage precedent plutot que de vider le panneau.
        if (data.keyPoints?.length || data.decisions?.length) {
          setState({
            keyPoints: data.keyPoints,
            decisions: data.decisions,
            loading: false,
            usingFallback: false,
          })
        } else {
          setState((s) => ({ ...s, loading: false }))
        }
      } catch {
        setState((s) => ({ ...s, loading: false }))
      }
    },
    [sessionId],
  )

  useEffect(() => {
    const interval = setInterval(() => fetchSummary('auto'), AUTO_REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchSummary])

  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-white/10 bg-navy-900 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-accent/15">
            <Sparkles className="h-4 w-4 text-cyan-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Summary</p>
            <p className="text-[11px] text-white/50">
              {state.usingFallback ? 'Example — awaiting live transcript' : 'Updated live'}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchSummary('on-demand')}
          disabled={state.loading}
          aria-label="Résumer maintenant"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          Key Points
        </p>
        <ul className="flex flex-col gap-2">
          {state.keyPoints.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-white/80">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-accent" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          Decisions &amp; Recommendations
        </p>
        <ul className="flex flex-col gap-2">
          {state.decisions.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-white/80">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forum-orange" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
