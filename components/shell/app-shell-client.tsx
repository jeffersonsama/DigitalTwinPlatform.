'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { NavRail } from './nav-rail'
import { TopBar, type CurrentUser } from './top-bar'
import { isImmersivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function AppShellClient({
  children,
  title,
  right,
  user,
}: {
  children: ReactNode
  title?: string
  right?: ReactNode
  user: CurrentUser | null
}) {
  const pathname = usePathname()
  const immersive = isImmersivePath(pathname)

  return (
    <div className={cn('flex min-h-screen', immersive ? 'bg-navy-950 text-white' : 'bg-background text-foreground')}>
      <NavRail isAdmin={user?.isAdmin ?? false} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar immersive={immersive} title={title} right={right} user={user} />
        {children}
      </div>
    </div>
  )
}
