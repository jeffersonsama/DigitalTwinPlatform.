import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/shell/app-shell'
import { MessagesInbox } from '@/components/messaging/messages-inbox'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { getConversations, isConnected } from '@/lib/messages'

export const metadata: Metadata = {
  title: 'Messages | ICESCO Crisis Forum 2026',
}

export default async function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await requireUser()

  if (userId === user.id || !(await isConnected(user.id, userId))) {
    redirect('/messages')
  }

  const [conversations, messages] = await Promise.all([
    getConversations(user.id),
    prisma.directMessage.findMany({
      where: {
        OR: [
          { fromUserId: user.id, toUserId: userId },
          { fromUserId: userId, toUserId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <AppShell title="Messages">
      <MessagesInbox
        viewerId={user.id}
        conversations={conversations}
        activeUserId={userId}
        activeMessages={messages.map((m) => ({
          id: m.id,
          fromUserId: m.fromUserId,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </AppShell>
  )
}
