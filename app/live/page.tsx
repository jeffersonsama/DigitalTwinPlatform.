import { AppShell } from '@/components/shell/app-shell'
import { LiveVideo } from '@/components/live/live-video'
import { AiSummaryPanel } from '@/components/live/ai-summary-panel'
import { LiveChatPanel } from '@/components/live/live-chat-panel'
import { SpeakerStrip } from '@/components/live/speaker-strip'
import { DevTranscriptInjector } from '@/components/live/dev-transcript-injector'

const LIVE_SESSION_ID = 'session_1_awareness'

export default function LivePage() {
  return (
    <AppShell title="Live Session">
      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-full">
          <DevTranscriptInjector sessionId={LIVE_SESSION_ID} />
        </div>
        <div className="flex flex-col gap-4">
          <LiveVideo sessionId={LIVE_SESSION_ID} />
          <SpeakerStrip />
        </div>
        <AiSummaryPanel sessionId={LIVE_SESSION_ID} />
        <LiveChatPanel />
      </main>
    </AppShell>
  )
}