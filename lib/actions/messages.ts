'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { notify } from '@/lib/notifications'
import { awardXp } from '@/lib/gamification/xp'
import { XP } from '@/lib/gamification/config'

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
  return connection
}

/** +5 XP la première fois que chaque participant écrit dans une conversation nouvellement
 * acceptée (< 48h) — récompense le réseautage qui débouche sur un échange réel plutôt qu'une
 * connexion jamais suivie d'effet (docs/xp-certification-system.md §3.3). Idempotent par
 * connexion et par expéditeur : sans effet au-delà du premier message de chacun. */
async function maybeAwardFirstMessageBonus(connection: { id: string; acceptedAt: Date | null }, senderId: string) {
  if (!connection.acceptedAt) return
  const withinWindow = Date.now() - connection.acceptedAt.getTime() <= XP.FIRST_MESSAGE_WINDOW_HOURS * 3600 * 1000
  if (!withinWindow) return
  await awardXp(senderId, {
    key: `FIRST_MESSAGE_BONUS:${connection.id}:${senderId}`,
    amount: XP.FIRST_MESSAGE_BONUS,
    title: 'Premier message après connexion',
    meta: 'Réseautage',
  })
}

export async function sendMessage(toUserId: string, body: string) {
  const user = await requireUser()
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }
  if (user.id === toUserId) return { error: "You can't message yourself." }

  let connection
  try {
    connection = await requireConnected(user.id, toUserId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unable to send message.' }
  }

  await prisma.directMessage.create({ data: { fromUserId: user.id, toUserId, body: trimmed } })
  await maybeAwardFirstMessageBonus(connection, user.id)

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
