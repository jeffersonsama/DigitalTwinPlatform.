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
    worldMap: 'World Crisis Map',
    simulation: 'Simulation',
    knowledgeHub: 'Knowledge Hub',
    networking: 'Networking',
    messages: 'Messages',
    passport: 'My Passport',
    certificates: 'Certificates',
    crisisCity: 'Crisis City',
    aiConcierge: 'AI Concierge',
    commandCenter: 'Command Center',
    globalPulse: 'Global Pulse',
    onlineExperience: 'Online Experience',
    posterStudio: 'Poster Studio',
    crisisCityAdmin: 'Crisis City — Admin',
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
    worldMap: 'Carte mondiale des crises',
    simulation: 'Simulation',
    knowledgeHub: 'Centre de connaissances',
    networking: 'Réseautage',
    messages: 'Messages',
    passport: 'Mon passeport',
    certificates: 'Certificats',
    crisisCity: 'Crisis City',
    aiConcierge: 'Assistant IA',
    commandCenter: 'Centre de commandement',
    globalPulse: 'Pouls mondial',
    onlineExperience: 'Expérience en ligne',
    posterStudio: "Atelier d'affiches",
    crisisCityAdmin: 'Crisis City — Admin',
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
    worldMap: 'خريطة الأزمات العالمية',
    simulation: 'المحاكاة',
    knowledgeHub: 'مركز المعرفة',
    networking: 'التواصل',
    messages: 'الرسائل',
    passport: 'جواز المنتدى',
    certificates: 'الشهادات',
    crisisCity: 'كرايسيس سيتي',
    aiConcierge: 'المساعد الذكي',
    commandCenter: 'مركز القيادة',
    globalPulse: 'النبض العالمي',
    onlineExperience: 'التجربة الرقمية',
    posterStudio: 'استوديو الملصقات',
    crisisCityAdmin: 'كرايسيس سيتي — الإدارة',
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
