import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { hashPassword, createSession } from '@/lib/auth'
import { generateReferralCode } from '@/lib/referral'
import { awardXp } from '@/lib/gamification/xp'
import { XP } from '@/lib/gamification/config'

const MAX_REFERRAL_CODE_ATTEMPTS = 5

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  const country = typeof body?.country === 'string' ? body.country.trim() : ''
  const ref = typeof body?.ref === 'string' ? body.ref.trim().toUpperCase() : ''

  if (!email || !password || !name || !role || !country) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const referrer = ref ? await prisma.user.findUnique({ where: { referralCode: ref } }) : null
  const passwordHash = await hashPassword(password)

  let user
  for (let attempt = 0; ; attempt++) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          country,
          passwordHash,
          referralCode: generateReferralCode(),
          referredById: referrer?.id,
        },
      })
      break
    } catch (error) {
      const isReferralCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[] | undefined)?.includes('referralCode')
      if (!isReferralCodeCollision || attempt >= MAX_REFERRAL_CODE_ATTEMPTS) throw error
    }
  }

  if (referrer) {
    // Le bonus de parrainage ne doit jamais faire échouer l'inscription elle-même.
    await awardXp(referrer.id, {
      key: `REFERRAL:${referrer.id}:${user.id}`,
      amount: XP.SHARE_REFERRAL_BONUS,
      title: `Parrainage — ${name} a rejoint le forum`,
      meta: 'Partage',
    }).catch(() => {})
  }

  await createSession(user.id)
  return NextResponse.json({ id: user.id, name: user.name, email: user.email })
}
