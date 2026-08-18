import type { Metadata } from 'next'
import CrisisCityJoinLoader from '@/components/crisis-city/CrisisCityJoinLoader'

export const metadata: Metadata = {
  title: 'Rejoindre — Crisis City | ICESCO Crisis Forum 2026',
}

// Volontairement public (pas de requireUser()) : un participant de forum scanne un QR code sur
// son téléphone pour rejoindre une session atelier animée en direct — pas de compte nécessaire.
export default function CrisisCityJoinPage() {
  return <CrisisCityJoinLoader />
}
