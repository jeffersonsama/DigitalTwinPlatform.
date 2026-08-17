'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

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
  } else {
    await prisma.connection.upsert({
      where: { fromUserId_toUserId: { fromUserId: user.id, toUserId: targetUserId } },
      update: {},
      create: { fromUserId: user.id, toUserId: targetUserId, status: 'pending' },
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

  if (existing) {
    if (existing.status !== 'accepted') {
      await prisma.connection.update({ where: { id: existing.id }, data: { status: 'accepted' } })
    }
  } else {
    await prisma.connection.create({ data: { fromUserId: user.id, toUserId: targetUserId, status: 'accepted' } })
  }

  refresh(targetUserId)
}
