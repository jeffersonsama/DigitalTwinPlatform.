'use client'

import { useState } from 'react'
import { Send, ThumbsUp, Heart, Hand } from 'lucide-react'
import { liveChat } from '@/lib/data'

export function LiveChatPanel() {
  const [messages, setMessages] = useState(liveChat)
  const [value, setValue] = useState('')

  function send(e: React.FormEvent) {
    e.preventDefault()
    const t = value.trim()
    if (!t) return
    setMessages((m) => [...m, { user: 'You', text: t, mine: true }])
    setValue('')
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-navy-900">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white">Live Chat</p>
        <span className="text-[11px] text-white/50">1,204 online</span>
      </div>

      <div className="scrollbar-thin flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.mine ? 'self-end text-right' : ''}>
            <p className="text-[11px] font-medium text-cyan-accent">{m.user}</p>
            <p
              className={`mt-0.5 inline-block max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                m.mine ? 'bg-cyan-accent text-navy-950' : 'bg-white/5 text-white/85'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
        {[ThumbsUp, Heart, Hand].map((Icon, i) => (
          <button
            key={i}
            aria-label="React"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-cyan-accent"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 rounded-full border border-white/15 bg-navy-950 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-accent"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-accent text-navy-950"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
