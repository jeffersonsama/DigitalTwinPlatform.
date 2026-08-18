import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/ai/config', () => ({
  aiConfig: {
    webSearch: {
      tavilyApiKey: vi.fn(),
      tavilyBaseUrl: 'https://api.tavily.com/search',
      serperApiKey: vi.fn(),
      serperBaseUrl: 'https://google.serper.dev/search',
    },
  },
}))
vi.mock('@/lib/ai/clients/httpRetry', () => ({
  fetchWithRetry: vi.fn(),
}))
vi.mock('@/lib/ai/observability', () => ({
  logAiEvent: vi.fn(),
}))

import { searchWeb } from '@/lib/ai/tools/webSearch'
import { aiConfig } from '@/lib/ai/config'
import { fetchWithRetry } from '@/lib/ai/clients/httpRetry'

const mockedTavilyKey = vi.mocked(aiConfig.webSearch.tavilyApiKey)
const mockedSerperKey = vi.mocked(aiConfig.webSearch.serperApiKey)
const mockedFetch = vi.mocked(fetchWithRetry)

describe('searchWeb — repli Tavily -> Serper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne available=false sans appeler le reseau si aucun des deux fournisseurs n'est configure", async () => {
    mockedTavilyKey.mockReturnValue(null)
    mockedSerperKey.mockReturnValue(null)

    const result = await searchWeb('actualite climat')

    expect(result.available).toBe(false)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('utilise Tavily en priorite quand il est configure et fonctionne', async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue('serper-key')
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ title: 'A', url: 'https://a.com', content: 'contenu A' }] }),
    } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.provider).toBe('tavily')
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect((mockedFetch.mock.calls[0][0] as string)).toContain('tavily.com')
  })

  it('bascule reellement sur Serper si Tavily echoue (pas seulement absent)', async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue('serper-key')
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'cle Tavily invalide' } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organic: [{ title: 'B', link: 'https://b.com', snippet: 'contenu B' }] }),
      } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.available).toBe(true)
    expect(result.provider).toBe('serper')
    expect(result.results).toEqual([{ title: 'B', snippet: 'contenu B', url: 'https://b.com' }])
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect((mockedFetch.mock.calls[1][0] as string)).toContain('serper.dev')
  })

  it('utilise Serper directement si seul Serper est configure (Tavily absent)', async () => {
    mockedTavilyKey.mockReturnValue(null)
    mockedSerperKey.mockReturnValue('serper-key')
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organic: [{ title: 'C', link: 'https://c.com', snippet: 'contenu C' }] }),
    } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.provider).toBe('serper')
    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  it('retourne available=false si les deux fournisseurs configures echouent tous les deux', async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue('serper-key')
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'panne Tavily' } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'panne Serper' } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.available).toBe(false)
    expect(result.results).toEqual([])
  })

  it("n'ajoute PAS la synthese Tavily comme faux resultat quand de vrais resultats existent deja — corrige le bug reel ou le modele citait \"tavily\" comme nom de source", async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue(null)
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Resume synthetise.',
        results: [{ title: 'Source A', url: 'https://a.com', content: 'Detail A' }],
      }),
    } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.results).toEqual([{ title: 'Source A', snippet: 'Detail A', url: 'https://a.com' }])
    expect(result.results).toHaveLength(1)
  })

  it("utilise la synthese Tavily comme filet de secours SEULEMENT si aucun resultat individuel n'existe", async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue(null)
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: 'Resume synthetise sans source precise.', results: [] }),
    } as Response)

    const result = await searchWeb('actualite climat')

    expect(result.results).toHaveLength(1)
    expect(result.results[0].snippet).toBe('Resume synthetise sans source precise.')
    expect(result.results[0].title).not.toBe('Synthese Tavily') // jamais ce libelle trompeur
  })

  it("utilise topic:'general' (pas 'news') pour ne pas exclure les sites de donnees factuelles (meteo, etc.)", async () => {
    mockedTavilyKey.mockReturnValue('tvly-key')
    mockedSerperKey.mockReturnValue(null)
    mockedFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as Response)

    await searchWeb('temperature actuelle Kenitra')

    const body = JSON.parse((mockedFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.topic).toBe('general')
  })
})