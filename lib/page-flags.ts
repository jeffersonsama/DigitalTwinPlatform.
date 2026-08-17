import { prisma } from '@/lib/db'
import { allRoutes } from '@/lib/nav'

/** Home is the bounce-back destination for disabled pages, and the Command
 * Center is where you flip these — neither makes sense to toggle off. */
export const TOGGLEABLE_KEYS = allRoutes.map((r) => r.key).filter((key) => key !== 'home' && key !== 'commandCenter')

/** Absence of a row means enabled — most pages never get one. */
export async function getDisabledKeys(): Promise<Set<string>> {
  const rows = await prisma.pageFlag.findMany({ where: { enabled: false } })
  return new Set(rows.map((r) => r.key))
}

export async function isPageEnabled(key: string): Promise<boolean> {
  const flag = await prisma.pageFlag.findUnique({ where: { key } })
  return flag?.enabled ?? true
}
