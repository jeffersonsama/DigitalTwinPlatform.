import { NextResponse } from 'next/server'
import { appendTranscriptSegment } from '@/lib/ai/liveSummary'

/**
 * Endpoint de TEST UNIQUEMENT — permet d'injecter manuellement du texte dans
 * le buffer de transcript d'une session, pour tester reellement le pipeline
 * live (resume automatique/a la demande, ressources en direct) alors que le
 * STT (reconnaissance vocale) n'est pas encore branche (voir
 * docs/AI_ARCHITECTURE.md section 6).
 *
 * Sans cet outil, aucune vraie verification de bout en bout n'est possible
 * pour ce pipeline : rien d'autre n'appelle appendTranscriptSegment() en
 * dehors des tests unitaires (avec services simules).
 *
 * A SUPPRIMER une fois le STT reellement branche — ce n'est pas une
 * fonctionnalite produit, uniquement un outil de test manuel. Protege par
 * une verification simple d'environnement pour eviter un usage accidentel
 * en production.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_TRANSCRIPT) {
    return NextResponse.json(
      { error: "Cet endpoint de test n'est pas disponible en production sans ALLOW_TEST_TRANSCRIPT." },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!sessionId || !text) {
    return NextResponse.json({ error: 'sessionId et text sont requis.' }, { status: 400 })
  }

  appendTranscriptSegment(sessionId, text)

  return NextResponse.json({ ok: true, sessionId, appended: text })
}