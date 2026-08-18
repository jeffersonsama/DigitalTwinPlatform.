'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

// Hub animateur/modération — même routage interne par query params que la SPA d'origine
// (atelier/routing.js#parseAtelierRoute), réimplémenté ici avec useSearchParams() puisque la
// page qui héberge ce composant (app/crisis-city/admin/page.tsx) est déjà gardée par
// requireAdmin() : un joueur normal ne peut jamais atteindre AtelierRoot, quel que soit le mode.
const AtelierRoot = dynamic(() => import('./atelier/AtelierRoot.jsx'), { ssr: false })

export default function CrisisCityAdminLoader() {
  const params = useSearchParams()
  const atelier = params.get('atelier')
  const mode =
    atelier === 'animateur' || atelier === 'rejoindre' || atelier === 'carte' ? atelier : 'menu'
  return <AtelierRoot mode={mode} jeu={params.get('jeu')} code={params.get('code')} />
}
