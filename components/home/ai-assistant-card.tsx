'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, Send, X, ArrowUpRight } from 'lucide-react'
import { renderFormattedText } from '@/components/ai/formatted-text'

const quickReplies = [
  'What sessions are live now?',
  'Show me the program',
  'How do I earn a certificate?',
]

const FALLBACK_ERROR_TEXT =
  "Sorry, I couldn't get a response right now. Please try again in a moment."

type Message = { role: 'user' | 'ai'; text: string; pending?: boolean }

export function AiAssistantCard() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! I'm your forum assistant. Ask me anything about sessions, speakers, or the program." },
  ])
  const [value, setValue] = useState('')

  async function send(text: string) {
    const q = text.trim()
    if (!q) return
    setValue('')

    const history = messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.text }))

    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: '', pending: true }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, stream: true, history }),
      })

      if (!response.ok || !response.body) throw new Error('Reponse non-OK ou sans corps de flux')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''
      let firstChunkReceived = false

      while (true) {
        const { done, value: chunkValue } = await reader.read()
        if (done) break

        buffer += decoder.decode(chunkValue, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice('data:'.length).trim()
          if (payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload)
            if (event.type === 'chunk') {
              accumulated += event.text
              firstChunkReceived = true
              setMessages((m) => {
                const next = [...m]
                next[next.length - 1] = { role: 'ai', text: accumulated }
                return next
              })
            } else if (event.type === 'blocked') {
              firstChunkReceived = true
              accumulated = "I can't help with that request. Feel free to ask about the program, speakers, or forum resources instead."
              setMessages((m) => {
                const next = [...m]
                next[next.length - 1] = { role: 'ai', text: accumulated }
                return next
              })
            }
          } catch {
            // Ligne SSE incomplete entre deux lectures, ignoree volontairement.
          }
        }
      }

      if (!firstChunkReceived) {
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = { role: 'ai', text: FALLBACK_ERROR_TEXT }
          return next
        })
      }
    } catch {
      setMessages((m) => {
        const next = [...m]
        next[next.length - 1] = { role: 'ai', text: FALLBACK_ERROR_TEXT }
        return next
      })
    }
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
            {m.pending ? (
              <span className="flex gap-1" aria-label="Typing">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
              </span>
            ) : m.role === 'ai' ? (
              renderFormattedText(m.text)
            ) : (
              m.text
            )}
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