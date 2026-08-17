import { prisma } from '@/lib/db'
import { resolveAvatar } from '@/lib/avatar'

export interface ConversationView {
  userId: string
  name: string
  avatar: string
  role: string
  country: string
  flag: string
  lastMessage: string | null
  lastAt: string | null
  unread: number
}

/** Connected delegates, ranked by most recent message — the same "who can I
 * message" set as the Networking directory's connected filter. */
export async function getConversations(viewerId: string): Promise<ConversationView[]> {
  const [connections, countries] = await Promise.all([
    prisma.connection.findMany({
      where: { status: 'accepted', OR: [{ fromUserId: viewerId }, { toUserId: viewerId }] },
      include: { fromUser: true, toUser: true },
    }),
    prisma.country.findMany(),
  ])
  const countryByName = new Map(countries.map((c) => [c.name, c]))

  const partners = connections.map((c) => (c.fromUserId === viewerId ? c.toUser : c.fromUser))
  if (partners.length === 0) return []

  const partnerIds = partners.map((p) => p.id)
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { fromUserId: viewerId, toUserId: { in: partnerIds } },
        { fromUserId: { in: partnerIds }, toUserId: viewerId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const lastByPartner = new Map<string, (typeof messages)[number]>()
  const unreadByPartner = new Map<string, number>()
  for (const m of messages) {
    const partnerId = m.fromUserId === viewerId ? m.toUserId : m.fromUserId
    if (!lastByPartner.has(partnerId)) lastByPartner.set(partnerId, m)
    if (m.toUserId === viewerId && !m.readAt) {
      unreadByPartner.set(partnerId, (unreadByPartner.get(partnerId) ?? 0) + 1)
    }
  }

  return partners
    .map((p) => {
      const last = lastByPartner.get(p.id)
      return {
        userId: p.id,
        name: p.name,
        avatar: resolveAvatar(p),
        role: p.role,
        country: p.country,
        flag: countryByName.get(p.country)?.flag ?? '🏳️',
        lastMessage: last?.body ?? null,
        lastAt: last?.createdAt.toISOString() ?? null,
        unread: unreadByPartner.get(p.id) ?? 0,
      }
    })
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
}

export async function isConnected(userId: string, otherUserId: string) {
  const connection = await prisma.connection.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    },
  })
  return !!connection
}
