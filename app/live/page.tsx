import { AppShell } from '@/components/shell/app-shell'
import { LiveVideo } from '@/components/live/live-video'
import { Camera360Panel } from '@/components/live/camera-360-panel'
import { LiveTabsPanel } from '@/components/live/live-tabs-panel'
import { LiveChatPanel } from '@/components/live/live-chat-panel'
import { YoutubeChatPanel } from '@/components/live/youtube-chat-panel'
import { SpeakerStrip } from '@/components/live/speaker-strip'
import { LiveRoomProvider } from '@/components/live/live-room-provider'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export default async function LivePage() {
  await requireEnabledPage('live')

  const [user, resources, { t }] = await Promise.all([
    getCurrentUser(),
    prisma.resource.findMany({ where: { featured: true }, take: 3 }),
    getTranslations(),
  ])

  const note = user ? await prisma.liveNote.findUnique({ where: { userId: user.id } }) : null

  return (
    <AppShell title={t('live.pageTitle')}>
      <LiveRoomProvider isLoggedIn={!!user}>
        <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <LiveVideo />
            <Camera360Panel />
            <SpeakerStrip />
          </div>
          <LiveTabsPanel
            initialNote={note?.body ?? ''}
            isLoggedIn={!!user}
            resources={resources.map((r) => ({ id: r.id, title: r.title, type: r.type }))}
          />
          <div className="flex h-full flex-col gap-4">
            <LiveChatPanel />
            <YoutubeChatPanel />
          </div>
        </main>
      </LiveRoomProvider>
    </AppShell>
  )
}
