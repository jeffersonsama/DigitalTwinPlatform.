/**
 * Outil "recherche forum" — la branche RAG du concierge general, pour les
 * questions dont la reponse est une explication (pas un fait ponctuel) :
 * "qu'est-ce que l'ISO/UNDP 53001 ?", "c'est quoi le concept de polycrisis ?".
 *
 * C'est precisement ce type de question qui a fait halluciner tous les LLM
 * testes sans contexte (chacun a invente une definition differente de l'ISO
 * 53001 — voir docs/AI_ARCHITECTURE.md). Cet outil, une fois la base
 * documentaire ingeree, fournit le vrai texte source au lieu de laisser le
 * modele deviner.
 */


import { embedText } from '@/lib/ai/clients/embeddings'
import { searchForumDocuments } from '@/lib/ai/clients/vectorstore'

export interface ForumSearchResult {
  found: boolean
  passages: { texte: string; source: string }[]
}

/**
 * sessionId reste un parametre optionnel de CETTE FONCTION (utilise en
 * interne par lib/ai/tools/liveResources.ts, avec une vraie valeur
 * programmatique — jamais generee par un modele). Il n'est PAS expose dans
 * le schema de l'outil ci-dessous — voir le commentaire sur forumSearchTools.
 */
export async function searchForum(query: string, sessionId?: string): Promise<ForumSearchResult> {
  const queryVector = await embedText(query)
  const results = await searchForumDocuments({ queryVector, limit: 3, sessionId })

  return {
    found: results.length > 0,
    passages: results.map((r) => ({ texte: r.payload.texte, source: r.payload.passageId })),
  }
}

/**
 * sessionId volontairement ABSENT du schema expose au modele.
 *
 * Historique du probleme (16/08) : un premier correctif avait elargi le type
 * de ce champ a `['string', 'null']` — mais Groq rejette cette syntaxe de
 * schema (tableau de types) et continuait a renvoyer "expected string, but
 * got null" malgre ce changement. Solution robuste : retirer entierement ce
 * parametre optionnel du schema que le modele peut remplir.
 */
export const forumSearchTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_forum_documents',
      description:
        "Recherche dans la base documentaire du forum (concept note, ressources thematiques, definitions) " +
        "pour repondre a une question de fond ou d'explication (ex: 'qu'est-ce que l'ISO 53001', " +
        "'c'est quoi le polycrisis'). Ne pas utiliser pour des faits ponctuels (horaires, noms) — " +
        "voir find_sessions / find_speaker pour cela.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'La question ou le sujet a rechercher' },
        },
        required: ['query'],
      },
    },
  },
]