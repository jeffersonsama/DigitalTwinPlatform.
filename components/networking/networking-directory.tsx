'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, UserPlus, MessageCircle, Check, Clock, X, Users, ScanLine } from 'lucide-react'
import {
  sendConnectionRequest,
  cancelConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '@/lib/actions/networking'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type ConnectionState = 'none' | 'pending-sent' | 'pending-received' | 'connected'

export interface DelegateView {
  id: string
  name: string
  role: string
  country: string
  flag: string
  avatar: string
  mutual: number
  online: boolean
  connectionState: ConnectionState
}

export interface NetworkingStatView {
  label: string
  value: string
}

export function NetworkingDirectory({
  delegates,
  stats,
  isLoggedIn,
}: {
  delegates: DelegateView[]
  stats: NetworkingStatView[]
  isLoggedIn: boolean
}) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(
    () =>
      delegates.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.role.toLowerCase().includes(query.toLowerCase()) ||
          d.country.toLowerCase().includes(query.toLowerCase()),
      ),
    [delegates, query],
  )

  function guardedAction(action: () => void) {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    startTransition(action)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">{t('networking')}</h1>
            <p className="text-sm text-muted-foreground">{t('networking.subtitle')}</p>
          </div>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-1.5 rounded-lg bg-icesco-blue px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco"
        >
          <ScanLine className="h-4 w-4" /> {t('networking.scanQr')}
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('networking.searchPlaceholder')}
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-icesco-blue focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <article key={d.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <Link href={`/profile/${d.id}`} className="flex items-start gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.avatar} alt="" className="h-full w-full" />
                </div>
                {d.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-icesco-teal" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground hover:underline">{d.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{d.role}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span aria-hidden>{d.flag}</span> {d.country} · {t('networking.mutualCount', { count: d.mutual })}
                </p>
              </div>
            </Link>

            <div className="mt-auto flex gap-2">
              {d.connectionState === 'pending-received' ? (
                <>
                  <button
                    disabled={pending}
                    onClick={() => guardedAction(() => acceptConnectionRequest(d.id))}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-icesco-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> {t('networking.accept')}
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => guardedAction(() => declineConnectionRequest(d.id))}
                    aria-label={t('networking.declineName', { name: d.name })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  disabled={pending}
                  onClick={() =>
                    guardedAction(() =>
                      d.connectionState === 'pending-sent'
                        ? cancelConnectionRequest(d.id)
                        : d.connectionState === 'none'
                          ? sendConnectionRequest(d.id)
                          : undefined,
                    )
                  }
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60',
                    d.connectionState === 'connected'
                      ? 'border border-border bg-accent text-icesco-blue'
                      : d.connectionState === 'pending-sent'
                        ? 'border border-border text-muted-foreground hover:text-foreground'
                        : 'bg-icesco-blue text-white hover:bg-icesco',
                  )}
                >
                  {d.connectionState === 'connected' && <Check className="h-4 w-4" />}
                  {d.connectionState === 'pending-sent' && <Clock className="h-4 w-4" />}
                  {d.connectionState === 'none' && <UserPlus className="h-4 w-4" />}
                  {d.connectionState === 'connected'
                    ? t('profile.connectAction.connected')
                    : d.connectionState === 'pending-sent'
                      ? t('networking.requested')
                      : t('profile.connectAction.connect')}
                </button>
              )}
              {d.connectionState === 'connected' ? (
                <Link
                  href={`/messages/${d.id}`}
                  aria-label={t('networking.messageName', { name: d.name })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              ) : d.connectionState !== 'pending-received' ? (
                <button
                  disabled
                  aria-label={t('networking.messageConnectFirst', { name: d.name })}
                  title={t('networking.connectFirstTooltip')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground/40 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('networking.noMatches')}
        </p>
      )}
    </main>
  )
}
