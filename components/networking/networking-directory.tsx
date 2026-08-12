'use client'

import { useMemo, useState } from 'react'
import { Search, UserPlus, MessageCircle, Check, Users } from 'lucide-react'
import { delegates, networkingStats } from '@/lib/data'
import { cn } from '@/lib/utils'

export function NetworkingDirectory() {
  const [query, setQuery] = useState('')
  const [connected, setConnected] = useState<string[]>([])

  const filtered = useMemo(
    () =>
      delegates.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.role.toLowerCase().includes(query.toLowerCase()) ||
          d.country.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  function toggle(name: string) {
    setConnected((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]))
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">Networking</h1>
          <p className="text-sm text-muted-foreground">Connect with delegates from across the Islamic world.</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {networkingStats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search delegates by name, role or country…"
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-icesco-blue focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {/* Directory */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => {
          const isConnected = connected.includes(d.name)
          return (
            <article key={d.name} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-icesco-blue to-cyan-accent text-sm font-semibold text-white">
                    {d.initials}
                  </div>
                  {d.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-icesco-teal" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{d.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{d.role}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span aria-hidden>{d.flag}</span> {d.country} · {d.mutual} mutual
                  </p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => toggle(d.name)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isConnected
                      ? 'border border-border bg-accent text-icesco-blue'
                      : 'bg-icesco-blue text-white hover:bg-icesco',
                  )}
                >
                  {isConnected ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isConnected ? 'Connected' : 'Connect'}
                </button>
                <button
                  aria-label={`Message ${d.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No delegates match your search.
        </p>
      )}
    </main>
  )
}
