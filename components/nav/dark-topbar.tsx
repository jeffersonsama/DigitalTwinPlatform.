'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Grid3x3, Bell, Settings, X } from 'lucide-react'
import { primaryNav, utilityNav } from '@/lib/nav'
import { cn } from '@/lib/utils'

interface DarkTopbarProps {
  /** Title shown next to the logo, e.g. "Live Session". */
  title: string
  /** Optional content rendered at the right side of the bar. */
  right?: ReactNode
}

function MiniLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" role="img" aria-label="ICESCO">
      <g fill="none" strokeLinecap="round">
        <path d="M8 30 C 12 12, 30 6, 40 14" stroke="#1a9e8f" strokeWidth="4.5" />
        <path d="M40 18 C 36 36, 18 42, 8 34" stroke="#2bb8de" strokeWidth="4.5" />
        <path d="M15 24 C 20 18, 30 18, 34 24" stroke="#7fd4ea" strokeWidth="3.5" />
      </g>
    </svg>
  )
}

export function DarkTopbar({ title, right }: DarkTopbarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="relative z-40 border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <MiniLogo />
          <span className="font-display text-sm font-semibold text-white">
            ICESCO <span className="font-normal text-cyan-accent">{title}</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {right}
          <button
            aria-label="App launcher"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Grid3x3 className="h-[18px] w-[18px]" />}
          </button>
          <button
            aria-label="Notifications"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label="Settings"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <div className="ml-1 h-8 w-8 rounded-full bg-gradient-to-br from-cyan-accent to-icesco-blue text-center text-xs font-semibold leading-8 text-white">
            AB
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute right-4 top-14 w-72 rounded-xl border border-white/10 bg-navy-900 p-3 shadow-2xl">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Platform
          </p>
          <div className="grid grid-cols-2 gap-1">
            {[...primaryNav, ...utilityNav].map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-cyan-accent/15 text-cyan-accent'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
