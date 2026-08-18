import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import CrisisCityAdminLoader from '@/components/crisis-city/CrisisCityAdminLoader'

export const metadata: Metadata = {
  title: 'Crisis City — Admin | ICESCO Crisis Forum 2026',
}

// Gardé par requireAdmin() : un compte plateforme "admin" (accessRole) sert aussi de
// modérateur/animateur du jeu (écran animateur des sessions S1-S4, carte admin temps réel) —
// un joueur normal est redirigé vers / et n'atteint jamais cette page.
export default async function CrisisCityAdminPage() {
  await requireAdmin()
  return <CrisisCityAdminLoader />
}
