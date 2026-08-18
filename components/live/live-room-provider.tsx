'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useLocale } from '@/lib/i18n'

export interface LiveChatMessage {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export interface LivePollOption {
  id: string
  label: string
  votes: number
}

export interface LivePoll {
  id: string
  question: string
  options: LivePollOption[]
  total: number
}

export interface LiveQuestion {
  id: string
  authorName: string
  body: string
  upvotes: number
}

interface AckResult {
  ok?: true
  error?: string
}

interface LiveRoomValue {
  connected: boolean
  isLoggedIn: boolean
  presenceCount: number
  messages: LiveChatMessage[]
  sendMessage: (body: string) => Promise<AckResult>
  poll: LivePoll | null
  vote: (optionId: string) => Promise<AckResult>
  questions: LiveQuestion[]
  ask: (body: string) => Promise<AckResult>
  upvote: (questionId: string) => Promise<AckResult>
}

const LiveRoomContext = createContext<LiveRoomValue | null>(null)

export function LiveRoomProvider({ children, isLoggedIn }: { children: ReactNode; isLoggedIn: boolean }) {
  const { t } = useLocale()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [presenceCount, setPresenceCount] = useState(0)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [poll, setPoll] = useState<LivePoll | null>(null)
  const [questions, setQuestions] = useState<LiveQuestion[]>([])

  useEffect(() => {
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('presence:count', (n: number) => setPresenceCount(n))
    socket.on('chat:history', (history: LiveChatMessage[]) => setMessages(history))
    socket.on('chat:new', (message: LiveChatMessage) =>
      setMessages((prev) => [...prev, message].slice(-100)),
    )
    socket.on('poll:update', (next: LivePoll | null) => setPoll(next))
    socket.on('qa:list', (list: LiveQuestion[]) => setQuestions(list))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  function emitWithAck<T>(event: string, payload: T): Promise<AckResult> {
    return new Promise((resolve) => {
      const socket = socketRef.current
      if (!socket) return resolve({ error: t('live.notConnected') })
      socket.emit(event, payload, (res: AckResult) => resolve(res ?? { ok: true }))
    })
  }

  const value: LiveRoomValue = {
    connected,
    isLoggedIn,
    presenceCount,
    messages,
    sendMessage: (body) => emitWithAck('chat:send', body),
    poll,
    vote: (optionId) => emitWithAck('poll:vote', optionId),
    questions,
    ask: (body) => emitWithAck('qa:ask', body),
    upvote: (questionId) => emitWithAck('qa:upvote', questionId),
  }

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>
}

export function useLiveRoom() {
  const ctx = useContext(LiveRoomContext)
  if (!ctx) throw new Error('useLiveRoom must be used within a LiveRoomProvider')
  return ctx
}
