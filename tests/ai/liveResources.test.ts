import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/ai/clients/embeddings', () => ({
  embedText: vi.fn(),
}))
vi.mock('@/lib/ai/clients/vectorstore', () => ({
  searchForumDocuments: vi.fn(),
}))
vi.mock('@/lib/ai/config', () => ({
  aiConfig: {
    liveSummary: { resourceWindowSeconds: 45 },
  },
}))

import { findLiveResources } from '@/lib/ai/tools/liveResources'
import { appendTranscriptSegment, _resetBuffersForTests } from '@/lib/ai/liveSummary'
import { embedText } from '@/lib/ai/clients/embeddings'
import { searchForumDocuments } from '@/lib/ai/clients/vectorstore'

const mockedEmbedText = vi.mocked(embedText)
const mockedSearch = vi.mocked(searchForumDocuments)

describe('findLiveResources', () => {
  beforeEach(() => {
    _resetBuffersForTests()
    vi.clearAllMocks()
  })

  it("ne calcule aucun embedding ni recherche si la fenetre glissante est vide (aucun segment recent)", async () => {
    const result = await findLiveResources('session-vide')

    expect(result.available).toBe(false)
    expect(result.resources).toEqual([])
    expect(mockedEmbedText).not.toHaveBeenCalled()
    expect(mockedSearch).not.toHaveBeenCalled()
  })

  it('utilise le texte recent de la fenetre glissante pour chercher des ressources filtrees par session', async () => {
    appendTranscriptSegment('session-1', "Nous parlons maintenant de la crise de l'eau au Maroc.")
    mockedEmbedText.mockResolvedValue([0.1, 0.2, 0.3])
    mockedSearch.mockResolvedValue([
      {
        score: 0.9,
        payload: {
          passageId: 'YKF26-THM-008-chunk1',
          texte: 'Le Maroc dispose de 156 grands barrages...',
          sessionAssociee: 'session-1',
          confidentialite: 'public',
          langue: 'fr',
          typeDocument: 'ressource_thematique',
        },
      },
    ])

    const result = await findLiveResources('session-1')

    expect(mockedEmbedText).toHaveBeenCalledWith(
      expect.stringContaining("crise de l'eau au Maroc"),
    )
    expect(mockedSearch).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1', limit: 3 }),
    )
    expect(result.available).toBe(true)
    expect(result.resources).toEqual([
      { passageId: 'YKF26-THM-008-chunk1', texte: 'Le Maroc dispose de 156 grands barrages...' },
    ])
  })

  it("retourne available=true mais une liste vide si la recherche Qdrant ne trouve rien de pertinent", async () => {
    appendTranscriptSegment('session-2', 'Un sujet sans rapport avec la base documentaire.')
    mockedEmbedText.mockResolvedValue([0.1, 0.2, 0.3])
    mockedSearch.mockResolvedValue([])

    const result = await findLiveResources('session-2')

    expect(result.available).toBe(true)
    expect(result.resources).toEqual([])
  })
})
