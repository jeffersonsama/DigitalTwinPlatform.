'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { notify } from '@/lib/notifications'

function refresh(otherUserId: string) {
  revalidatePath('/networking')
  revalidatePath(`/profile/${otherUserId}`)
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
    await prisma.connection.update({ where: { id: reverse.id }, data: { status: 'accepted' } })
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
  await prisma.connection.updateMany({
    where: { fromUserId, toUserId: user.id, status: 'pending' },
    data: { status: 'accepted' },
  })
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
  if (existing) {
    if (!alreadyAccepted) {
      await prisma.connection.update({ where: { id: existing.id }, data: { status: 'accepted' } })
    }
  } else {
    await prisma.connection.create({ data: { fromUserId: user.id, toUserId: targetUserId, status: 'accepted' } })
  }

  if (!alreadyAccepted) {
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
