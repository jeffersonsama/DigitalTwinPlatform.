'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Clock, MessageCircle, UserPlus, X } from 'lucide-react'
import {
  sendConnectionRequest,
  cancelConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  connectFromQr,
} from '@/lib/actions/networking'
import type { ConnectionState } from '@/lib/networking'

export function ProfileConnectAction({
  targetId,
  targetName,
  initialState,
  autoConnect,
}: {
  targetId: string
  targetName: string
  initialState: ConnectionState
  autoConnect: boolean
}) {
  const [state, setState] = useState<ConnectionState>(initialState)
  const [connecting, setConnecting] = useState(autoConnect && initialState !== 'connected')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!autoConnect || initialState === 'connected') return
    startTransition(async () => {
      await connectFromQr(targetId)
      setState('connected')
      setConnecting(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (connecting) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-icesco-blue border-t-transparent" />
        Connecting with {targetName}…
      </p>
    )
  }

  if (state === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-accent px-4 py-2 text-sm font-semibold text-icesco-blue">
          <Check className="h-4 w-4" /> Connected
        </span>
        <Link
          href={`/messages/${targetId}`}
          className="flex items-center gap-1.5 rounded-lg bg-icesco-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco"
        >
          <MessageCircle className="h-4 w-4" /> Message
        </Link>
      </div>
    )
  }

  if (state === 'pending-received') {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await acceptConnectionRequest(targetId); setState('connected') })}
          className="flex items-center gap-1.5 rounded-lg bg-icesco-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> Accept request
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await declineConnectionRequest(targetId); setState('none') })}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          <X className="h-4 w-4" /> Decline
        </button>
      </div>
    )
  }

  if (state === 'pending-sent') {
    return (
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await cancelConnectionRequest(targetId); setState('none') })}
        className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        <Clock className="h-4 w-4" /> Request sent · Cancel
      </button>
    )
  }

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await sendConnectionRequest(targetId); setState('pending-sent') })}
      className="flex items-center gap-1.5 rounded-lg bg-icesco-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
    >
      <UserPlus className="h-4 w-4" /> Connect
    </button>
  )
}
