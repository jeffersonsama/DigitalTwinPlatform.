import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  appendTranscriptSegment,
  runAutomaticSummaryCycle,
  runOnDemandSummary,
  _resetBuffersForTests,
} from '@/lib/ai/liveSummary'
import { chatCompletion } from '@/lib/ai/clients/llm'

vi.mock('@/lib/ai/clients/llm', () => ({
  chatCompletion: vi.fn(),
}))

vi.mock('@/lib/ai/config', () => ({
  aiConfig: {
    llm: { fallbackModel: () => 'test-fallback-model' },
  },
}))

const mockedChatCompletion = vi.mocked(chatCompletion)

describe('liveSummary', () => {
  beforeEach(() => {
    _resetBuffersForTests()
    mockedChatCompletion.mockReset()
  })

  it("ne solicite pas le LLM quand le transcript est vide (aucun segment n'a ete ajoute)", async () => {
    const summary = await runOnDemandSummary('session-vide')
    expect(mockedChatCompletion).not.toHaveBeenCalled()
    expect(summary.keyPoints).toEqual([])
    expect(summary.decisions).toEqual([])
  })

  it('transmet le transcript accumule au LLM et parse sa reponse JSON', async () => {
    mockedChatCompletion.mockResolvedValue({
      message: {
        role: 'assistant',
        content: JSON.stringify({
          keyPoints: ['Six annees de secheresse consecutives'],
          decisions: ['Augmentation du budget rural de 30%'],
        }),
      },
      finishReason: 'stop',
      latencyMs: 42,
    })

    appendTranscriptSegment('session-1', 'Nous avons connu six annees consecutives de secheresse.')
    const summary = await runOnDemandSummary('session-1')

    expect(mockedChatCompletion).toHaveBeenCalledTimes(1)
    expect(summary.keyPoints).toEqual(['Six annees de secheresse consecutives'])
    expect(summary.decisions).toEqual(['Augmentation du budget rural de 30%'])
  })

  it("retourne un resume vide (sans planter) si le LLM ne respecte pas le format JSON demande", async () => {
    mockedChatCompletion.mockResolvedValue({
      message: { role: 'assistant', content: 'Ceci n\'est pas du JSON valide.' },
      finishReason: 'stop',
      latencyMs: 42,
    })

    appendTranscriptSegment('session-2', 'Un peu de contenu.')
    const summary = await runOnDemandSummary('session-2')

    expect(summary.keyPoints).toEqual([])
    expect(summary.decisions).toEqual([])
  })

  it('le cycle automatique avance son curseur — un deuxieme appel immediat ne retraite pas les memes segments', async () => {
    mockedChatCompletion.mockResolvedValue({
      message: { role: 'assistant', content: JSON.stringify({ keyPoints: ['point'], decisions: [] }) },
      finishReason: 'stop',
      latencyMs: 10,
    })

    appendTranscriptSegment('session-3', 'Premier segment.')
    await runAutomaticSummaryCycle('session-3')

    mockedChatCompletion.mockClear()
    const secondCycle = await runAutomaticSummaryCycle('session-3')

    // Rien de nouveau depuis le premier cycle -> transcript vide -> pas d'appel LLM
    expect(mockedChatCompletion).not.toHaveBeenCalled()
    expect(secondCycle.keyPoints).toEqual([])
  })

  it("le resume a la demande n'affecte pas le curseur du cycle automatique (declencheurs independants)", async () => {
    mockedChatCompletion.mockResolvedValue({
      message: { role: 'assistant', content: JSON.stringify({ keyPoints: ['point'], decisions: [] }) },
      finishReason: 'stop',
      latencyMs: 10,
    })

    appendTranscriptSegment('session-4', 'Segment avant toute demande.')

    // Deux demandes a la volee successives depuis le debut (sinceMs=0) doivent
    // toutes deux voir le meme segment, contrairement au cycle automatique.
    const first = await runOnDemandSummary('session-4', 0)
    const second = await runOnDemandSummary('session-4', 0)

    expect(first.keyPoints).toEqual(['point'])
    expect(second.keyPoints).toEqual(['point'])
    expect(mockedChatCompletion).toHaveBeenCalledTimes(2)
  })
})
