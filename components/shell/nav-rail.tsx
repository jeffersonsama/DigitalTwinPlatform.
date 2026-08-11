'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { primaryNav, utilityNav, type NavItem } from '@/lib/nav'
import { useLocale, type TranslationKey } from '@/lib/i18n'
import { RailLogo } from '@/components/brand/rail-logo'
import { cn } from '@/lib/utils'

/** Collapsed width in Tailwind's spacing scale (w-16 = 4rem = 64px). */
export const RAIL_COLLAPSED_CLASS = 'w-16'

function RailLink({
  item,
  active,
  expanded,
  label,
}: {
  item: NavItem
  active: boolean
  expanded: boolean
  label: string
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={expanded ? undefined : label}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-cyan-accent/15 text-cyan-accent' : 'text-white/70 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap transition-all duration-150',
          expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
        )}
      >
        {label}
      </span>
    </Link>
  )
}

export function NavRail() {
  const pathname = usePathname()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useLocale()
  const expanded = pinned || hovered

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r border-white/10 bg-navy-950 transition-[width] duration-200 ease-out',
        expanded ? 'w-60' : RAIL_COLLAPSED_CLASS,
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-2">
        <RailLogo expanded={expanded} />
      </div>

      <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-2">
        {primaryNav.map((item) => (
          <RailLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            expanded={expanded}
            label={t(item.key as TranslationKey)}
          />
        ))}
        <div className="my-2 border-t border-white/10" />
        {utilityNav.map((item) => (
          <RailLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            expanded={expanded}
            label={t(item.key as TranslationKey)}
          />
        ))}
      </nav>

      <button
        type="button"
        aria-label={pinned ? 'Collapse navigation' : 'Pin navigation open'}
        onClick={() => setPinned((v) => !v)}
        className="flex h-12 shrink-0 items-center gap-3 border-t border-white/10 px-3.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        {pinned ? <PanelLeftClose className="h-5 w-5 shrink-0" /> : <PanelLeftOpen className="h-5 w-5 shrink-0" />}
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap text-sm transition-all duration-150',
            expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
          )}
        >
          {pinned ? 'Collapse' : 'Pin open'}
        </span>
      </button>
    </aside>
  )
}
