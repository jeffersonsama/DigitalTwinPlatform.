'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { AVATAR_IDS } from '@/lib/avatar'

export async function updateProfile({
  name,
  role,
  country,
  avatar,
}: {
  name: string
  role: string
  country: string
  avatar: string
}) {
  const user = await requireUser()

  const trimmedName = name.trim()
  const trimmedRole = role.trim()
  if (!trimmedName) return { error: 'Name cannot be empty.' }
  if (!trimmedRole) return { error: 'Role cannot be empty.' }
  if (!(AVATAR_IDS as readonly string[]).includes(avatar)) return { error: 'Invalid avatar.' }

  const countryExists = await prisma.country.findUnique({ where: { name: country } })
  if (!countryExists) return { error: 'Invalid country.' }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: trimmedName, role: trimmedRole, country, avatar },
  })

  revalidatePath('/passport')
  revalidatePath('/networking')
  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/messages')
  return { error: null }
}
