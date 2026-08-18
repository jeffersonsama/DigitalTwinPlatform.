'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

export function BackButton() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {t('auth.back')}
    </button>
  )
}
