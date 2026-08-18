'use client'

import { Radio } from 'lucide-react'
import { useLiveRoom } from '@/components/live/live-room-provider'
import { LIVE_VIDEO_ID } from '@/lib/live-config'
import { useLocale } from '@/lib/i18n'

export function LiveVideo() {
  const { presenceCount } = useLiveRoom()
  const { t } = useLocale()

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${LIVE_VIDEO_ID}?autoplay=0&mute=1`}
        title={t('live.streamTitle')}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
          <Radio className="h-3 w-3" />
          {t('home.liveBadge')}
        </span>
        <span className="rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {t('live.watching', { count: presenceCount.toLocaleString() })}
        </span>
      </div>
    </div>
  )
}
