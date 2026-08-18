import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { computeLevel } from './levels'
import { evaluateCourseraThresholds } from './certificates'

/** Octroi d'XP idempotent — `key` identifie l'événement une fois pour toutes (ex.
 * "PRESENCE_PANEL:{userId}:{sessionId}:{n}"). Un second appel avec la même clé est un no-op :
 * aucune règle de ce moteur ne fait confiance au client pour décider du montant ou du
 * déclenchement, seulement pour signaler qu'une action a eu lieu. */
export async function awardXp(
  userId: string,
  params: { key: string; amount: number; title: string; meta: string },
): Promise<{ awarded: boolean; xp: number }> {
  if (params.amount <= 0) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return { awarded: false, xp: user.xp }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.activityLogEntry.create({
        data: { userId, key: params.key, title: params.title, meta: params.meta, xp: params.amount },
      })
      const afterXp = await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: params.amount } },
      })
      const { level, levelTitle, xpMax } = computeLevel(afterXp.xp)
      return tx.user.update({ where: { id: userId }, data: { level, levelTitle, xpMax } })
    })

    // Jamais atteint depuis l'XP interne de Crisis City (qui n'appelle jamais awardXp) — voir
    // lib/gamification/certificates.ts#evaluateCourseraThresholds.
    await evaluateCourseraThresholds(userId)
    return { awarded: true, xp: updated.xp }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
      return { awarded: false, xp: user.xp }
    }
    throw error
  }
}
