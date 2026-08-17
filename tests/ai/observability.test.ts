import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logAiEvent } from '@/lib/ai/observability'

describe('logAiEvent', () => {
  const originalEnv = { ...process.env }
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    delete process.env.LANGFUSE_PUBLIC_KEY
    delete process.env.LANGFUSE_SECRET_KEY
    delete process.env.LANGFUSE_HOST
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    consoleLogSpy.mockRestore()
  })

  it("retombe sur console.log quand Langfuse n'est pas configure", () => {
    logAiEvent({ name: 'test.event', durationMs: 42, metadata: { foo: 'bar' } })

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy.mock.calls[0][0]).toContain('test.event')
    expect(consoleLogSpy.mock.calls[0][0]).toContain('42ms')
  })

  it('ne leve jamais d\'exception, meme sans metadata ni duree', () => {
    expect(() => logAiEvent({ name: 'minimal.event' })).not.toThrow()
  })

  it('tente Langfuse quand les 3 variables sont presentes, sans jamais bloquer ni planter', async () => {
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test'
    process.env.LANGFUSE_SECRET_KEY = 'sk-test'
    process.env.LANGFUSE_HOST = 'https://example.com'
    global.fetch = vi.fn().mockRejectedValue(new Error('reseau indisponible'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => logAiEvent({ name: 'langfuse.event' })).not.toThrow()
    // Laisse le temps a la promesse "fire-and-forget" de se resoudre avant de verifier.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/public/ingestion',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(consoleErrorSpy).toHaveBeenCalled() // l'echec reseau simule est bien capture, pas propage
    consoleErrorSpy.mockRestore()
  })
})
