import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { PulseWall } from '@/components/pulse/pulse-wall'
import { getGlobalStats, getCountryEngagement } from '@/lib/stats'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('globalPulse')} | ICESCO Crisis Forum 2026`, description: t('pulse.pageDescription') }
}

export default async function GlobalPulsePage() {
  await requireEnabledPage('globalPulse')
  const [stats, countries, { t }] = await Promise.all([getGlobalStats(), getCountryEngagement(), getTranslations()])

  return (
    <AppShell title={t('pulse.pageTitle')}>
      <PulseWall
        countriesConnected={stats.countriesConnected}
        participantsOnline={stats.participantsOnline}
        ideasShared={stats.ideasShared}
        projectsInitiated={stats.projectsInitiated}
        challengesCompleted={stats.challengesCompleted}
        countries={countries}
      />
    </AppShell>
  )
}
