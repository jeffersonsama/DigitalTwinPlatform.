/**
 * Observabilite — journalise chaque etape importante du pipeline IA
 * (moderation, cache, outils utilises, latence) pour pouvoir diagnostiquer
 * un probleme ou suivre le cout en production.
 *
 * Meme philosophie que lib/ai/clients/moderation.ts : un vrai service
 * (Langfuse) si configure, un repli local honnete sinon — jamais un echec
 * silencieux qui ferait perdre le suivi sans prevenir.
 *
 * Point de vigilance a noter : le format exact de l'API d'ingestion Langfuse
 * n'a pas ete verifie contre un compte reel dans cet environnement de
 * developpement (pas d'acces reseau externe). Le squelette suit la
 * convention connue (endpoint /api/public/ingestion, authentification
 * Basic avec cle publique/secrete) mais DOIT etre revalide contre la
 * documentation Langfuse a jour avant une mise en production reelle —
 * exactement le genre de verification qui nous a evite des erreurs sur
 * Qdrant, Gemini et Pinecone plus tot dans ce projet.
 */

export interface AiEvent {
  /** Nom court de l'evenement, ex: 'moderation.input', 'cache.hit', 'llm.call' */
  name: string
  /** Duree de l'operation en millisecondes, si pertinent */
  durationMs?: number
  /** Toute donnee utile au diagnostic — jamais de contenu utilisateur brut
   * sensible ici, uniquement des metadonnees (booleens, comptes, noms). */
  metadata?: Record<string, unknown>
}

function langfuseConfigured() {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_HOST,
  )
}

async function sendToLangfuse(event: AiEvent): Promise<void> {
  const host = process.env.LANGFUSE_HOST
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY!
  const secretKey = process.env.LANGFUSE_SECRET_KEY!
  const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')

  await fetch(`${host}/api/public/ingestion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      batch: [
        {
          id: crypto.randomUUID(),
          type: 'event',
          timestamp: new Date().toISOString(),
          body: { name: event.name, metadata: { ...event.metadata, durationMs: event.durationMs } },
        },
      ],
    }),
  })
}

/**
 * Journalise un evenement. Ne leve JAMAIS d'exception — un probleme
 * d'observabilite ne doit jamais faire echouer une vraie requete utilisateur.
 * "Fire-and-forget" : on ne bloque pas la reponse pour attendre que le log
 * parte reellement.
 */
export function logAiEvent(event: AiEvent): void {
  if (langfuseConfigured()) {
    sendToLangfuse(event).catch((error) => {
      console.error(`[observability] Echec envoi Langfuse pour "${event.name}" :`, error)
    })
    return
  }

  console.log(
    `[ai-event] ${event.name}` +
      (event.durationMs !== undefined ? ` (${event.durationMs}ms)` : '') +
      (event.metadata ? ` ${JSON.stringify(event.metadata)}` : ''),
  )
}
