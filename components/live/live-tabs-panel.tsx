'use client'

import { useState } from 'react'
import { AiSummaryPanel } from '@/components/live/ai-summary-panel'
import { LivePollTab } from '@/components/live/tabs/live-poll-tab'
import { LiveQaTab } from '@/components/live/tabs/live-qa-tab'
import { LiveNotesTab } from '@/components/live/tabs/live-notes-tab'
import { LiveResourcesTab, type LiveResourceView } from '@/components/live/tabs/live-resources-tab'
import { useLocale, type TranslationKey } from '@/lib/i18n'

const tabs = ['AI Summary', 'Live Translation', 'Poll', 'Q&A', 'Resources', 'Notes'] as const
const tabLabelKeys: Record<(typeof tabs)[number], TranslationKey> = {
  'AI Summary': 'live.aiSummary.title',
  'Live Translation': 'live.tabs.liveTranslation',
  Poll: 'live.tabs.poll',
  'Q&A': 'live.tabs.qa',
  Resources: 'live.tabs.resources',
  Notes: 'live.tabs.notes',
}

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
  const { t } = useLocale()
  const [tab, setTab] = useState<(typeof tabs)[number]>('AI Summary')

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-navy-900 p-1">
        {tabs.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === tabKey
                ? 'bg-cyan-accent text-navy-950'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t(tabLabelKeys[tabKey])}
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
