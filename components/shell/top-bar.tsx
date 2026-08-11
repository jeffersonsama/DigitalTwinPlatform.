'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { Search, Bell, Sun, Moon, Monitor } from 'lucide-react'
import { useLocale, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const THEME_CYCLE: Array<{ value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'System theme' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentIndex = THEME_CYCLE.findIndex((t) => t.value === theme)
  const current = mounted ? THEME_CYCLE[currentIndex === -1 ? 2 : currentIndex] : THEME_CYCLE[2]
  const Icon = current.icon

  return (
    <button
      type="button"
      aria-label={mounted ? `Theme: ${current.label}. Click to change.` : 'Toggle theme'}
      title={mounted ? current.label : undefined}
      onClick={() => setTheme(THEME_CYCLE[(Math.max(currentIndex, 0) + 1) % THEME_CYCLE.length].value)}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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

function LanguageSwitcher({ immersive }: { immersive: boolean }) {
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
}: {
  immersive: boolean
  title?: string
  right?: ReactNode
}) {
  const { t } = useLocale()

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
        <button
          aria-label={t('notifications')}
          className={cn(
            'hidden h-9 w-9 items-center justify-center rounded-full transition-colors sm:flex',
            immersive
              ? 'text-white/60 hover:bg-white/10 hover:text-white'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <LanguageSwitcher immersive={immersive} />
        {!immersive && <ThemeToggle />}

        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
            immersive ? 'bg-gradient-to-br from-cyan-accent to-icesco-blue text-white' : 'bg-icesco text-white',
          )}
        >
          AB
        </div>
      </div>
    </header>
  )
}
