import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { OnlineExperience } from '@/components/online-experience/online-experience'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('onlineExperience')} | ICESCO Crisis Forum 2026`, description: t('onlineExperience.pageDescription') }
}

export default async function OnlineExperiencePage() {
  await requireEnabledPage('onlineExperience')
  const { t } = await getTranslations()

  return (
    <AppShell title={t('onlineExperience')}>
      <OnlineExperience />
      <SiteFooter />
    </AppShell>
  )
}
