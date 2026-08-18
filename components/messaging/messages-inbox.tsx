'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Send, MessageCircle, Users } from 'lucide-react'
import { sendMessage, markThreadRead } from '@/lib/actions/messages'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { ConversationView } from '@/lib/messages'

export interface MessageView {
  id: string
  fromUserId: string
  body: string
  createdAt: string
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function MessagesInbox({
  viewerId,
  conversations,
  activeUserId,
  activeMessages,
}: {
  viewerId: string
  conversations: ConversationView[]
  activeUserId: string | null
  activeMessages: MessageView[]
}) {
  const { t } = useLocale()
  const active = conversations.find((c) => c.userId === activeUserId) ?? null
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeUserId) startTransition(() => markThreadRead(activeUserId))
  }, [activeUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [activeMessages.length])

  function send(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUserId) return
    const body = value.trim()
    if (!body) return
    setValue('')
    setError('')
    startTransition(async () => {
      const res = await sendMessage(activeUserId, body)
      if (res.error) setError(res.error)
    })
  }

  return (
    <main className="flex h-[calc(100vh-4rem)] w-full">
      {/* Conversation list */}
      <aside className="flex w-full max-w-[320px] shrink-0 flex-col border-r border-border">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-icesco-blue">
            <MessageCircle className="h-4 w-4" />
          </span>
          <h1 className="font-display text-lg font-bold text-foreground">{t('messages')}</h1>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <Users className="h-6 w-6" />
              <p>{t('messaging.empty.prompt')}</p>
              <Link href="/networking" className="font-semibold text-icesco-blue hover:underline">
                {t('messaging.empty.goToNetworking')}
              </Link>
            </div>
          )}
          {conversations.map((c) => (
            <Link
              key={c.userId}
              href={`/messages/${c.userId}`}
              className={cn(
                'flex items-center gap-3 border-b border-border/60 p-4 transition-colors hover:bg-accent/40',
                c.userId === activeUserId && 'bg-accent/60',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.avatar} alt="" className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-icesco-blue px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessage ?? t('messaging.sayHelloDefault', { flag: c.flag, country: c.country })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex flex-1 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.avatar} alt="" className="h-full w-full" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.role}</p>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {activeMessages.map((m) => {
                  const mine = m.fromUserId === viewerId
                  return (
                    <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                      <p
                        className={cn(
                          'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm',
                          mine ? 'bg-icesco-blue text-white' : 'bg-accent text-foreground',
                        )}
                      >
                        {m.body}
                      </p>
                      <span className="mt-1 text-[11px] text-muted-foreground">{timeLabel(m.createdAt)}</span>
                    </div>
                  )
                })}
                {activeMessages.length === 0 && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t('messaging.sayHelloTo', { name: active.name.split(' ')[0] })}
                  </p>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <form onSubmit={send} className="flex flex-col gap-1.5 border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t('messaging.messagePlaceholder', { name: active.name.split(' ')[0] })}
                  className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-icesco-blue"
                />
                <button
                  type="submit"
                  disabled={pending}
                  aria-label={t('home.aiCard.send')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icesco-blue text-white disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8" />
            <p>{t('messaging.selectConversation')}</p>
          </div>
        )}
      </section>
    </main>
  )
}
