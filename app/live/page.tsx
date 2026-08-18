import { AppShell } from '@/components/shell/app-shell'
import { LiveVideo } from '@/components/live/live-video'
import { Camera360Panel } from '@/components/live/camera-360-panel'
import { LiveTabsPanel } from '@/components/live/live-tabs-panel'
import { LiveChatPanel } from '@/components/live/live-chat-panel'
import { YoutubeChatPanel } from '@/components/live/youtube-chat-panel'
import { SpeakerStrip } from '@/components/live/speaker-strip'
import { LiveRoomProvider } from '@/components/live/live-room-provider'
import { SessionAttendanceMeter } from '@/components/live/session-attendance-meter'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { PANEL_ATTENDANCE_RATIO } from '@/lib/gamification/config'

export default async function LivePage() {
  await requireEnabledPage('live')

  const now = new Date()
  const [user, resources, liveSession] = await Promise.all([
    getCurrentUser(),
    prisma.resource.findMany({ where: { featured: true }, take: 3 }),
    prisma.programSession.findFirst({ where: { startsAt: { lte: now }, endsAt: { gte: now } } }),
  ])

  const note = user ? await prisma.liveNote.findUnique({ where: { userId: user.id } }) : null
  const attendance =
    user && liveSession
      ? await prisma.sessionAttendance.findUnique({ where: { userId_sessionId: { userId: user.id, sessionId: liveSession.id } } })
      : null

  return (
    <AppShell title="Live Session">
      <LiveRoomProvider isLoggedIn={!!user}>
        <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <LiveVideo />
            {user && liveSession && (
              <SessionAttendanceMeter
                sessionTitle={liveSession.title}
                initialActiveSeconds={attendance?.activeSeconds ?? 0}
                thresholdSeconds={Math.round(
                  ((liveSession.endsAt.getTime() - liveSession.startsAt.getTime()) / 1000) * PANEL_ATTENDANCE_RATIO,
                )}
                initialSuivi={attendance?.suivi ?? false}
              />
            )}
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
