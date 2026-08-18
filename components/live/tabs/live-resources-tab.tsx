'use client'

import { useEffect, useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

/** Cadence de sondage cote UI pour les ressources remontees par l'IA a partir
 * du transcript live — doit rester cohérente avec
 * aiConfig.liveSummary.resourceWindowSeconds (lib/ai/config.ts), dupliquee ici
 * pour la meme raison que dans ai-summary-panel.tsx (composant client, config
 * reservee au serveur). */
const AI_RESOURCES_POLL_MS = 15 * 1000

export interface LiveResourceView {
  id: string
  title: string
  type: string
}

interface AiLiveResource {
  passageId: string
  texte: string
}

export function LiveResourcesTab({
  resources,
  sessionId = 'current-live-session',
}: {
  resources: LiveResourceView[]
  sessionId?: string
}) {
  const [aiResources, setAiResources] = useState<AiLiveResource[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch(`/api/ai/live-resources?sessionId=${encodeURIComponent(sessionId)}`)
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (cancelled) return
        if (data.resources?.length) setAiResources(data.resources)
      } catch {
        // Silencieux : un echec ponctuel de sondage ne doit pas casser l'UI,
        // le prochain cycle reessaiera de lui-meme.
      }
    }

    poll()
    const interval = setInterval(poll, AI_RESOURCES_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId])

  if (resources.length === 0 && aiResources.length === 0) {
    return <p className="text-white/60">No resources shared for this session yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {aiResources.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-accent">
            <Sparkles className="h-3.5 w-3.5" /> Surfaced from what's being said
          </p>
          <ul className="flex flex-col gap-2">
            {aiResources.map((r) => (
              <li key={r.passageId} className="rounded-lg border border-cyan-accent/20 bg-navy-950 p-3 text-sm text-white/80">
                {r.texte}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          {aiResources.length > 0 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Featured</p>
          )}
          <ul className="flex flex-col gap-2">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-navy-950 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-accent/15 text-cyan-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/90">{r.title}</p>
                  <p className="text-[11px] capitalize text-white/40">{r.type}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
