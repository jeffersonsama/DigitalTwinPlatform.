'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { AlertCircle, Camera, X } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

/** Only follows links that point back into our own /profile pages — a
 * scanned QR is untrusted input, so we don't navigate to arbitrary decoded
 * URLs (someone could print a QR pointing anywhere). */
function resolveProfilePath(raw: string): string | null {
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (!/^\/profile\/[^/]+$/.test(url.pathname)) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function QrScanner() {
  const router = useRouter()
  const { t } = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [found, setFound] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let frameId: number
    let cancelled = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        tick()
      } catch {
        setError(t('qrScanner.cameraError'))
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || cancelled) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) {
            const path = resolveProfilePath(code.data)
            if (path) {
              setFound(true)
              cancelled = true
              stream?.getTracks().forEach((t) => t.stop())
              router.push(path)
              return
            }
          }
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    start()
    return () => {
      cancelled = true
      if (frameId) cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [router])

  function goToManualUrl(e: React.FormEvent) {
    e.preventDefault()
    const path = resolveProfilePath(manualUrl.trim())
    if (path) router.push(path)
    else setError(t('qrScanner.invalidLink'))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-cyan-accent/70" />
        {found && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-accent">
              <Camera className="h-4 w-4" /> {t('qrScanner.codeFound')}
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-white/70">{error}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-white/50">{t('qrScanner.instructions')}</p>

      <form onSubmit={goToManualUrl} className="flex w-full max-w-sm items-center gap-2">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder={t('qrScanner.pastePlaceholder')}
          className="flex-1 rounded-full border border-white/15 bg-navy-900 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-cyan-accent px-4 py-2 text-sm font-semibold text-navy-950"
        >
          {t('qrScanner.go')}
        </button>
      </form>
    </div>
  )
}

export function CloseScannerButton() {
  const router = useRouter()
  const { t } = useLocale()
  return (
    <button
      onClick={() => router.back()}
      aria-label={t('qrScanner.close')}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
