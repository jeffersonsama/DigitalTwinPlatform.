import { NextResponse } from 'next/server'
import { handleUserQuestion, streamUserQuestion, type ConversationTurn } from '@/lib/ai/orchestrator'

/**
 * Endpoint du concierge general. Appele par components/ai/concierge.tsx.
 *
 * Deux modes, selon le corps de la requete :
 *  - { question } seul -> reponse JSON classique (bloquante, comme avant).
 *  - { question, stream: true } -> reponse en Server-Sent Events, la reponse
 *    du modele arrive token par token (voir lib/ai/orchestrator.ts,
 *    streamUserQuestion, pour les limites assumees de ce mode, notamment sur
 *    la moderation de sortie qui s'applique apres coup).
 */

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  const wantsStream = body?.stream === true
  const history: ConversationTurn[] = Array.isArray(body?.history)
    ? body.history.filter(
        (turn: unknown): turn is ConversationTurn =>
          typeof turn === 'object' &&
          turn !== null &&
          (turn as ConversationTurn).role !== undefined &&
          typeof (turn as ConversationTurn).content === 'string',
      )
    : []

  if (!question) {
    return NextResponse.json({ error: 'Le champ "question" est requis.' }, { status: 400 })
  }

  if (!wantsStream) {
    try {
      const result = await handleUserQuestion(question, history)
      return NextResponse.json(result)
    } catch (error) {
      console.error('[api/ai/chat] Erreur orchestrateur :', error)
      return NextResponse.json(
        { error: "Une erreur est survenue. Merci de réessayer dans un instant." },
        { status: 500 },
      )
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamUserQuestion(question, history)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
      } catch (error) {
        console.error('[api/ai/chat] Erreur pendant le streaming :', error)
        const errorEvent = { type: 'blocked', reason: 'internal_error' }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}