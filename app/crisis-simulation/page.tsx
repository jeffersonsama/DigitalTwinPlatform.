import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { CrisisSimulation } from '@/components/simulation/crisis-simulation'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('simulation')} | ICESCO Crisis Forum 2026`, description: t('simulation.pageDescription') }
}

export default async function CrisisSimulationPage() {
  await requireEnabledPage('simulation')
  const { t } = await getTranslations()

  return (
    <AppShell title={t('simulation')}>
      <CrisisSimulation />
    </AppShell>
  )
}
