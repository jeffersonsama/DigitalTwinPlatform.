'use client'

import { useState, useTransition } from 'react'
import { setPageEnabled } from '@/lib/actions/page-flags'
import { cn } from '@/lib/utils'

export interface TogglePageView {
  key: string
  label: string
  href: string
  enabled: boolean
}

function Toggle({ checked, onChange, pending }: { checked: boolean; onChange: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={pending}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-emerald-500' : 'bg-white/15',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[20px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export function PageVisibilityPanel({ pages }: { pages: TogglePageView[] }) {
  const [state, setState] = useState(pages)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function toggle(key: string, next: boolean) {
    setState((prev) => prev.map((p) => (p.key === key ? { ...p, enabled: next } : p)))
    setPendingKey(key)
    startTransition(async () => {
      await setPageEnabled(key, next)
      setPendingKey(null)
    })
  }

  return (
    <section className="rounded-xl border border-white/10 bg-navy-900 p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Page Visibility</h2>
        <span className="text-[11px] text-white/40">{state.filter((p) => !p.enabled).length} hidden</span>
      </div>
      <p className="mb-3 text-xs text-white/50">
        Turning a page off removes it from the menu for delegates and blocks the URL directly. Admins keep full access.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {state.map((p) => (
          <div
            key={p.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-white/85">{p.label}</p>
              <p className="truncate text-[11px] text-white/40">{p.href}</p>
            </div>
            <Toggle checked={p.enabled} onChange={() => toggle(p.key, !p.enabled)} pending={pendingKey === p.key} />
          </div>
        ))}
      </div>
    </section>
  )
}
