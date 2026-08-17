import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeSessionStatus } from '@/lib/program'
import { runAutomaticSummaryCycle } from '@/lib/ai/liveSummary'
import { logAiEvent } from '@/lib/ai/observability'

/**
 * Point d'entree du cycle automatique de resume (toutes les 10 minutes,
 * cf. aiConfig.liveSummary.autoCycleMinutes). Ne fait rien tout seul : cette
 * route doit etre appelee par un planificateur externe.
 *
 * Deux facons de la brancher, selon l'hebergement :
 *  - Vercel Cron (voir vercel.json a la racine du projet) — gratuit sur les
 *    plans payants, limite de frequence sur le plan gratuit.
 *  - N'importe quel service de cron externe (cron-job.org, GitHub Actions
 *    scheduled workflow...) configure pour appeler cette URL toutes les 10
 *    minutes avec l'en-tete Authorization ci-dessous.
 *
 * Protection : necessite un secret partage (CRON_SECRET) pour eviter que
 * n'importe qui sur internet puisse declencher des appels LLM a volonte.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET non configure — cette route est desactivee par securite.' },
      { status: 503 },
    )
  }
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 })
  }

  const sessions = await prisma.programSession.findMany()
  const liveSessions = sessions.filter((s) => computeSessionStatus(s.startsAt, s.endsAt) === 'live')

  const results = await Promise.allSettled(
    liveSessions.map((session) => runAutomaticSummaryCycle(session.id)),
  )

  const processed = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  logAiEvent({
    name: 'cron.summary_cycle',
    metadata: { liveSessionsCount: liveSessions.length, processed, failed },
  })

  return NextResponse.json({ liveSessionsCount: liveSessions.length, processed, failed })
}
