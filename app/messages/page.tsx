import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { MessagesInbox } from '@/components/messaging/messages-inbox'
import { requireUser, requireEnabledPage } from '@/lib/auth'
import { getConversations } from '@/lib/messages'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('messages')} | ICESCO Crisis Forum 2026`, description: t('messaging.pageDescription') }
}

export default async function MessagesPage() {
  await requireEnabledPage('messages')
  const user = await requireUser()
  const conversations = await getConversations(user.id)
  const { t } = await getTranslations()

  return (
    <AppShell title={t('messages')}>
      <MessagesInbox viewerId={user.id} conversations={conversations} activeUserId={null} activeMessages={[]} />
    </AppShell>
  )
}
