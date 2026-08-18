'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { primaryNav, utilityNav, adminNav, isImmersivePath, type NavItem } from '@/lib/nav'
import { useLocale, type TranslationKey } from '@/lib/i18n'
import { RailLogo } from '@/components/brand/rail-logo'
import { cn } from '@/lib/utils'

/** Collapsed width in Tailwind's spacing scale (w-16 = 4rem = 64px). */
export const RAIL_COLLAPSED_CLASS = 'w-16'

function RailLink({
  item,
  active,
  expanded,
  immersive,
  label,
  disabled,
}: {
  item: NavItem
  active: boolean
  expanded: boolean
  immersive: boolean
  label: string
  disabled?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={expanded ? (disabled ? `${label} (hidden from delegates)` : undefined) : label}
      className={cn(
        'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
        expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-3.5',
        disabled && 'opacity-40',
        active
          ? 'bg-cyan-accent/15 text-cyan-accent'
          : immersive
            ? 'text-white/70 hover:bg-white/10 hover:text-white'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
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
      {disabled && expanded && (
        <span className="ml-auto shrink-0 rounded bg-current/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide opacity-80">
          Off
        </span>
      )}
    </Link>
  )
}

export function NavRail({ isAdmin, disabledKeys }: { isAdmin: boolean; disabledKeys: string[] }) {
  const pathname = usePathname()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useLocale()
  const expanded = pinned || hovered
  const immersive = isImmersivePath(pathname)

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r transition-[width] duration-200 ease-out',
        immersive ? 'border-white/10 bg-navy-950' : 'border-border bg-card',
        expanded ? 'w-60' : RAIL_COLLAPSED_CLASS,
      )}
    >
      <div className="flex h-16 shrink-0 items-center">
        <RailLogo expanded={expanded} />
      </div>

      <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-2">
        {primaryNav
          .filter((item) => isAdmin || !disabledKeys.includes(item.key))
          .map((item) => (
            <RailLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              expanded={expanded}
              immersive={immersive}
              label={t(item.key as TranslationKey)}
              disabled={disabledKeys.includes(item.key)}
            />
          ))}
        <div className={cn('my-2 border-t', immersive ? 'border-white/10' : 'border-border')} />
        {utilityNav
          .filter((item) => !item.adminOnly || isAdmin)
          .filter((item) => isAdmin || !disabledKeys.includes(item.key))
          .map((item) => (
            <RailLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              expanded={expanded}
              immersive={immersive}
              label={t(item.key as TranslationKey)}
              disabled={disabledKeys.includes(item.key)}
            />
          ))}
        {isAdmin && (
          <>
            <div className={cn('my-2 border-t', immersive ? 'border-white/10' : 'border-border')} />
            {adminNav.map((item) => (
              <RailLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                expanded={expanded}
                immersive={immersive}
                label={t(item.key as TranslationKey)}
              />
            ))}
          </>
        )}
      </nav>

      <button
        type="button"
        aria-label={pinned ? 'Collapse navigation' : 'Pin navigation open'}
        onClick={() => setPinned((v) => !v)}
        className={cn(
          'flex h-12 shrink-0 items-center border-t py-2.5 text-sm transition-colors',
          expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-3.5',
          immersive
            ? 'border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        {pinned ? <PanelLeftClose className="h-5 w-5 shrink-0" /> : <PanelLeftOpen className="h-5 w-5 shrink-0" />}
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-150',
            expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
          )}
        >
          {pinned ? 'Collapse' : 'Pin open'}
        </span>
      </button>
    </aside>
  )
}
