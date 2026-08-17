'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Subtitles,
  Radio,
} from 'lucide-react'

const tabs = ['Live Translation', 'AI Summary', 'Poll', 'Q&A', 'Resources', 'Notes']

/** Cadence de rafraichissement de la fenetre glissante cote UI — doit rester
 * cohérente avec aiConfig.liveSummary.resourceWindowSeconds (lib/ai/config.ts),
 * duplique ici pour la meme raison que dans ai-summary-panel.tsx (ce composant
 * est cote client, la config lit des variables d'environnement serveur). */
const RESOURCES_POLL_MS = 15 * 1000

interface LiveResource {
  passageId: string
  texte: string
}

interface Props {
  /** Voir la note equivalente dans ai-summary-panel.tsx : a rendre dynamique
   * une fois la page /live liee a une session ProgramSession precise. */
  sessionId?: string
}

export function LiveVideo({ sessionId = 'current-live-session' }: Props) {
  const [playing, setPlaying] = useState(true)
  const [tab, setTab] = useState('Live Translation')
  const [resources, setResources] = useState<LiveResource[]>([])
  const [resourcesAvailable, setResourcesAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch(
          `/api/ai/live-resources?sessionId=${encodeURIComponent(sessionId)}`,
        )
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (cancelled) return
        setResourcesAvailable(Boolean(data.available))
        if (data.resources?.length) setResources(data.resources)
      } catch {
        // Silencieux : un echec ponctuel de sondage ne doit pas casser l'UI,
        // le prochain cycle reessaiera de lui-meme.
      }
    }

    poll()
    const interval = setInterval(poll, RESOURCES_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <Image
          src="/images/live-speaker.png"
          alt="Live keynote speaker at the podium"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 700px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Live badge + viewers */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
            <Radio className="h-3 w-3" />
            LIVE
          </span>
          <span className="rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
            2.3K watching
          </span>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-12 px-4">
          <h2 className="text-balance font-display text-lg font-semibold text-white md:text-xl">
            Building Resilient Communities in a Changing World
          </h2>
        </div>

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
            className="text-white/90 hover:text-white"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <Volume2 className="h-5 w-5 text-white/90" />
          <div className="relative h-1 flex-1 rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-cyan-accent" />
          </div>
          <span className="text-xs text-white/80">42:18</span>
          <Subtitles className="h-5 w-5 text-white/90" />
          <Maximize className="h-5 w-5 text-white/90" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-navy-900 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-cyan-accent text-navy-950'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-navy-900 p-4 text-sm text-white/70">
        {tab === 'Live Translation' && (
          <p>
            <span className="font-semibold text-cyan-accent">EN → FR:</span> « Les systèmes
            d&apos;alerte précoce sauvent des vies. La collaboration transfrontalière est
            essentielle pour bâtir des communautés résilientes… »
          </p>
        )}
        {tab === 'AI Summary' && <p>Real-time AI summary is shown in the panel on the right.</p>}
        {tab === 'Poll' && <p>Live poll: “What is the top priority for resilient cities?” — 4 options open.</p>}
        {tab === 'Q&A' && <p>18 questions submitted · 6 answered live by the panel.</p>}
        {tab === 'Resources' &&
          (resources.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {resources.map((r) => (
                <li key={r.passageId} className="border-l-2 border-cyan-accent pl-2">
                  {r.texte}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {resourcesAvailable
                ? 'Aucune ressource correspondante trouvée pour le moment.'
                : "En attente de transcript en direct pour faire remonter des ressources pertinentes."}
            </p>
          ))}
        {tab === 'Notes' && <p>Your private notes for this session are saved automatically.</p>}
      </div>
    </div>
  )
}
