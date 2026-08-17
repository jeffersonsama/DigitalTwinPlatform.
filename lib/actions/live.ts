'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function saveLiveNotes(body: string) {
  const user = await requireUser()
  await prisma.liveNote.upsert({
    where: { userId: user.id },
    update: { body },
    create: { userId: user.id, body },
  })
  revalidatePath('/live')
}
