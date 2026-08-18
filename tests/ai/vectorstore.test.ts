import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/ai/config', () => ({
  aiConfig: {
    vectorStore: {
      url: () => 'https://fake-qdrant.example.com',
      apiKey: () => 'fake-key',
      collection: () => 'ykf2026_forum',
      embeddingDimension: 3072,
    },
  },
}))
vi.mock('@/lib/ai/clients/httpRetry', () => ({
  fetchWithRetry: vi.fn(),
}))

import { createCollectionIfNeeded } from '@/lib/ai/clients/vectorstore'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'

const mockedFetch = vi.mocked(fetchWithRetry)

describe('createCollectionIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("ne tente aucune creation si la collection existe deja (GET reussi)", async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response)

    await createCollectionIfNeeded()

    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  it("cree la collection avec la bonne dimension et la bonne metrique si elle n'existe pas (404)", async () => {
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)

    await createCollectionIfNeeded()

    expect(mockedFetch).toHaveBeenCalledTimes(2)
    const putCall = mockedFetch.mock.calls[1]
    expect(putCall[1]?.method).toBe('PUT')
    expect(JSON.parse(putCall[1]?.body as string)).toEqual({ vectors: { size: 3072, distance: 'Cosine' } })
  })

  it('leve une erreur explicite si la creation echoue', async () => {
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ status: { error: 'panne interne' } }),
      } as unknown as Response)

    await expect(createCollectionIfNeeded()).rejects.toThrow(/panne interne/)
  })
})