/**
 * Branche "Resources en direct" du pipeline session live (troisieme branche
 * du schema documente dans docs/AI_ARCHITECTURE.md, section "Pipeline de la
 * session live") — la piece qui avait ete oubliee dans la premiere version de
 * ce travail, identifiee lors de l'audit complet du pipeline RAG.
 *
 * Principe : prendre les X dernieres secondes de transcript (fenetre
 * glissante, voir aiConfig.liveSummary.resourceWindowSeconds), les transformer
 * en vecteur, et chercher les documents du forum les plus proches de ce qui
 * vient d'etre dit — filtres a la session en cours quand elle est connue, pour
 * eviter de faire remonter une ressource d'une tout autre session.
 */
import { aiConfig } from '@/lib/ai/config'
import { getRecentTranscriptWindow } from '@/lib/ai/liveSummary'
import { embedText } from '@/lib/ai/clients/embeddings'
import { searchForumDocuments } from '@/lib/ai/clients/vectorstore'

export interface LiveResource {
  passageId: string
  texte: string
}

export interface LiveResourcesResult {
  available: boolean
  resources: LiveResource[]
}

/**
 * Cherche les ressources documentaires liees a ce qui vient d'etre dit dans
 * une session live. Retourne `available: false` (sans appeler ni l'embedding
 * ni Qdrant) si la fenetre glissante est encore vide — typiquement en tout
 * debut de session, avant que le STT n'ait produit le moindre segment.
 */
export async function findLiveResources(sessionId: string): Promise<LiveResourcesResult> {
  const windowMs = aiConfig.liveSummary.resourceWindowSeconds * 1000
  const recentText = getRecentTranscriptWindow(sessionId, windowMs)

  if (!recentText.trim()) {
    return { available: false, resources: [] }
  }

  const queryVector = await embedText(recentText)
  const results = await searchForumDocuments({ queryVector, limit: 3, sessionId })

  return {
    available: true,
    resources: results.map((r) => ({ passageId: r.payload.passageId, texte: r.payload.texte })),
  }
}
