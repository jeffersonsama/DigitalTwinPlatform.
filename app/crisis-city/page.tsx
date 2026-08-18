import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import CrisisCityGameLoader from '@/components/crisis-city/CrisisCityGameLoader'

export const metadata: Metadata = {
  title: 'Crisis City | ICESCO Crisis Forum 2026',
}

// Pas d'<AppShell> ici (comme /login) : le canvas 3D occupe tout le viewport, sans le rail/topbar
// de la plateforme. Connexion requise — la carrière (XP/badges) est liée au compte, cf.
// lib/actions/crisis-city.ts. Le pays du compte (User.country) est transmis au jeu pour la
// couleur civique du pack — remplace l'ancienne détection par géolocalisation IP.
export default async function CrisisCityPage() {
  const user = await requireUser()
  return <CrisisCityGameLoader country={user.country} />
}
