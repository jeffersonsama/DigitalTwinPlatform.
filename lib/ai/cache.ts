/**
 * Cache semantique du concierge.
 *
 * Stockage : en memoire pour ce premier jet (Map), suffisant pour valider le
 * comportement. A remplacer par Redis (ou une table Postgres) avant une mise
 * en production a grande echelle — une Map en memoire ne survit pas a un
 * redemarrage de fonction serverless et n'est pas partagee entre instances.
 * Le point important valide en test n'est pas le support de stockage mais la
 * logique de validation (voir guardrails.ts), qui reste identique quel que
 * soit le support choisi plus tard.
 */
import { embedText, cosineSimilarity } from '@/lib/ai/clients/embeddings'
import { evaluateCacheHit } from '@/lib/ai/guardrails'
import { aiConfig } from '@/lib/ai/config'

interface CacheEntry {
  question: string
  embedding: number[]
  answer: string
  createdAt: number
}

const store: CacheEntry[] = []

/** Duree de vie d'une entree de cache — les faits du forum (horaires, etc.)
 * peuvent changer ; on evite de servir une reponse perimee indefiniment. */
const TTL_MS = 60 * 60 * 1000 // 1 heure

export interface CacheLookupResult {
  hit: boolean
  answer?: string
  matchedQuestion?: string
  similarity?: number
}

/** Cherche une reponse deja en cache pour une question semantiquement proche
 * ET portant sur les memes entites numeriques (cf. guardrails.ts). */
export async function lookupCache(question: string): Promise<CacheLookupResult> {
  const now = Date.now()
  const freshEntries = store.filter((e) => now - e.createdAt < TTL_MS)

  if (freshEntries.length === 0) return { hit: false }

  const questionEmbedding = await embedText(question)

  let best: { entry: CacheEntry; similarity: number } | null = null
  for (const entry of freshEntries) {
    const similarity = cosineSimilarity(questionEmbedding, entry.embedding)
    if (!best || similarity > best.similarity) {
      best = { entry, similarity }
    }
  }

  if (!best) return { hit: false }

  const guard = evaluateCacheHit(
    question,
    best.entry.question,
    best.similarity,
    aiConfig.cache.similarityThreshold,
  )

  if (!guard.valid) return { hit: false, similarity: guard.similarity }

  return {
    hit: true,
    answer: best.entry.answer,
    matchedQuestion: best.entry.question,
    similarity: guard.similarity,
  }
}

/** Enregistre une question/reponse dans le cache pour reutilisation future. */
export async function storeInCache(question: string, answer: string): Promise<void> {
  const embedding = await embedText(question)
  store.push({ question, embedding, answer, createdAt: Date.now() })
}

/** Reservee aux tests — vide le cache entre deux scenarios. */
export function _resetCacheForTests(): void {
  store.length = 0
}
