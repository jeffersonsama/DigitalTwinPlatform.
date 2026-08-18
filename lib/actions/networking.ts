'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { notify } from '@/lib/notifications'
import { awardXp } from '@/lib/gamification/xp'
import { XP } from '@/lib/gamification/config'

function refresh(otherUserId: string) {
  revalidatePath('/networking')
  revalidatePath(`/profile/${otherUserId}`)
}

/** 10 XP pour chacune des deux parties d'une connexion mutuelle acceptée, plafonné à
 * XP.CONNECTION_DAILY_CAP par jour et par participant — jamais à l'envoi d'une demande, seulement
 * quand les deux parties sont effectivement connectées (docs/xp-certification-system.md §3.3). */
async function awardConnectionXpBothSides(connectionId: string, fromUserId: string, toUserId: string) {
  await Promise.all([awardConnectionXpForUser(fromUserId, connectionId), awardConnectionXpForUser(toUserId, connectionId)])
}

async function awardConnectionXpForUser(userId: string, connectionId: string) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const acceptedToday = await prisma.connection.count({
    where: {
      status: 'accepted',
      acceptedAt: { gte: startOfDay },
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
  })
  if (acceptedToday > XP.CONNECTION_DAILY_CAP) return

  await awardXp(userId, {
    key: `CONNECTION_ACCEPTED:${connectionId}:${userId}`,
    amount: XP.CONNECTION_ACCEPTED,
    title: 'Nouvelle connexion',
    meta: 'Réseautage',
  })
}

/** Connect button on the Networking directory — creates a *pending* request.
 * The other delegate has to accept it before messaging unlocks. If they'd
 * already sent the viewer a request, this just accepts that one instead of
 * creating a conflicting second row. */
export async function sendConnectionRequest(targetUserId: string) {
  const user = await requireUser()
  if (user.id === targetUserId) return

  const reverse = await prisma.connection.findFirst({
    where: { fromUserId: targetUserId, toUserId: user.id },
  })
  if (reverse) {
    await prisma.connection.update({ where: { id: reverse.id }, data: { status: 'accepted', acceptedAt: new Date() } })
    await awardConnectionXpBothSides(reverse.id, reverse.fromUserId, reverse.toUserId)
    await notify({
      userId: targetUserId,
      actorId: user.id,
      type: 'connection_accepted',
      body: `${user.name} accepted your connection request`,
      link: `/messages/${user.id}`,
    })
  } else {
    await prisma.connection.upsert({
      where: { fromUserId_toUserId: { fromUserId: user.id, toUserId: targetUserId } },
      update: {},
      create: { fromUserId: user.id, toUserId: targetUserId, status: 'pending' },
    })
    await notify({
      userId: targetUserId,
      actorId: user.id,
      type: 'connection_request',
      body: `${user.name} sent you a connection request`,
      link: '/networking',
    })
  }

  refresh(targetUserId)
}

/** Withdraws a request the viewer sent, while it's still pending. */
export async function cancelConnectionRequest(targetUserId: string) {
  const user = await requireUser()
  await prisma.connection.deleteMany({
    where: { fromUserId: user.id, toUserId: targetUserId, status: 'pending' },
  })
  refresh(targetUserId)
}

/** Accepts an incoming pending request — unlocks messaging both ways. */
export async function acceptConnectionRequest(fromUserId: string) {
  const user = await requireUser()
  const connection = await prisma.connection.findFirst({
    where: { fromUserId, toUserId: user.id, status: 'pending' },
  })
  if (!connection) return
  await prisma.connection.update({ where: { id: connection.id }, data: { status: 'accepted', acceptedAt: new Date() } })
  await awardConnectionXpBothSides(connection.id, connection.fromUserId, connection.toUserId)
  await notify({
    userId: fromUserId,
    actorId: user.id,
    type: 'connection_accepted',
    body: `${user.name} accepted your connection request`,
    link: `/messages/${user.id}`,
  })
  refresh(fromUserId)
}

/** Declines (deletes) an incoming pending request. */
export async function declineConnectionRequest(fromUserId: string) {
  const user = await requireUser()
  await prisma.connection.deleteMany({
    where: { fromUserId, toUserId: user.id, status: 'pending' },
  })
  refresh(fromUserId)
}

/** Scanning a delegate's QR code connects the two of you immediately — no
 * accept step, unlike the Networking directory's Connect button. */
export async function connectFromQr(targetUserId: string) {
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

  const alreadyAccepted = existing?.status === 'accepted'
  let connectionId = existing?.id
  if (existing) {
    if (!alreadyAccepted) {
      await prisma.connection.update({ where: { id: existing.id }, data: { status: 'accepted', acceptedAt: new Date() } })
    }
  } else {
    const created = await prisma.connection.create({
      data: { fromUserId: user.id, toUserId: targetUserId, status: 'accepted', acceptedAt: new Date() },
    })
    connectionId = created.id
  }

  if (!alreadyAccepted && connectionId) {
    await awardConnectionXpBothSides(connectionId, user.id, targetUserId)
    await notify({
      userId: targetUserId,
      actorId: user.id,
      type: 'connection_accepted',
      body: `${user.name} connected with you by scanning your QR code`,
      link: `/messages/${user.id}`,
    })
  }

  refresh(targetUserId)
}
