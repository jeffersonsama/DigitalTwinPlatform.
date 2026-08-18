'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Search, Sun, Moon, Monitor } from 'lucide-react'
import { useLocale, type Locale, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { NotificationBell } from './notification-bell'
import type { NotificationView } from '@/lib/notifications'

export interface CurrentUser {
  name: string
  avatar: string
  isAdmin: boolean
  xp: number
  level: number
  levelTitle: string
  xpMax: number
}

const THEME_CYCLE: Array<{ value: 'light' | 'dark' | 'system'; icon: typeof Sun; labelKey: TranslationKey }> = [
  { value: 'light', icon: Sun, labelKey: 'shell.theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'shell.theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'shell.theme.system' },
]

export function ThemeToggle({ immersive = false }: { immersive?: boolean }) {
  const { theme, setTheme } = useTheme()
  const { t } = useLocale()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentIndex = THEME_CYCLE.findIndex((c) => c.value === theme)
  const current = mounted ? THEME_CYCLE[currentIndex === -1 ? 2 : currentIndex] : THEME_CYCLE[2]
  const Icon = current.icon
  const currentLabel = t(current.labelKey)

  return (
    <button
      type="button"
      aria-label={mounted ? t('shell.theme.ariaLabel', { label: currentLabel }) : t('shell.theme.toggle')}
      title={mounted ? currentLabel : undefined}
      onClick={() => setTheme(THEME_CYCLE[(Math.max(currentIndex, 0) + 1) % THEME_CYCLE.length].value)}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
        immersive
          ? 'text-white/60 hover:bg-white/10 hover:text-white'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {mounted ? <Icon className="h-[18px] w-[18px]" /> : <span className="h-[18px] w-[18px]" />}
    </button>
  )
}

const LOCALE_OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'ar', label: 'AR' },
]

export function LanguageSwitcher({ immersive }: { immersive: boolean }) {
  const { locale, setLocale, t } = useLocale()
  return (
    <select
      aria-label={t('language')}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={cn(
        'h-9 rounded-full border bg-transparent px-3 text-xs font-semibold tracking-wide',
        immersive
          ? 'border-white/15 text-white/70 hover:text-white'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {LOCALE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-foreground">
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function TopBar({
  immersive,
  title,
  right,
  user,
  notifications,
  unreadCount,
}: {
  immersive: boolean
  title?: string
  right?: ReactNode
  user: CurrentUser | null
  notifications: NotificationView[]
  unreadCount: number
}) {
  const { locale, t } = useLocale()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6',
        immersive ? 'border-white/10 bg-navy-950/80' : 'border-border bg-card/90',
      )}
    >
      {title && (
        <h1
          className={cn(
            'truncate font-display text-lg font-semibold tracking-tight',
            immersive ? 'text-white' : 'text-foreground',
          )}
        >
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {right}
        <button
          aria-label={t('search')}
          className={cn(
            'hidden h-9 w-9 items-center justify-center rounded-full transition-colors sm:flex',
            immersive
              ? 'text-white/60 hover:bg-white/10 hover:text-white'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        {user && <NotificationBell notifications={notifications} unreadCount={unreadCount} immersive={immersive} />}

        <LanguageSwitcher immersive={immersive} />
        {!immersive && <ThemeToggle />}

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/passport"
              title={`${user.levelTitle} · ${user.xp.toLocaleString(locale)} / ${user.xpMax.toLocaleString(locale)} XP`}
              className={cn(
                'hidden items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors sm:flex',
                immersive ? 'bg-white/10 text-white/80 hover:bg-white/15' : 'bg-accent text-icesco-blue hover:bg-accent/80',
              )}
            >
              <span className="whitespace-nowrap">Niv. {user.level}</span>
              <span
                className={cn('h-1.5 w-12 overflow-hidden rounded-full', immersive ? 'bg-white/15' : 'bg-icesco-blue/15')}
              >
                <span
                  className={cn('block h-full rounded-full', immersive ? 'bg-cyan-accent' : 'bg-icesco-blue')}
                  style={{ width: `${Math.min(100, Math.round((user.xp / Math.max(user.xpMax, 1)) * 100))}%` }}
                />
              </span>
              <span className="whitespace-nowrap">{user.xp.toLocaleString(locale)} XP</span>
            </Link>
            {user.isAdmin && (
              <span
                className={cn(
                  'hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline',
                  immersive ? 'bg-white/10 text-cyan-accent' : 'bg-accent text-icesco-blue',
                )}
              >
                {t('shell.admin')}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title={t('shell.logOut', { name: user.name })}
              className={cn(
                'flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-80',
                immersive ? 'bg-gradient-to-br from-cyan-accent to-icesco-blue' : 'bg-accent',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt="" className="h-full w-full" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              immersive ? 'bg-white text-icesco hover:bg-white/90' : 'bg-icesco-blue text-white hover:bg-icesco',
            )}
          >
            {t('shell.logIn')}
          </Link>
        )}
      </div>
    </header>
  )
}
