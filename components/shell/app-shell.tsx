import type { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { resolveAvatar } from '@/lib/avatar'
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

  return (
    <AppShellClient
      title={title}
      right={right}
      user={user ? { name: user.name, avatar: resolveAvatar(user) } : null}
    >
      {children}
    </AppShellClient>
  )
}
