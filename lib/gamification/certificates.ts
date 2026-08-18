import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { COURSERA_XP_THRESHOLD, PARTICIPATION_THRESHOLD_RATIO } from './config'

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

/** Émission idempotente : `sourceKey` identifie le jalon une fois pour toutes (ex.
 * "PANEL_CERT:{sessionId}:{userId}") — un second appel pour le même jalon est un no-op. */
export async function issueCertificateOnce(
  userId: string,
  params: { type: string; title: string; sourceKey: string; code?: string },
): Promise<boolean> {
  try {
    await prisma.certificate.create({
      data: {
        userId,
        type: params.type,
        title: params.title,
        code: params.code ?? null,
        status: 'issued',
        issuedAt: new Date(),
        sourceKey: params.sourceKey,
      },
    })
    return true
  } catch (error) {
    if (isUniqueConstraintError(error)) return false
    throw error
  }
}

/** Certificat de carrière Crisis City — contrairement aux autres, un seul enregistrement par
 * utilisateur dont le titre est mis à jour à chaque nouveau grade atteint (la progression du jeu
 * est monotone, jamais régressive). Reste hors XP Passeport (docs/xp-certification-system.md §4). */
export async function upsertCareerCertificate(userId: string, gradeTitle: string): Promise<void> {
  const sourceKey = `CAREER_CERT:${userId}`
  await prisma.certificate.upsert({
    where: { sourceKey },
    create: { userId, type: 'career', title: gradeTitle, status: 'issued', issuedAt: new Date(), sourceKey },
    update: { title: gradeTitle, issuedAt: new Date() },
  })
}

export async function evaluateParticipationCertificate(userId: string): Promise<void> {
  const [suivi, total] = await Promise.all([
    prisma.sessionAttendance.count({ where: { userId, suivi: true } }),
    prisma.programSession.count(),
  ])
  if (total === 0 || suivi / total < PARTICIPATION_THRESHOLD_RATIO) return
  await issueCertificateOnce(userId, {
    type: 'participation',
    title: 'Certificat de participation au forum',
    sourceKey: `PARTICIPATION_CERT:${userId}`,
  })
}

/** Jamais appelée pour l'XP interne de Crisis City (scénarios narratifs) — uniquement pour l'XP
 * Passeport, via awardXp(). C'est ce qui garantit le cloisonnement décrit dans le document de
 * cadrage : le palier Coursera-par-1000-XP ne peut être franchi qu'avec de l'XP Passeport. */
export async function evaluateCourseraThresholds(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const targetCount = Math.floor(user.xp / COURSERA_XP_THRESHOLD)
  if (targetCount === 0) return

  const issuedCount = await prisma.certificate.count({ where: { userId, type: 'coursera' } })
  for (let n = issuedCount + 1; n <= targetCount; n++) {
    await issueCertificateOnce(userId, {
      type: 'coursera',
      title: `Certification Coursera — palier ${n * COURSERA_XP_THRESHOLD} XP`,
      sourceKey: `COURSERA_CERT:${userId}:${n}`,
    })
  }
}
