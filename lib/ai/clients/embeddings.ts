/**
 * Client d'embeddings — Gemini Embedding (gemini-embedding-2).
 *
 * Attention specifique validee en test : l'ancien modele 'text-embedding-004'
 * n'existe plus (404), et l'ancien package `google.generativeai` est deprecie
 * au profit de `google-genai`. Ici on appelle directement l'API REST pour ne
 * pas dependre d'un SDK dont la surface peut changer sans préavis (cf. config.ts
 * pour le detail du modele retenu et pourquoi).
 */
import { aiConfig } from '@/lib/ai/config'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface GeminiEmbedResponse {
  embedding?: { values: number[] }
  error?: { message: string }
}

/** Calcule l'embedding d'un texte. Retourne un vecteur normalise (norme L2 = 1)
 * pour que la similarite cosinus se calcule par un simple produit scalaire,
 * comme dans tous nos tests. */
export async function embedText(text: string): Promise<number[]> {
  const model = aiConfig.embeddings.model()
  const url = `${GEMINI_BASE_URL}/models/${model}:embedContent?key=${aiConfig.embeddings.apiKey()}`

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  })

  const data = (await response.json()) as GeminiEmbedResponse

  if (!response.ok || data.error || !data.embedding) {
    throw new Error(
      `Erreur API Gemini Embedding (statut ${response.status}) : ${data.error?.message ?? 'reponse inattendue'}`,
    )
  }

  return normalize(data.embedding.values)
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (norm === 0) return vector
  return vector.map((v) => v / norm)
}

/** Similarite cosinus entre deux vecteurs deja normalises (produit scalaire simple). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensions incompatibles : ${a.length} vs ${b.length}`)
  }
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
