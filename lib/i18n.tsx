'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { STORAGE_KEY, COOKIE_KEY, translate, type Locale, type TranslationKey } from './i18n-shared'

export type { Locale, TranslationKey }

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const hasCookie = document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_KEY}=`))
    if ((stored === 'fr' || stored === 'ar') && stored !== locale) {
      setLocaleState(stored)
    }
    if ((stored === 'fr' || stored === 'ar') && !hasCookie) {
      document.cookie = `${COOKIE_KEY}=${stored}; path=/; max-age=31536000`
      router.refresh()
    }
    // Only ever needs to reconcile once, right after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=31536000`
    // Server Components render from the cookie, so nudge Next.js to
    // re-fetch them with the new locale instead of leaving them stale
    // until the next full navigation.
    router.refresh()
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    return translate(locale, key, vars)
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
