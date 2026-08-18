'use client'

import { useState } from 'react'
import { Bot, Send, Search, Sparkles, FileText, Languages } from 'lucide-react'
import { aiSuggestions } from '@/lib/data'
import { useLocale } from '@/lib/i18n'

type Message = { role: 'user' | 'ai'; text: string }

const suggestionIcons = [Search, Sparkles, FileText, Languages]

export function Concierge() {
  const { t } = useLocale()
  const [messages, setMessages] = useState<Message[]>([])
  const [value, setValue] = useState('')
  const started = messages.length > 0

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'ai', text: t('ai.reply') },
    ])
    setValue('')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-8">
            {!started ? (
              <div className="my-auto">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-icesco-blue to-cyan-accent shadow-lg shadow-icesco-blue/20">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-balance font-display text-2xl font-bold text-foreground md:text-3xl">
                  {t('ai.greeting')}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">{t('ai.howCanIHelp')}</p>

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
              placeholder={t('home.aiCard.placeholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label={t('ai.sendMessage')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-icesco-blue text-white transition-colors hover:bg-icesco"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
  )
}
