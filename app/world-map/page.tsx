import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('worldMap')} | ICESCO Crisis Forum 2026`, description: t('worldMap.pageDescription') }
}

export default async function WorldMapPage() {
  await requireEnabledPage('worldMap')
  const { t } = await getTranslations()

  return (
    <AppShell title={t('worldMap')}>
      <main className="flex-1 p-4 md:p-6">
        <iframe
          src="https://crisight.com"
          title={t('worldMap')}
          className="h-[calc(100vh-6.5rem)] w-full rounded-xl border border-white/10"
        />
      </main>
    </AppShell>
  )
}
