'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, Send, X, ArrowUpRight } from 'lucide-react'

const quickReplies = [
  'What sessions are live now?',
  'Show me the program',
  'How do I earn a certificate?',
]

export function AiAssistantCard() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm your forum assistant. Ask me anything about sessions, speakers, or the program." },
  ])
  const [value, setValue] = useState('')

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'ai', text: 'Here is what I found for you — check the Live page and Knowledge Hub for detailed resources.' },
    ])
    setValue('')
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Bot className="h-4 w-4 text-icesco-blue" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <button aria-label="Close" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-thin flex max-h-64 min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'self-end bg-icesco-blue text-white'
                : 'self-start bg-secondary text-foreground'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div className="mt-1 flex flex-wrap gap-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-icesco-blue hover:text-icesco-blue"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(value)
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask me anything…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-icesco-blue text-white transition-colors hover:bg-icesco"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <Link
          href="/ai"
          className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-icesco-blue hover:underline"
        >
          Open full AI Concierge
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
