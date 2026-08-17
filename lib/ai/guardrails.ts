/**
 * Garde-fou deterministe pour le cache semantique.
 *
 * Pourquoi ce fichier existe : le test du cache semantique a montre que les 3
 * candidats d'embedding testes (Qwen3-Embedding-0.6B, BGE-M3, Gemini Embedding)
 * jugent "Session 1" et "Session 2" comme presque identiques par similarite
 * seule (jusqu'a 0.967 de similarite pour Gemini, alors que ce sont deux
 * questions differentes). Aucun seuil de similarite ne peut separer ces cas
 * correctement — il faut une verification exacte des chiffres et des ordinaux
 * en plus de la similarite semantique.
 *
 * Regle : un hit de cache n'est valide que si (similarite >= seuil) ET
 * (memes entites numeriques dans les deux questions).
 */

const ORDINAUX_FR: Record<string, string> = {
  'premiere': '1', 'première': '1', 'premier': '1',
  'deuxieme': '2', 'deuxième': '2', 'seconde': '2', 'second': '2',
  'troisieme': '3', 'troisième': '3',
  'quatrieme': '4', 'quatrième': '4',
  'cinquieme': '5', 'cinquième': '5',
}

const ORDINAUX_EN: Record<string, string> = {
  first: '1', second: '2', third: '3', fourth: '4', fifth: '5',
}

const ORDINAUX_AR: Record<string, string> = {
  'الأولى': '1', 'الاولى': '1',
  'الثانية': '2',
  'الثالثة': '3',
  'الرابعة': '4',
  'الخامسة': '5',
}

const ALL_ORDINALS = { ...ORDINAUX_FR, ...ORDINAUX_EN, ...ORDINAUX_AR }

/**
 * Extrait l'ensemble des chiffres presents dans un texte, y compris ceux
 * exprimes par un ordinal en toutes lettres (FR/EN/AR). Retourne un Set pour
 * une comparaison d'egalite simple entre deux textes.
 */
export function extractNumericEntities(text: string): Set<string> {
  const normalized = text.toLowerCase()
  const entities = new Set<string>()

  const digitMatches = normalized.match(/\d+/g)
  if (digitMatches) {
    for (const d of digitMatches) entities.add(d)
  }

  for (const [word, digit] of Object.entries(ALL_ORDINALS)) {
    if (normalized.includes(word)) entities.add(digit)
  }

  return entities
}

function sameEntities(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const entity of a) {
    if (!b.has(entity)) return false
  }
  return true
}

export interface CacheGuardResult {
  /** true si le hit de cache est valide (similarite suffisante ET entites coherentes) */
  valid: boolean
  similarity: number
  entitiesMatch: boolean
}

/**
 * Decide si une question candidate peut reutiliser la reponse mise en cache
 * pour une question de reference deja repondue.
 *
 * @param candidateText texte de la nouvelle question posee par l'utilisateur
 * @param cachedText texte de la question deja en cache
 * @param similarity score de similarite cosinus entre les deux embeddings (0-1)
 * @param threshold seuil minimal de similarite (voir aiConfig.cache.similarityThreshold)
 */
export function evaluateCacheHit(
  candidateText: string,
  cachedText: string,
  similarity: number,
  threshold: number,
): CacheGuardResult {
  const entitiesMatch = sameEntities(
    extractNumericEntities(candidateText),
    extractNumericEntities(cachedText),
  )
  return {
    valid: similarity >= threshold && entitiesMatch,
    similarity,
    entitiesMatch,
  }
}
