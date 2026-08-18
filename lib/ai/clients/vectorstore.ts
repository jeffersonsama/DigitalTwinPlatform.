/**
 * Client Qdrant — via REST direct (pas le SDK @qdrant/js-client-rest, pour la
 * meme raison que le client LLM : eviter une rupture silencieuse au moment
 * d'une mise a jour de dependance, deja rencontree en Python avec `.search()`
 * renomme en `.query_points()` entre deux versions).
 *
 * Point valide en test, a ne pas oublier lors de l'ingestion (lib/ai/tools ou
 * scripts d'ingestion futurs) : Qdrant exige un index explicite par champ de
 * metadonnee avant de pouvoir filtrer dessus (createPayloadIndexIfNeeded
 * ci-dessous) — contrairement a une base SQL classique.
 */
import { aiConfig } from '@/lib/ai/config'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'

export interface ForumChunkPayload {
  passageId: string
  texte: string
  sessionAssociee: string
  confidentialite: 'public' | 'usage_interne' | 'restreint'
  langue: string
  typeDocument: string
}

export interface VectorSearchResult {
  score: number
  payload: ForumChunkPayload
}

function qdrantHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': aiConfig.vectorStore.apiKey(),
  }
}

/**
 * Recherche vectorielle avec filtrage par metadonnees optionnel. Deux regles
 * de securite non negociables, validees dans le cahier des charges :
 *  - on ne cherche jamais dans du contenu `confidentialite: restreint`
 *    depuis cette fonction generaliste (utiliser une voie dediee et
 *    authentifiee si un jour necessaire) ;
 *  - le filtrage par session (sessionId) doit passer par un index deja cree,
 *    sinon Qdrant renvoie une erreur 400 explicite plutot qu'un resultat faux.
 */
export async function searchForumDocuments(params: {
  queryVector: number[]
  limit?: number
  sessionId?: string
  includeInternal?: boolean
}): Promise<VectorSearchResult[]> {
  const must: Record<string, unknown>[] = []

  if (params.sessionId) {
    must.push({ key: 'sessionAssociee', match: { value: params.sessionId } })
  }
  if (!params.includeInternal) {
    must.push({ key: 'confidentialite', match: { value: 'public' } })
  }

  const url = `${aiConfig.vectorStore.url()}/collections/${aiConfig.vectorStore.collection()}/points/query`
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      query: params.queryVector,
      limit: params.limit ?? 3,
      with_payload: true,
      filter: must.length > 0 ? { must } : undefined,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      `Erreur Qdrant (statut ${response.status}) : ${data?.status?.error ?? 'reponse inattendue'}. ` +
        `Si l'erreur mentionne un index manquant, voir createPayloadIndexIfNeeded().`,
    )
  }

  return (data.result?.points ?? []).map((point: { score: number; payload: ForumChunkPayload }) => ({
    score: point.score,
    payload: point.payload,
  }))
}

/**
 * Cree la collection Qdrant elle-meme si elle n'existe pas deja — etape
 * manquante decouverte lors du tout premier test d'ingestion reel : le code
 * savait creer un index sur un champ (ci-dessous) et inserer des points, mais
 * personne n'avait jamais ecrit la creation de la collection en amont. Sans
 * elle, Qdrant renvoie "Collection ... doesn't exist" des le premier chunk.
 * Idempotent : ne recree rien si la collection est deja presente.
 */
export async function createCollectionIfNeeded(): Promise<void> {
  const url = `${aiConfig.vectorStore.url()}/collections/${aiConfig.vectorStore.collection()}`

  const existing = await fetchWithRetry(url, { method: 'GET', headers: qdrantHeaders() })
  if (existing.ok) return // deja presente, rien a faire

  const response = await fetchWithRetry(url, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      vectors: { size: aiConfig.vectorStore.embeddingDimension, distance: 'Cosine' },
    }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(`Erreur de creation de la collection Qdrant (statut ${response.status}) : ${data?.status?.error}`)
  }
}

/**
 * Cree l'index sur un champ de payload, necessaire avant tout filtrage dessus.
 * A appeler une fois par champ filtrable lors de la mise en place de la
 * collection (voir scripts d'ingestion) — idempotent, ne fait rien si l'index
 * existe deja.
 */
export async function createPayloadIndexIfNeeded(fieldName: string): Promise<void> {
  const url = `${aiConfig.vectorStore.url()}/collections/${aiConfig.vectorStore.collection()}/index`
  const response = await fetchWithRetry(url, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({ field_name: fieldName, field_schema: 'keyword' }),
  })
  // Qdrant renvoie une erreur si l'index existe deja avec un schema different,
  // mais ne fait rien de dangereux si on rappelle avec le meme schema — cette
  // erreur precise est donc ignoree volontairement, toute autre est remontee.
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = data?.status?.error ?? ''
    if (!message.toLowerCase().includes('already exists')) {
      throw new Error(`Erreur de creation d'index Qdrant (statut ${response.status}) : ${message}`)
    }
  }
}

export async function upsertForumChunk(params: {
  id: string | number
  vector: number[]
  payload: ForumChunkPayload
}): Promise<void> {
  const url = `${aiConfig.vectorStore.url()}/collections/${aiConfig.vectorStore.collection()}/points`
  const response = await fetchWithRetry(url, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({ points: [{ id: params.id, vector: params.vector, payload: params.payload }] }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(`Erreur d'indexation Qdrant (statut ${response.status}) : ${data?.status?.error}`)
  }
}