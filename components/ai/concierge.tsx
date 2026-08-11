'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bot,
  Send,
  X,
  Plus,
  MessageSquare,
  Bookmark,
  Settings,
  Sparkles,
  Languages,
  Search,
  FileText,
} from 'lucide-react'
import { aiSuggestions } from '@/lib/data'

type Message = { role: 'user' | 'ai'; text: string }

const suggestionIcons = [Search, Sparkles, FileText, Languages]

const railItems = [
  { icon: Plus, label: 'New chat' },
  { icon: MessageSquare, label: 'Conversations' },
  { icon: Bookmark, label: 'Saved' },
  { icon: Settings, label: 'Settings' },
]

export function Concierge() {
  const [messages, setMessages] = useState<Message[]>([])
  const [value, setValue] = useState('')
  const started = messages.length > 0

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      {
        role: 'ai',
        text: "Here's a concise answer based on the forum knowledge base. I can also connect you with relevant sessions, experts, and documents — just ask for details.",
      },
    ])
    setValue('')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Icon rail */}
      <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-4">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-icesco-blue to-cyan-accent">
          <Bot className="h-5 w-5 text-white" />
        </div>
        {railItems.map((item) => (
          <button
            key={item.label}
            aria-label={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-icesco-blue"
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
        <Link
          href="/"
          aria-label="Exit"
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Link>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
              <Bot className="h-5 w-5 text-icesco-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Concierge</p>
              <p className="text-xs text-muted-foreground">Your smart assistant for the forum</p>
            </div>
          </div>
          <Link href="/" aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-8">
            {!started ? (
              <div className="my-auto">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-icesco-blue to-cyan-accent shadow-lg shadow-icesco-blue/20">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-balance font-display text-2xl font-bold text-foreground md:text-3xl">
                  Hello! I&apos;m your AI Concierge
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">How can I help you today?</p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {aiSuggestions.map((s, i) => {
                    const Icon = suggestionIcons[i % suggestionIcons.length]
                    return (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-icesco-blue hover:bg-accent"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-icesco-blue group-hover:bg-white">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-foreground">{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
                    {m.role === 'ai' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Bot className="h-4 w-4 text-icesco-blue" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-icesco-blue text-white'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(value)
            }}
            className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-background px-4 py-2"
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask me anything…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-icesco-blue text-white transition-colors hover:bg-icesco"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
