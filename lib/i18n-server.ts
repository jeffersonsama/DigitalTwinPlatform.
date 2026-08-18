import { cookies } from 'next/headers'
import { COOKIE_KEY, translate, type Locale, type TranslationKey } from '@/lib/i18n-shared'

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(COOKIE_KEY)?.value
  return value === 'fr' || value === 'ar' ? value : 'en'
}

export async function getTranslations() {
  const locale = await getServerLocale()
  return {
    locale,
    t: (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
  }
}
