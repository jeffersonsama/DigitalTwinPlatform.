'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { NavRail } from './nav-rail'
import { TopBar, type CurrentUser } from './top-bar'
import { isImmersivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { NotificationView } from '@/lib/notifications'

export function AppShellClient({
  children,
  title,
  right,
  user,
  notifications,
  unreadCount,
  disabledKeys,
}: {
  children: ReactNode
  title?: string
  right?: ReactNode
  user: CurrentUser | null
  notifications: NotificationView[]
  unreadCount: number
  disabledKeys: string[]
}) {
  const pathname = usePathname()
  const immersive = isImmersivePath(pathname)

  return (
    <div className={cn('flex min-h-screen', immersive ? 'bg-navy-950 text-white' : 'bg-background text-foreground')}>
      <NavRail isAdmin={user?.isAdmin ?? false} disabledKeys={disabledKeys} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          immersive={immersive}
          title={title}
          right={right}
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        {children}
      </div>
    </div>
  )
}
