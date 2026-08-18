'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, UserPlus, Check, MessageCircle } from 'lucide-react'
import { markAllNotificationsRead } from '@/lib/actions/notifications'
import { cn } from '@/lib/utils'
import type { NotificationView } from '@/lib/notifications'

const icons = {
  connection_request: UserPlus,
  connection_accepted: Check,
  message: MessageCircle,
} as const

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function NotificationBell({
  notifications,
  unreadCount,
  immersive,
}: {
  notifications: NotificationView[]
  unreadCount: number
  immersive: boolean
}) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(unreadCount)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setUnread(unreadCount), [unreadCount])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      setUnread(0)
      startTransition(() => markAllNotificationsRead())
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggle}
        className={cn(
          'relative hidden h-9 w-9 items-center justify-center rounded-full transition-colors sm:flex',
          immersive
            ? 'text-white/60 hover:bg-white/10 hover:text-white'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-forum-orange ring-2 ring-card" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
          </div>
          <div className="scrollbar-thin max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
            {notifications.map((n) => {
              const Icon = icons[n.type]
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/40',
                    !n.read && 'bg-accent/20',
                  )}
                >
                  {n.actor ? (
                    <img src={n.actor.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-icesco-blue">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{n.body}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-icesco-blue" />}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
