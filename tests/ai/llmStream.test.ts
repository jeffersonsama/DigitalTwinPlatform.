import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/ai/config', () => ({
  aiConfig: {
    llm: {
      apiKey: () => 'test-key',
      baseUrl: 'https://api.groq.com/openai/v1',
    },
  },
}))

import { chatCompletionStream } from '@/lib/ai/clients/llm'

/** Construit un faux corps de reponse SSE, avec un decoupage volontairement
 * arbitraire entre les appels de lecture pour verifier que le buffering
 * gere correctement une ligne coupee entre deux paquets reseau. */
function fakeSseBody(rawChunks: string[]) {
  let index = 0
  return {
    getReader() {
      return {
        async read() {
          if (index >= rawChunks.length) return { done: true, value: undefined }
          const value = new TextEncoder().encode(rawChunks[index])
          index++
          return { done: false, value }
        },
      }
    },
  }
}

describe('chatCompletionStream', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('extrait les deltas de contenu meme quand une ligne SSE est coupee entre deux lectures reseau', async () => {
    const chunk1 = 'data: {"choices":[{"delta":{"content":"Bon'
    const chunk2 = 'jour"}}]}\n\ndata: {"choices":[{"delta":{"content":" le monde"}}]}\n\ndata: [DONE]\n\n'

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: fakeSseBody([chunk1, chunk2]),
    })

    const deltas: string[] = []
    for await (const delta of chatCompletionStream({ model: 'test-model', messages: [] })) {
      deltas.push(delta)
    }

    expect(deltas.join('')).toBe('Bonjour le monde')
  })

  it('ignore silencieusement une ligne non-JSON plutot que de faire planter tout le flux', async () => {
    const body =
      'data: ceci n\'est pas du JSON\n\ndata: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n'

    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: fakeSseBody([body]) })

    const deltas: string[] = []
    for await (const delta of chatCompletionStream({ model: 'test-model', messages: [] })) {
      deltas.push(delta)
    }

    expect(deltas).toEqual(['OK'])
  })

  it('leve une erreur explicite si la reponse HTTP est en echec', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      body: null,
      text: async () => 'Invalid API key',
    })

    const iterator = chatCompletionStream({ model: 'test-model', messages: [] })
    await expect(iterator.next()).rejects.toThrow(/statut 401/)
  })

  it("retente automatiquement sur un 429 (quota depasse) avant de commencer a lire le flux — bug reel corrige suite a un test de production", async () => {
    vi.useFakeTimers()
    const chunk = 'data: {"choices":[{"delta":{"content":"Reponse apres nouvelle tentative"}}]}\n\ndata: [DONE]\n\n'

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, body: fakeSseBody([chunk]) })

    const deltas: string[] = []
    const iteratorPromise = (async () => {
      for await (const delta of chatCompletionStream({ model: 'test-model', messages: [] })) {
        deltas.push(delta)
      }
    })()

    await vi.runAllTimersAsync()
    await iteratorPromise

    expect(deltas.join('')).toBe('Reponse apres nouvelle tentative')
    expect(global.fetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})