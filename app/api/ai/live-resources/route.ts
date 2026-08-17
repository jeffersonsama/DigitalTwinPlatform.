import { NextResponse } from 'next/server'
import { findLiveResources } from '@/lib/ai/tools/liveResources'

/**
 * Endpoint de la branche "Resources en direct". Appele en continu par
 * components/live/live-video.tsx (onglet "Resources"), pas seulement a la
 * demande — c'est la seule des 3 branches du pipeline live qui fonctionne
 * ainsi (contrairement au resume automatique/a la demande).
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Le parametre "sessionId" est requis.' }, { status: 400 })
  }

  try {
    const result = await findLiveResources(sessionId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[api/ai/live-resources] Erreur :', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la recherche de ressources.' },
      { status: 500 },
    )
  }
}
