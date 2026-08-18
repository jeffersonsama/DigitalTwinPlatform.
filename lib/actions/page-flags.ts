'use server'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { TOGGLEABLE_KEYS } from '@/lib/page-flags'

// No revalidatePath needed — every page reads the session cookie via
// getCurrentUser(), which already opts these routes into per-request dynamic
// rendering, so the next load anywhere always sees fresh flag state.
export async function setPageEnabled(key: string, enabled: boolean) {
  await requireAdmin()
  if (!TOGGLEABLE_KEYS.includes(key)) return { error: 'Unknown page.' }

  await prisma.pageFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  })

  return { error: null }
}
