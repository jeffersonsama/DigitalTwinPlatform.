'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Locale = 'en' | 'fr' | 'ar'

export const STORAGE_KEY = 'icesco-locale'

const dictionaries = {
  en: {
    home: 'Home',
    live: 'Live',
    program: 'Program',
    digitalTwin: 'Digital Twin',
    worldMap: 'World Map',
    simulation: 'Simulation',
    knowledgeHub: 'Knowledge Hub',
    networking: 'Networking',
    passport: 'My Passport',
    certificates: 'Certificates',
    aiConcierge: 'AI Concierge',
    commandCenter: 'Command Center',
    globalPulse: 'Global Pulse',
    onlineExperience: 'Online Experience',
    posterStudio: 'Poster Studio',
    search: 'Search',
    notifications: 'Notifications',
    theme: 'Theme',
    language: 'Language',
  },
  fr: {
    home: 'Accueil',
    live: 'Direct',
    program: 'Programme',
    digitalTwin: 'Jumeau numérique',
    worldMap: 'Carte mondiale',
    simulation: 'Simulation',
    knowledgeHub: 'Centre de connaissances',
    networking: 'Réseautage',
    passport: 'Mon passeport',
    certificates: 'Certificats',
    aiConcierge: 'Assistant IA',
    commandCenter: 'Centre de commandement',
    globalPulse: 'Pouls mondial',
    onlineExperience: 'Expérience en ligne',
    posterStudio: "Atelier d'affiches",
    search: 'Rechercher',
    notifications: 'Notifications',
    theme: 'Thème',
    language: 'Langue',
  },
  ar: {
    home: 'الرئيسية',
    live: 'مباشر',
    program: 'البرنامج',
    digitalTwin: 'التوأم الرقمي',
    worldMap: 'الخريطة العالمية',
    simulation: 'المحاكاة',
    knowledgeHub: 'مركز المعرفة',
    networking: 'التواصل',
    passport: 'جواز المنتدى',
    certificates: 'الشهادات',
    aiConcierge: 'المساعد الذكي',
    commandCenter: 'مركز القيادة',
    globalPulse: 'النبض العالمي',
    onlineExperience: 'التجربة الرقمية',
    posterStudio: 'استوديو الملصقات',
    search: 'بحث',
    notifications: 'الإشعارات',
    theme: 'المظهر',
    language: 'اللغة',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type TranslationKey = keyof (typeof dictionaries)['en']

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

/**
 * Inlined into <head> so lang/dir flip before first paint — otherwise a
 * returning fr/ar visitor sees a flash of the LTR/English shell before React
 * hydrates and the effect below can run.
 */
export const localeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var locale = stored === 'fr' || stored === 'ar' ? stored : 'en';
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}
})();
`

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'ar') setLocaleState(stored)
  }, [])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  function t(key: TranslationKey): string {
    return dictionaries[locale][key]
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
