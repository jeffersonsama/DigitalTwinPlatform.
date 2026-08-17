import { Camera } from 'lucide-react'
import { CAMERA_360_VIDEO_ID } from '@/lib/live-config'

export function Camera360Panel() {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
      {CAMERA_360_VIDEO_ID ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${CAMERA_360_VIDEO_ID}?autoplay=0&mute=1`}
          title="360° venue camera"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
          <Camera className="h-8 w-8" />
          <p className="text-sm font-medium text-white/60">360° Camera View</p>
          <p className="text-xs text-white/40">Goes live with the venue feed during the event</p>
        </div>
      )}

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-xs font-bold text-white backdrop-blur">
          <Camera className="h-3 w-3" />
          360° VENUE
        </span>
      </div>
    </div>
  )
}
