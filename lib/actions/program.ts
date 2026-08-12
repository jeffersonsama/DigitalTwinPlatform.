'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function toggleBookmark(sessionId: string) {
  const user = await requireUser()

  const existing = await prisma.bookmark.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId } },
  })

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } })
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, sessionId } })
  }

  revalidatePath('/program')
}
