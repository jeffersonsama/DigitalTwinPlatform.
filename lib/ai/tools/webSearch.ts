/**
 * Outil "recherche web" — branche actualite du concierge general, ET
 * verification/completion des questions generales (voir SYSTEM_PROMPT,
 * regle 5, mise a jour suite a un retour reel sur le risque de reponses
 * perimees quand le modele repond uniquement de memoire).
 *
 * Deux fournisseurs, avec un vrai mecanisme de repli : Tavily en principal,
 * Serper en secours reel si Tavily echoue ou n'est pas configure — pas un
 * simple message d'excuse. Le retry (fetchWithRetry) gere deja les pannes
 * transitoires de CHAQUE fournisseur ; ce repli gere le cas ou un
 * fournisseur entier est indisponible ou mal configure.
 */
import { aiConfig } from '@/lib/ai/config'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'
import { logAiEvent } from '@/lib/ai/observability'

export interface WebSearchResult {
  available: boolean
  results: { title: string; snippet: string; url: string }[]
  provider?: 'tavily' | 'serper'
}

interface TavilyResultItem {
  title: string
  url: string
  content: string
}
interface TavilyResponse {
  results?: TavilyResultItem[]
  answer?: string
}

async function searchWithTavily(query: string, apiKey: string): Promise<WebSearchResult> {
  const response = await fetchWithRetry(aiConfig.webSearch.tavilyBaseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      topic: 'general',
      include_answer: 'basic',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Erreur API Tavily (statut ${response.status}) : ${errorBody}`)
  }

  const data = (await response.json()) as TavilyResponse
  const results = (data.results ?? []).map((r) => ({ title: r.title, snippet: r.content, url: r.url }))

  if (data.answer && results.length === 0) {
    results.push({ title: 'Reponse synthetisee (source precise non disponible)', snippet: data.answer, url: '' })
  }

  return { available: true, results, provider: 'tavily' }
}

interface SerperOrganicItem {
  title: string
  link: string
  snippet: string
}
interface SerperResponse {
  organic?: SerperOrganicItem[]
}

async function searchWithSerper(query: string, apiKey: string): Promise<WebSearchResult> {
  const response = await fetchWithRetry(aiConfig.webSearch.serperBaseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({ q: query }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Erreur API Serper (statut ${response.status}) : ${errorBody}`)
  }

  const data = (await response.json()) as SerperResponse
  const results = (data.organic ?? [])
    .slice(0, 5)
    .map((r) => ({ title: r.title, snippet: r.snippet, url: r.link }))

  return { available: true, results, provider: 'serper' }
}

export async function searchWeb(query: string): Promise<WebSearchResult> {
  const tavilyKey = aiConfig.webSearch.tavilyApiKey()
  if (tavilyKey) {
    try {
      return await searchWithTavily(query, tavilyKey)
    } catch (error) {
      logAiEvent({ name: 'websearch.tavily_failed', metadata: { error: (error as Error).message } })
    }
  }

  const serperKey = aiConfig.webSearch.serperApiKey()
  if (serperKey) {
    try {
      return await searchWithSerper(query, serperKey)
    } catch (error) {
      logAiEvent({ name: 'websearch.serper_failed', metadata: { error: (error as Error).message } })
    }
  }

  return { available: false, results: [] }
}

export const webSearchTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_web',
      description:
        "Recherche une information sur le web. A utiliser dans deux cas : (1) une question d'actualite " +
        "recente non couverte par la base documentaire du forum, ou (2) pour VERIFIER ou COMPLETER une " +
        "reponse de connaissance generale quand l'information pourrait avoir change depuis ta date de " +
        "coupure (statistiques, personnes en poste, evenements recents, chiffres officiels). Dans le doute " +
        "sur l'actualite d'un fait, utilise cet outil plutot que de repondre uniquement de memoire.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Le sujet ou la question a rechercher' },
        },
        required: ['query'],
      },
    },
  },
]