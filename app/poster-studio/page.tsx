import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { PosterStudio } from '@/components/poster/poster-studio'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('posterStudio')} | ICESCO Crisis Forum 2026`, description: t('poster.pageDescription') }
}

export default async function PosterStudioPage() {
  await requireEnabledPage('posterStudio')
  const { t } = await getTranslations()

  return (
    <AppShell title={t('posterStudio')}>
      <PosterStudio />
      <SiteFooter />
    </AppShell>
  )
}
