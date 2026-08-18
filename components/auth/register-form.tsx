'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COUNTRIES } from '@/lib/countries'
import { useLocale } from '@/lib/i18n'

export function RegisterForm() {
  const { t } = useLocale()
  const router = useRouter()
  const [values, setValues] = useState({ name: '', email: '', password: '', role: '', country: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
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
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {t('auth.register.fullNameLabel')}
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={update('name')}
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            {t('auth.register.roleLabel')}
          </label>
          <input
            id="role"
            required
            placeholder={t('auth.register.rolePlaceholder')}
            value={values.role}
            onChange={update('role')}
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-foreground">
            {t('auth.register.countryLabel')}
          </label>
          <select
            id="country"
            required
            value={values.country}
            onChange={update('country')}
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>
              Select a country…
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.isoCode} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          required
          value={values.email}
          onChange={update('email')}
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
          minLength={8}
          value={values.password}
          onChange={update('password')}
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">{t('auth.register.passwordHint')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-icesco-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
      >
        {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.register.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-icesco-blue hover:underline">
          {t('shell.logIn')}
        </Link>
      </p>
    </form>
  )
}
