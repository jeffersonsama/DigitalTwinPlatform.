import { NextResponse } from 'next/server'
import { runAutomaticSummaryCycle, runOnDemandSummary } from '@/lib/ai/liveSummary'

/**
 * Endpoint du resume de session live. Appele par
 * components/live/ai-summary-panel.tsx.
 *
 * GET  -> lit le dernier resume disponible sans en generer un nouveau
 *         (utilise par le rafraichissement automatique du panneau).
 * POST -> declenche un resume a la demande, avec la meme logique
 *         d'extraction que le cycle automatique (cf. liveSummary.ts).
 *
 * Le cycle automatique (toutes les aiConfig.liveSummary.autoCycleMinutes
 * minutes) est destine a etre appele par un scheduler cote infrastructure
 * (cron job / scheduled function), pas directement par le navigateur — d'ou
 * la separation entre GET (lecture) et l'action planifiee (hors de ce fichier).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''

  if (!sessionId) {
    return NextResponse.json({ error: 'Le champ "sessionId" est requis.' }, { status: 400 })
  }

  try {
    const summary = await runOnDemandSummary(sessionId, body?.sinceMs ?? 0)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[api/ai/live-summary] Erreur :', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération du résumé." },
      { status: 500 },
    )
  }
}

/** Route utilitaire pour declencher manuellement le cycle automatique pendant
 * le developpement, en l'absence d'un vrai scheduler configure. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Le parametre "sessionId" est requis.' }, { status: 400 })
  }

  try {
    const summary = await runAutomaticSummaryCycle(sessionId)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[api/ai/live-summary] Erreur :', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération du résumé." },
      { status: 500 },
    )
  }
}
