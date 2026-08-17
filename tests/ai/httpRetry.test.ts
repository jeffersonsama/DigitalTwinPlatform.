import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  it('retourne directement la reponse si elle reussit du premier coup (aucune attente)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await fetchWithRetry('https://example.com', {})

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('retente automatiquement sur une erreur 429 puis reussit', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, baseDelayMs: 100 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('respecte l\'en-tete Retry-After au lieu du recul exponentiel par defaut', async () => {
    const headers = new Headers({ 'retry-after': '2' })
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers })
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3 })
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise

    expect(result.ok).toBe(true)
  })

  it('ne retente JAMAIS sur une erreur 401 (cle invalide) — retourne directement l\'echec', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, headers: new Headers() })

    const result = await fetchWithRetry('https://example.com', {}, { maxAttempts: 3 })

    expect(result.status).toBe(401)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('abandonne apres le nombre maximal de tentatives et retourne la derniere reponse en echec', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, headers: new Headers() })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, baseDelayMs: 10 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.status).toBe(503)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('retente aussi sur une erreur reseau (fetch qui rejette), pas seulement sur un statut HTTP', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, baseDelayMs: 10 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("extrait le delai d'attente ecrit en texte libre dans le corps de la reponse quand l'en-tete Retry-After est absent (cas reel Groq)", async () => {
    const bodyText = JSON.stringify({
      error: { message: 'Rate limit reached. Please try again in 5.5s.' },
    })
    const failingResponse = {
      ok: false,
      status: 429,
      headers: new Headers(),
      clone: () => ({ text: async () => bodyText }),
    }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(failingResponse)
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, baseDelayMs: 100 })
    await vi.advanceTimersByTimeAsync(5500)
    const result = await promise

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("retombe sur le recul exponentiel si le corps ne contient aucun delai exploitable", async () => {
    const failingResponse = {
      ok: false,
      status: 500,
      headers: new Headers(),
      clone: () => ({ text: async () => 'Erreur interne, sans indication de delai.' }),
    }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(failingResponse)
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, baseDelayMs: 50 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("plafonne le delai d'attente meme si Groq (ou tout autre fournisseur) demande d'attendre beaucoup plus longtemps — evite les reponses de 30-70s observees en test reel", async () => {
    const bodyText = JSON.stringify({
      error: { message: 'Rate limit reached. Please try again in 25s.' },
    })
    const failingResponse = {
      ok: false,
      status: 429,
      headers: new Headers(),
      clone: () => ({ text: async () => bodyText }),
    }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(failingResponse)
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = fetchWithRetry('https://example.com', {}, { maxAttempts: 3, maxDelayMs: 2000 })
    await vi.advanceTimersByTimeAsync(2100)
    const result = await promise

    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})