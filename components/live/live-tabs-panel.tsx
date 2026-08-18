'use client'

import { useState } from 'react'
import { AiSummaryPanel } from '@/components/live/ai-summary-panel'
import { LivePollTab } from '@/components/live/tabs/live-poll-tab'
import { LiveQaTab } from '@/components/live/tabs/live-qa-tab'
import { LiveNotesTab } from '@/components/live/tabs/live-notes-tab'
import { LiveResourcesTab, type LiveResourceView } from '@/components/live/tabs/live-resources-tab'

const tabs = ['AI Summary', 'Live Translation', 'Poll', 'Q&A', 'Resources', 'Notes'] as const

export function LiveTabsPanel({
  sessionId,
  initialNote,
  isLoggedIn,
  resources,
}: {
  sessionId: string
  initialNote: string
  isLoggedIn: boolean
  resources: LiveResourceView[]
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('AI Summary')

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-navy-900 p-1">
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

      {tab === 'AI Summary' ? (
        <AiSummaryPanel sessionId={sessionId} className="flex-1" />
      ) : (
        <div className="flex-1 rounded-xl border border-white/10 bg-navy-900 p-4 text-sm text-white/70">
          {tab === 'Live Translation' && (
            <p>
              <span className="font-semibold text-cyan-accent">EN → FR:</span> « Les systèmes
              d&apos;alerte précoce sauvent des vies. La collaboration transfrontalière est
              essentielle pour bâtir des communautés résilientes… »
            </p>
          )}
          {tab === 'Poll' && <LivePollTab />}
          {tab === 'Q&A' && <LiveQaTab />}
          {tab === 'Resources' && <LiveResourcesTab resources={resources} sessionId={sessionId} />}
          {tab === 'Notes' && <LiveNotesTab initialNote={initialNote} isLoggedIn={isLoggedIn} />}
        </div>
      )}
    </div>
  )
}
