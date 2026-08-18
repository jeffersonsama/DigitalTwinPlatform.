import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { NetworkingDirectory, type DelegateView, type NetworkingStatView } from '@/components/networking/networking-directory'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { resolveAvatar } from '@/lib/avatar'

export const metadata: Metadata = {
  title: 'Networking | ICESCO Crisis Forum 2026',
  description: 'Connect and collaborate with delegates from across the Islamic world.',
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000

export default async function NetworkingPage() {
  await requireEnabledPage('networking')

  const [users, countries, acceptedConnections, viewer] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.country.findMany(),
    prisma.connection.findMany({ where: { status: 'accepted' } }),
    getCurrentUser(),
  ])

  const [pendingCount, distinctCountries, viewerConnections] = await Promise.all([
    prisma.connection.count({ where: { status: 'pending' } }),
    prisma.user.findMany({ distinct: ['country'], select: { country: true } }),
    viewer
      ? prisma.connection.findMany({ where: { OR: [{ fromUserId: viewer.id }, { toUserId: viewer.id }] } })
      : Promise.resolve([]),
  ])

  const countryByName = new Map(countries.map((c) => [c.name, c]))
  const now = Date.now()

  // partner sets, for real "mutual connections" (accepted only)
  const partnersOf = new Map<string, Set<string>>()
  for (const c of acceptedConnections) {
    if (!partnersOf.has(c.fromUserId)) partnersOf.set(c.fromUserId, new Set())
    if (!partnersOf.has(c.toUserId)) partnersOf.set(c.toUserId, new Set())
    partnersOf.get(c.fromUserId)!.add(c.toUserId)
    partnersOf.get(c.toUserId)!.add(c.fromUserId)
  }
  const viewerPartners = viewer ? partnersOf.get(viewer.id) ?? new Set<string>() : new Set<string>()

  // viewer's relationship to every other delegate: accepted / pending-sent / pending-received
  const stateByUserId = new Map<string, DelegateView['connectionState']>()
  for (const c of viewerConnections) {
    const otherId = c.fromUserId === viewer?.id ? c.toUserId : c.fromUserId
    if (c.status === 'accepted') stateByUserId.set(otherId, 'connected')
    else stateByUserId.set(otherId, c.fromUserId === viewer?.id ? 'pending-sent' : 'pending-received')
  }

  const delegates: DelegateView[] = users
    .filter((u) => u.id !== viewer?.id)
    .map((u) => {
      const partners = partnersOf.get(u.id) ?? new Set<string>()
      const mutual = viewer ? [...partners].filter((id) => viewerPartners.has(id)).length : 0
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        country: u.country,
        flag: countryByName.get(u.country)?.flag ?? '🏳️',
        avatar: resolveAvatar(u),
        mutual,
        online: now - u.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
        connectionState: stateByUserId.get(u.id) ?? 'none',
      }
    })

  const stats: NetworkingStatView[] = [
    { label: 'Delegates Online', value: String(users.filter((u) => now - u.lastSeenAt.getTime() < ONLINE_WINDOW_MS).length) },
    { label: 'Connections Made', value: String(acceptedConnections.length) },
    { label: 'Pending Requests', value: String(pendingCount) },
    { label: 'Countries', value: String(distinctCountries.length) },
  ]

  return (
    <AppShell title="Networking">
      <NetworkingDirectory delegates={delegates} stats={stats} isLoggedIn={!!viewer} />
      <SiteFooter />
    </AppShell>
  )
}
