import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { MessagesInbox } from '@/components/messaging/messages-inbox'
import { requireUser } from '@/lib/auth'
import { getConversations } from '@/lib/messages'

export const metadata: Metadata = {
  title: 'Messages | ICESCO Crisis Forum 2026',
  description: 'Direct messages with delegates you have connected with.',
}

export default async function MessagesPage() {
  const user = await requireUser()
  const conversations = await getConversations(user.id)

  return (
    <AppShell title="Messages">
      <MessagesInbox viewerId={user.id} conversations={conversations} activeUserId={null} activeMessages={[]} />
    </AppShell>
  )
}
