'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n'

export function LoginForm() {
  const { t } = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || t('auth.errorGeneric'))
      return
    }
    router.push('/passport')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {t('auth.passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-icesco-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
      >
        {submitting ? t('auth.login.submitting') : t('shell.logIn')}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-icesco-blue hover:underline">
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </form>
  )
}
