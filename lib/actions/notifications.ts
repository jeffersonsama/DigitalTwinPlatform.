'use server'

import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function markAllNotificationsRead() {
  const user = await requireUser()
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
}
