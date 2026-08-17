'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function toggleConnection(targetUserId: string) {
  const user = await requireUser()
  if (user.id === targetUserId) return

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: user.id },
      ],
    },
  })

  if (existing) {
    await prisma.connection.delete({ where: { id: existing.id } })
  } else {
    await prisma.connection.create({ data: { fromUserId: user.id, toUserId: targetUserId, status: 'accepted' } })
  }

  revalidatePath('/networking')
}
