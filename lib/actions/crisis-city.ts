'use server'

import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { Prisma } from '@/lib/generated/prisma/client'

export type CrisisCityProgress = {
  xpEvents: Record<string, number>
  badgesEarned: Record<string, { earnedAt: string; variant?: string }>
  scenarios: Record<string, unknown>
}

function emptyProgress(): CrisisCityProgress {
  return { xpEvents: {}, badgesEarned: {}, scenarios: {} }
}

// Carrière Crisis City par compte — remplace le `localStorage` de la version autonome
// (components/crisis-city/engine/persistence.js), même forme d'objet, un enregistrement par
// utilisateur (prisma.crisisCityProfile, 1-1 avec User).
export async function getCrisisCityProgress(): Promise<CrisisCityProgress> {
  const user = await requireUser()
  const profile = await prisma.crisisCityProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return emptyProgress()
  return {
    xpEvents: profile.xpEvents as CrisisCityProgress['xpEvents'],
    badgesEarned: profile.badgesEarned as CrisisCityProgress['badgesEarned'],
    scenarios: profile.scenarios as CrisisCityProgress['scenarios'],
  }
}

export async function saveCrisisCityProgress(progress: CrisisCityProgress) {
  const user = await requireUser()
  // Prisma's generated Json input type doesn't structurally accept a plain Record<string, T> —
  // cast at the boundary rather than loosen CrisisCityProgress's public type.
  const json = {
    xpEvents: progress.xpEvents as Prisma.InputJsonValue,
    badgesEarned: progress.badgesEarned as Prisma.InputJsonValue,
    scenarios: progress.scenarios as Prisma.InputJsonValue,
  }
  await prisma.crisisCityProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...json },
    update: json,
  })
}
