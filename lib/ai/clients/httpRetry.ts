/**
 * Utilitaire de nouvelle tentative avec recul exponentiel, partage par tous
 * les clients externes (Groq, Gemini, Qdrant, Tavily).
 *
 * Motivation initiale : l'absence de gestion des erreurs transitoires (429
 * "trop de requetes", 500/502/503 cote fournisseur) etait la derniere vraie
 * lacune de robustesse avant une mise en production reelle.
 *
 * Correctif important (16/08, suite a un test de production reel) : Groq
 * n'envoie PAS le delai d'attente dans l'en-tete HTTP standard Retry-After —
 * il l'indique uniquement en texte libre dans le corps JSON de l'erreur
 * (ex: "Please try again in 25.605s"). Sans lire ce texte, on retombait sur
 * un recul exponentiel de secours qui n'attendait qu'1 a 2 secondes avant
 * d'abandonner — beaucoup trop court face a un vrai depassement de quota
 * (25s observees en test reel), ce qui faisait echouer la requete pour de
 * bon au lieu de reessayer avec succes.
 */

export interface RetryConfig {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 4000,
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function extractRetryDelayFromBody(response: Response): Promise<number | null> {
  try {
    const text = await response.clone().text()
    const match = text.match(/(?:try again|retry)\s*(?:in)?\s*([\d.]+)\s*(ms|s)\b/i)
    if (!match) return null
    const value = parseFloat(match[1])
    if (Number.isNaN(value)) return null
    return match[2].toLowerCase() === 'ms' ? value : value * 1000
  } catch {
    return null
  }
}

async function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  response: Response,
): Promise<number> {
  let delay: number

  const headerValue = response.headers.get('retry-after')
  if (headerValue) {
    const seconds = Number(headerValue)
    delay = !Number.isNaN(seconds) && seconds > 0 ? seconds * 1000 : NaN
  } else {
    delay = NaN
  }

  if (Number.isNaN(delay)) {
    const bodyDelayMs = await extractRetryDelayFromBody(response)
    delay = bodyDelayMs ?? baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs
  }

  return Math.min(delay, maxDelayMs)
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = {},
): Promise<Response> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULT_CONFIG, ...config }

  let lastResponse: Response | undefined
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.ok || !isRetryableStatus(response.status)) {
        return response
      }

      lastResponse = response
      if (attempt < maxAttempts - 1) {
        const delay = await computeDelay(attempt, baseDelayMs, maxDelayMs, response)
        await sleep(delay)
      }
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts - 1) {
        const exponential = baseDelayMs * 2 ** attempt
        const jitter = Math.random() * baseDelayMs
        await sleep(Math.min(exponential + jitter, maxDelayMs))
      }
    }
  }

  if (lastResponse) return lastResponse
  throw lastError instanceof Error ? lastError : new Error('Echec reseau apres plusieurs tentatives.')
}