import { prisma } from '@/lib/db'

export type ConnectionState = 'none' | 'pending-sent' | 'pending-received' | 'connected'

/** Single-pair lookup — used by the public profile page. The Networking
 * directory looks up many delegates at once and derives this same shape from
 * one bulk query instead of calling this in a loop. */
export async function getConnectionState(viewerId: string, otherId: string): Promise<ConnectionState> {
  if (viewerId === otherId) return 'none'

  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { fromUserId: viewerId, toUserId: otherId },
        { fromUserId: otherId, toUserId: viewerId },
      ],
    },
  })

  if (!connection) return 'none'
  if (connection.status === 'accepted') return 'connected'
  return connection.fromUserId === viewerId ? 'pending-sent' : 'pending-received'
}
