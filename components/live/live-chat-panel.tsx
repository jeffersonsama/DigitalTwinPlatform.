'use client'

import { useState } from 'react'
import { Send, ThumbsUp, Heart, Hand } from 'lucide-react'
import { useLiveRoom } from '@/components/live/live-room-provider'
import { useLocale } from '@/lib/i18n'

export function LiveChatPanel() {
  const { messages, sendMessage, isLoggedIn, presenceCount } = useLiveRoom()
  const { t } = useLocale()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    const text = value.trim()
    if (!text) return
    const res = await sendMessage(text)
    if (res.error) {
      setError(res.error)
      return
    }
    setError('')
    setValue('')
  }

  return (
    <div className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-white/10 bg-navy-900">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white">{t('live.chat.title')}</p>
        <span className="text-[11px] text-white/50">{t('live.chat.onlineCount', { count: presenceCount.toLocaleString() })}</span>
      </div>

      <div className="scrollbar-thin flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id}>
            <p className="text-[11px] font-medium text-cyan-accent">{m.authorName}</p>
            <p className="mt-0.5 inline-block max-w-[85%] rounded-2xl bg-white/5 px-3 py-1.5 text-sm text-white/85">
              {m.body}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
        {[ThumbsUp, Heart, Hand].map((Icon, i) => (
          <button
            key={i}
            aria-label={t('live.chat.react')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-cyan-accent"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex flex-col gap-1.5 border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isLoggedIn ? t('live.chat.placeholderLoggedIn') : t('live.chat.placeholderLoggedOut')}
            className="flex-1 rounded-full border border-white/15 bg-navy-950 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-accent"
          />
          <button
            type="submit"
            aria-label={t('home.aiCard.send')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-accent text-navy-950"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </form>
    </div>
  )
}
