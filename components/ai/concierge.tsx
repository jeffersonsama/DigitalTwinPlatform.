'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Search, Sparkles, FileText, Languages, RotateCcw } from 'lucide-react'
import { aiSuggestions } from '@/lib/data'
import { useLocale } from '@/lib/i18n'
import { renderFormattedText } from '@/components/ai/formatted-text'

type Message = { role: 'user' | 'ai'; text: string; pending?: boolean }

const suggestionIcons = [Search, Sparkles, FileText, Languages]

const FALLBACK_ERROR_TEXT =
  "Désolé, je n'ai pas pu obtenir de réponse pour le moment. Merci de réessayer dans un instant."

const STORAGE_KEY = 'ykf2026-concierge-history'

export function Concierge() {
  const { t } = useLocale()
  const [messages, setMessages] = useState<Message[]>([])
  const [value, setValue] = useState('')
  const started = messages.length > 0
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setMessages(parsed)
      }
    } catch {
      // Stockage corrompu ou indisponible.
    } finally {
      hydrated.current = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const settled = messages.filter((m) => !m.pending)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settled))
    } catch {
      // Quota depasse ou navigateur en mode prive.
    }
  }, [messages])

  function startNewConversation() {
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  async function send(text: string) {
    const q = text.trim()
    if (!q) return

    const history = messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.text }))

    setValue('')
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: '', pending: true }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, stream: true, history }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Reponse non-OK ou sans corps de flux')
      }

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
              accumulated = event.message
              setMessages((m) => {
                const next = [...m]
                next[next.length - 1] = { role: 'ai', text: accumulated }
                return next
              })
            }
          } catch {
            // Ligne SSE incomplete entre deux lectures.
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
                <div className="flex justify-end">
                  <button
                    onClick={startNewConversation}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-icesco-blue hover:text-icesco-blue"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Nouvelle conversation
                  </button>
                </div>
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
                      {m.pending ? (
                        <span className="flex gap-1" aria-label="En train de répondre">
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