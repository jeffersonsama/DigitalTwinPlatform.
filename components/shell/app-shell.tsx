'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { NavRail } from './nav-rail'
import { TopBar } from './top-bar'
import { isImmersivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  title,
  right,
}: {
  children: ReactNode
  title?: string
  right?: ReactNode
}) {
  const pathname = usePathname()
  const immersive = isImmersivePath(pathname)

  return (
    <div className={cn('flex min-h-screen', immersive ? 'bg-navy-950 text-white' : 'bg-background text-foreground')}>
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar immersive={immersive} title={title} right={right} />
        {children}
      </div>
    </div>
  )
}
