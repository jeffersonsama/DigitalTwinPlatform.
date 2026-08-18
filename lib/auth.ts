import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { isPageEnabled } from '@/lib/page-flags'
import type { User } from '@/lib/generated/prisma/client'

export const SESSION_COOKIE = 'session'
const SESSION_TTL = '30d'

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function createSession(userId: string) {
  const token = jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: SESSION_TTL })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/** Shared by the cookie-based Next.js path and the Socket.IO handshake (which
 * has no `next/headers` — it reads the raw `Cookie` header instead). */
export function verifySessionToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, jwtSecret())
    if (typeof payload === 'string' || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}

/** Verifies the session cookie, loads the user, and bumps `lastSeenAt` — this
 * doubles as the presence signal behind the Home page's "online" count.
 * Wrapped in React's per-request `cache()` so calling it from both AppShell
 * and a page's own data-fetching only hits the database once per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const userId = verifySessionToken(token)
  if (!userId) return null

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
  return user
})

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Gates admin-only surfaces (e.g. the Command Center, and the Crisis City
 * animateur/admin tools). Delegates are sent home rather than shown a 403 —
 * the nav rail already hides these entries for them, so landing here at all
 * means a stale link or a direct hit. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.accessRole !== 'admin') redirect('/')
  return user
}

/** Gates a page an admin has switched off via Command Center's Page
 * Visibility panel. Admins always bypass — they're the ones who'd need to
 * turn it back on, and the nav rail already marks it "disabled" for them
 * rather than hiding it outright. Delegates get bounced home, matching the
 * admin-only route pattern above. */
export async function requireEnabledPage(key: string): Promise<void> {
  const user = await getCurrentUser()
  if (user?.accessRole === 'admin') return
  if (!(await isPageEnabled(key))) redirect('/')
}
