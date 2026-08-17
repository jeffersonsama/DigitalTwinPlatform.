import type { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { resolveAvatar } from '@/lib/avatar'
import { getNotifications, getUnreadCount } from '@/lib/notifications'
import { getDisabledKeys } from '@/lib/page-flags'
import { AppShellClient } from './app-shell-client'

export async function AppShell({
  children,
  title,
  right,
}: {
  children: ReactNode
  title?: string
  right?: ReactNode
}) {
  const user = await getCurrentUser()
  const [notifications, unreadCount, disabledKeys] = await Promise.all([
    user ? getNotifications(user.id) : Promise.resolve([]),
    user ? getUnreadCount(user.id) : Promise.resolve(0),
    getDisabledKeys(),
  ])

  return (
    <AppShellClient
      title={title}
      right={right}
      user={user ? { name: user.name, avatar: resolveAvatar(user), isAdmin: user.accessRole === 'admin' } : null}
      notifications={notifications}
      unreadCount={unreadCount}
      disabledKeys={[...disabledKeys]}
    >
      {children}
    </AppShellClient>
  )
}
