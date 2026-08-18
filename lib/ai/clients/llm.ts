/**
 * Client LLM — Groq, API compatible OpenAI.
 *
 * Choix deliberé : appel REST direct via `fetch`, sans SDK tiers. Pendant les
 * tests, plusieurs SDK (google-generativeai, qdrant-client) ont change leurs
 * methodes/noms de modeles entre deux versions et casse le code sans prevenir
 * (cf. docs/AI_ARCHITECTURE.md, section "lecons apprises"). Un appel REST brut
 * est plus verbeux mais ne peut pas casser silencieusement a la prochaine
 * mise a jour d'une dependance.
 */
import { aiConfig } from '@/lib/ai/config'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'
const LLM_RETRY_CONFIG = { maxAttempts: 2, baseDelayMs: 300, maxDelayMs: 1000 }

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ChatMessage {
  role: ChatRole
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatCompletionResult {
  message: ChatMessage
  finishReason: string
  latencyMs: number
}

/**
 * Version streaming — utilisee uniquement pour la synthese finale (voir
 * orchestrator.ts). Design volontairement simplifie : cette fonction ne
 * gere PAS les outils (tool_calls) en mode streaming — accumuler des
 * fragments de tool_calls token par token est possible avec l'API Groq mais
 * ajoute une complexite non negligeable, difficile a valider sans acces
 * reseau reel dans cet environnement de developpement. L'orchestrateur
 * resout donc d'abord tous les appels d'outils en mode normal (non
 * streame), PUIS fait un dernier appel dedie en streaming, sans outils,
 * pour rediger la reponse finale token par token.
 *
 * Format verifie (aout 2026) : SSE standard compatible OpenAI —
 * lignes `data: {...}` avec `choices[0].delta.content`, terminees par
 * `data: [DONE]`. A revalider si Groq fait evoluer son API.
 *
 * Nouvelle tentative automatique (fetchWithRetry) sur la connexion initiale :
 * un vrai test de production a montre qu'un 429 "quota depasse" (tier
 * gratuit Groq, ex: 8000 tokens/minute) faisait echouer TOUTE la reponse
 * streamee sans jamais reessayer, alors que la version non-streamee
 * (chatCompletion) le gerait deja correctement. Le retry ne s'applique
 * qu'AVANT le debut de la lecture du flux (verification du statut HTTP) —
 * une fois le flux commence a etre lu, on ne retente jamais un morceau deja
 * envoye, ce serait incoherent.
 */
export async function* chatCompletionStream(params: {
  model: string
  messages: ChatMessage[]
  temperature?: number
}): AsyncGenerator<string, void, unknown> {
  const response = await fetchWithRetry(
    `${aiConfig.llm.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.llm.apiKey()}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.2,
        stream: true,
      }),
    },
    LLM_RETRY_CONFIG,
  )

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Erreur API Groq en streaming (statut ${response.status}) : ${errorBody}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // garde la derniere ligne potentiellement incomplete pour le prochain tour

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice('data:'.length).trim()
      if (payload === '[DONE]') return

      try {
        const parsed = JSON.parse(payload)
        const delta: string | undefined = parsed.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // Ligne SSE incomplete ou non-JSON — ignoree plutot que de faire
        // planter tout le flux pour un fragment mal coupe entre deux lectures.
      }
    }
  }
}

interface GroqChatChoice {
  message: { role: string; content: string | null; tool_calls?: ToolCall[] }
  finish_reason: string
}

interface GroqChatResponse {
  choices: GroqChatChoice[]
  error?: { message: string }
}

/**
 * Appelle le modele de chat Groq, avec ou sans outils. C'est la brique de base
 * utilisee par l'orchestrateur (lib/ai/orchestrator.ts) et par le resume de
 * session live (lib/ai/liveSummary.ts), qui passent chacun un modele different
 * (primaryModel vs fallbackModel) selon le volume attendu.
 */
export async function chatCompletion(params: {
  model: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  maxTokens?: number
  temperature?: number
}): Promise<ChatCompletionResult> {
  const start = Date.now()

  const response = await fetchWithRetry(`${aiConfig.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.llm.apiKey()}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      max_tokens: params.maxTokens ?? 800,
      temperature: params.temperature ?? 0.2,
    }),
  }, LLM_RETRY_CONFIG)

  const data = (await response.json()) as GroqChatResponse

  if (!response.ok || data.error) {
    throw new Error(
      `Erreur API Groq (statut ${response.status}) : ${data.error?.message ?? 'reponse inattendue'}`,
    )
  }

  const choice = data.choices[0]
  if (!choice) {
    throw new Error('Reponse Groq sans aucun choix retourne — reponse inattendue.')
  }

  return {
    message: {
      role: 'assistant',
      content: choice.message.content ?? '',
      tool_calls: choice.message.tool_calls,
    },
    finishReason: choice.finish_reason,
    latencyMs: Date.now() - start,
  }
}