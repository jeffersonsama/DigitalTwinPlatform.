'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { notify } from '@/lib/notifications'

/** Delegates can only message people they've connected with — mirrors the
 * in-person etiquette of exchanging contact details before following up. */
async function requireConnected(userId: string, otherUserId: string) {
  const connection = await prisma.connection.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    },
  })
  if (!connection) throw new Error('You need to connect with this delegate before messaging them.')
}

export async function sendMessage(toUserId: string, body: string) {
  const user = await requireUser()
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }
  if (user.id === toUserId) return { error: "You can't message yourself." }

  try {
    await requireConnected(user.id, toUserId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unable to send message.' }
  }

  await prisma.directMessage.create({ data: { fromUserId: user.id, toUserId, body: trimmed } })

  // Skip if there's already an unread "message" notification from this same
  // sender — it already points at the thread, no need to pile up duplicates
  // for a fast back-and-forth conversation.
  const alreadyNotified = await prisma.notification.findFirst({
    where: { userId: toUserId, actorId: user.id, type: 'message', readAt: null },
  })
  if (!alreadyNotified) {
    await notify({
      userId: toUserId,
      actorId: user.id,
      type: 'message',
      body: `New message from ${user.name}`,
      link: `/messages/${user.id}`,
    })
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${toUserId}`)
  return { error: null }
}

export async function markThreadRead(otherUserId: string) {
  const user = await requireUser()
  await prisma.directMessage.updateMany({
    where: { fromUserId: otherUserId, toUserId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/messages')
}
