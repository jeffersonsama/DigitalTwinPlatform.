import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: { programSession: { findMany: vi.fn() } },
}))
vi.mock('@/lib/ai/liveSummary', () => ({
  runAutomaticSummaryCycle: vi.fn(),
}))
vi.mock('@/lib/ai/observability', () => ({
  logAiEvent: vi.fn(),
}))

import { GET } from '@/app/api/ai/cron/route'
import { prisma } from '@/lib/db'
import { runAutomaticSummaryCycle } from '@/lib/ai/liveSummary'

const mockedFindMany = vi.mocked(prisma.programSession.findMany)
const mockedRunCycle = vi.mocked(runAutomaticSummaryCycle)

function makeRequest(authHeader?: string) {
  return new Request('http://localhost/api/ai/cron', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

describe('GET /api/ai/cron', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })
  afterEach(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('refuse la requete si CRON_SECRET n\'est pas configure du tout', async () => {
    delete process.env.CRON_SECRET
    const response = await GET(makeRequest('Bearer whatever'))
    expect(response.status).toBe(503)
  })

  it('refuse une requete sans le bon secret', async () => {
    const response = await GET(makeRequest('Bearer mauvais-secret'))
    expect(response.status).toBe(401)
    expect(mockedFindMany).not.toHaveBeenCalled()
  })

  it('ne declenche le cycle que pour les sessions reellement en direct', async () => {
    const now = Date.now()
    mockedFindMany.mockResolvedValueOnce([
      { id: 'live-1', startsAt: new Date(now - 1000), endsAt: new Date(now + 1000) }, // en direct
      { id: 'past-1', startsAt: new Date(now - 5000), endsAt: new Date(now - 4000) }, // terminee
      { id: 'future-1', startsAt: new Date(now + 5000), endsAt: new Date(now + 6000) }, // pas commencee
    ] as never)
    mockedRunCycle.mockResolvedValue({ keyPoints: [], decisions: [], generatedAt: Date.now() })

    const response = await GET(makeRequest('Bearer test-secret'))
    const data = await response.json()

    expect(mockedRunCycle).toHaveBeenCalledTimes(1)
    expect(mockedRunCycle).toHaveBeenCalledWith('live-1')
    expect(data.liveSessionsCount).toBe(1)
    expect(data.processed).toBe(1)
  })

  it('compte les echecs sans faire planter la route entiere (une session en echec ne bloque pas les autres)', async () => {
    const now = Date.now()
    mockedFindMany.mockResolvedValueOnce([
      { id: 'live-1', startsAt: new Date(now - 1000), endsAt: new Date(now + 1000) },
      { id: 'live-2', startsAt: new Date(now - 1000), endsAt: new Date(now + 1000) },
    ] as never)
    mockedRunCycle
      .mockResolvedValueOnce({ keyPoints: [], decisions: [], generatedAt: Date.now() })
      .mockRejectedValueOnce(new Error('echec LLM'))

    const response = await GET(makeRequest('Bearer test-secret'))
    const data = await response.json()

    expect(data.processed).toBe(1)
    expect(data.failed).toBe(1)
  })
})
