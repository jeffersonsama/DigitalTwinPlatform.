import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  const country = typeof body?.country === 'string' ? body.country.trim() : ''

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

  const user = await prisma.user.create({
    data: { email, name, role, country, passwordHash: await hashPassword(password) },
  })

  await createSession(user.id)
  return NextResponse.json({ id: user.id, name: user.name, email: user.email })
}
