import { cache } from 'react'
import { prisma } from '@/lib/db'

const ONLINE_WINDOW_MS = 5 * 60 * 1000

export const getGlobalStats = cache(async () => {
  const [distinctCountries, users, metrics] = await Promise.all([
    prisma.user.findMany({ distinct: ['country'], select: { country: true } }),
    prisma.user.findMany({ select: { lastSeenAt: true } }),
    prisma.eventMetric.findMany(),
  ])
  const now = Date.now()
  const metricValue = (key: string) => metrics.find((m) => m.key === key)?.value ?? 0

  return {
    countriesConnected: distinctCountries.length,
    participantsOnline: users.filter((u) => now - u.lastSeenAt.getTime() < ONLINE_WINDOW_MS).length,
    ideasShared: metricValue('ideasShared'),
    projectsInitiated: metricValue('projectsInitiated'),
    challengesCompleted: metricValue('challengesCompleted'),
  }
})

export interface CountryEngagement {
  name: string
  value: number
  flag: string
  lat: number
  lng: number
  activity: 'high' | 'medium' | 'low'
}

/** Real per-country participant counts, joined with the seeded Country
 * reference table for flag/coordinates — replaces the old hardcoded
 * topCountries/activeCountryMarkers arrays. */
export const getCountryEngagement = cache(async (): Promise<CountryEngagement[]> => {
  const [grouped, countries] = await Promise.all([
    prisma.user.groupBy({ by: ['country'], _count: { country: true } }),
    prisma.country.findMany(),
  ])
  const countryByName = new Map(countries.map((c) => [c.name, c]))
  const max = Math.max(1, ...grouped.map((g) => g._count.country))

  return grouped
    .map((g) => {
      const ref = countryByName.get(g.country)
      const value = g._count.country
      const activity: CountryEngagement['activity'] =
        value >= max * 0.6 ? 'high' : value >= max * 0.3 ? 'medium' : 'low'
      return {
        name: g.country,
        value,
        flag: ref?.flag ?? '🏳️',
        lat: ref?.lat ?? 0,
        lng: ref?.lng ?? 0,
        activity,
      }
    })
    .sort((a, b) => b.value - a.value)
})
