'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { awardXp } from '@/lib/gamification/xp'
import { XP } from '@/lib/gamification/config'

/** Poster Studio n'avait aucune persistance avant le système XP (composants/poster/poster-
 * studio.tsx était un état purement client). Chaque affiche publiée est un nouvel enregistrement
 * `Poster`, donc l'octroi des 20 XP (clé sur `poster.id`) est naturellement unique par affiche. */
export async function publishPoster(params: { template: string; title: string; subtitle: string }): Promise<{ id: string }> {
  const user = await requireUser()
  const poster = await prisma.poster.create({
    data: {
      userId: user.id,
      template: params.template,
      title: params.title,
      subtitle: params.subtitle,
      published: true,
      publishedAt: new Date(),
    },
  })

  await awardXp(user.id, {
    key: `POSTER_PUBLISHED:${poster.id}`,
    amount: XP.POSTER_PUBLISHED,
    title: params.title,
    meta: 'Poster Studio',
  })

  revalidatePath('/passport')
  revalidatePath('/certificates')
  return { id: poster.id }
}
