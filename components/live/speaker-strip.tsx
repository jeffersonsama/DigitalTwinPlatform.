import { Users } from 'lucide-react'
import { speakers } from '@/lib/data'
import { useLiveRoom } from '@/components/live/live-room-provider'
import { useLocale } from '@/lib/i18n'

export function SpeakerStrip() {
  const { presenceCount } = useLiveRoom()
  const { t } = useLocale()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-navy-900 p-4">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
          {t('live.speakers')}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {speakers.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-icesco-blue to-cyan-accent text-xs font-semibold text-white">
                {s.initials}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-medium text-white">{s.name}</p>
                <p className="text-[11px] text-white/50">{s.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-white">
        <Users className="h-4 w-4 text-cyan-accent" />
        <span className="font-display text-lg font-bold">{presenceCount.toLocaleString()}</span>
        <span className="text-xs text-white/60">{t('home.stat.participantsOnline')}</span>
      </div>
    </div>
  )
}
