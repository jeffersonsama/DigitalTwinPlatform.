'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordHeartbeat, ensureDailyLogin } from '@/lib/actions/gamification'
import { PRESENCE } from '@/lib/gamification/config'

export const HEARTBEAT_EVENT = 'xp:heartbeat'

/** Monté une fois dans AppShellClient pour tout utilisateur connecté — un seul mécanisme de
 * présence pour l'assiduité aux panels, la lecture Knowledge Hub et la présence générale
 * (lib/gamification/presence.ts décide du contexte à partir du pathname). Ne tourne que si
 * l'onglet est visible, et diffuse chaque résultat via un CustomEvent pour que les compteurs de
 * décompte (SessionAttendanceMeter, ResourceReadTimer) se resynchronisent sans appel réseau
 * supplémentaire. */
export function PresenceHeartbeat() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const loginGuardKey = 'xp:daily-login-checked'
    if (!sessionStorage.getItem(loginGuardKey)) {
      sessionStorage.setItem(loginGuardKey, '1')
      ensureDailyLogin().catch(() => {})
    }
  }, [])

  useEffect(() => {
    async function tick() {
      if (document.visibilityState !== 'visible') return
      try {
        const result = await recordHeartbeat(pathnameRef.current)
        if (result) window.dispatchEvent(new CustomEvent(HEARTBEAT_EVENT, { detail: result }))
      } catch {
        // best-effort — un battement manqué se rattrape au suivant
      }
    }

    tick()
    const interval = setInterval(tick, PRESENCE.HEARTBEAT_INTERVAL_SECONDS * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
