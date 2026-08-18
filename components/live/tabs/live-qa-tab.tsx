'use client'

import { useState } from 'react'
import { ArrowBigUp, Send } from 'lucide-react'
import { useLiveRoom } from '@/components/live/live-room-provider'
import { useLocale } from '@/lib/i18n'

export function LiveQaTab() {
  const { questions, ask, upvote, isLoggedIn } = useLiveRoom()
  const { t } = useLocale()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    const text = value.trim()
    if (!text) return
    const res = await ask(text)
    if (res.error) {
      setError(res.error)
      return
    }
    setError('')
    setValue('')
  }

  async function handleUpvote(questionId: string) {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    await upvote(questionId)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-thin flex max-h-64 flex-col gap-2 overflow-y-auto">
        {questions.length === 0 && <p className="text-white/60">{t('live.qa.none')}</p>}
        {questions.map((q) => (
          <div key={q.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-navy-950 p-3">
            <button
              onClick={() => handleUpvote(q.id)}
              aria-label={t('live.qa.upvote')}
              className="flex flex-col items-center gap-0.5 text-white/60 transition-colors hover:text-cyan-accent"
            >
              <ArrowBigUp className="h-4 w-4" />
              <span className="text-[11px] font-semibold">{q.upvotes}</span>
            </button>
            <div className="min-w-0">
              <p className="text-sm text-white/90">{q.body}</p>
              <p className="mt-0.5 text-[11px] text-white/40">{q.authorName}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAsk} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isLoggedIn ? t('live.qa.placeholderLoggedIn') : t('live.qa.placeholderLoggedOut')}
          className="flex-1 rounded-full border border-white/15 bg-navy-950 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-accent"
        />
        <button
          type="submit"
          aria-label={t('live.qa.ask')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-accent text-navy-950"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
