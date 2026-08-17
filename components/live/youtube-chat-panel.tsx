'use client'

import { useEffect, useState } from 'react'
import { Video } from 'lucide-react'
import { LIVE_VIDEO_ID } from '@/lib/live-config'

export function YoutubeChatPanel() {
  // embed_domain must match the serving host, so this waits for the browser
  // (works for both localhost in dev and the real domain in production)
  // rather than hardcoding one — computed after mount to avoid an SSR/client
  // markup mismatch.
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    setSrc(
      `https://www.youtube.com/live_chat?v=${LIVE_VIDEO_ID}&embed_domain=${window.location.hostname}&dark_theme=1`,
    )
  }, [])

  return (
    <div className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-white/10 bg-navy-900">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Video className="h-4 w-4 text-red-500" />
        <p className="text-sm font-semibold text-white">YouTube Live Chat</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-b-xl">
        {src && <iframe src={src} title="YouTube live chat" className="h-full w-full" />}
      </div>
    </div>
  )
}
