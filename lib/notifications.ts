import { prisma } from '@/lib/db'
import { resolveAvatar } from '@/lib/avatar'

export interface NotificationView {
  id: string
  type: 'connection_request' | 'connection_accepted' | 'message'
  body: string
  link: string
  read: boolean
  createdAt: string
  actor: { name: string; avatar: string } | null
}

const RECENT_LIMIT = 20

export async function getNotifications(userId: string): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: RECENT_LIMIT,
  })

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    body: n.body,
    link: n.link,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor ? { name: n.actor.name, avatar: resolveAvatar(n.actor) } : null,
  }))
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

/** Fire-and-forget from within a server action — never throws, so a
 * notification failure can't take down the action it's attached to. */
export async function notify(params: { userId: string; actorId?: string; type: 'connection_request' | 'connection_accepted' | 'message'; body: string; link: string }) {
  if (params.userId === params.actorId) return
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        body: params.body,
        link: params.link,
      },
    })
  } catch {
    // best-effort — notifications are a courtesy, not critical state
  }
}
