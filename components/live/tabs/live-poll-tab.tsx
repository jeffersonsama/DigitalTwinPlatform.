'use client'

import { useState } from 'react'
import { useLiveRoom } from '@/components/live/live-room-provider'

export function LivePollTab() {
  const { poll, vote, isLoggedIn } = useLiveRoom()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!poll) {
    return <p className="text-white/60">No poll is active right now.</p>
  }

  async function handleVote(optionId: string) {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    setPending(optionId)
    setError('')
    const res = await vote(optionId)
    if (res.error) setError(res.error)
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-white">{poll.question}</p>
      <div className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const pct = poll.total > 0 ? Math.round((option.votes / poll.total) * 100) : 0
          return (
            <button
              key={option.id}
              disabled={pending === option.id}
              onClick={() => handleVote(option.id)}
              className="relative overflow-hidden rounded-lg border border-white/10 bg-navy-950 px-3 py-2 text-left text-sm transition-colors hover:border-cyan-accent disabled:opacity-60"
            >
              <div
                className="absolute inset-y-0 left-0 bg-cyan-accent/15"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between text-white/90">
                <span>{option.label}</span>
                <span className="text-white/60">{pct}%</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-white/40">{poll.total.toLocaleString()} votes</p>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
