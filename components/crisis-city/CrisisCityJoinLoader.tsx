'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

// Flux public de participation à l'atelier (QR code / code à 6 caractères) — aucune
// authentification requise, cf. atelier/ParticipantScreen.jsx qui affiche lui-même un écran de
// saisie de code quand aucun code n'est fourni.
const ParticipantScreen = dynamic(() => import('./atelier/ParticipantScreen.jsx'), { ssr: false })

export default function CrisisCityJoinLoader() {
  const params = useSearchParams()
  return <ParticipantScreen initialCode={params.get('code')} />
}
