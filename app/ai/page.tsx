import { AppShell } from '@/components/shell/app-shell'
import { Concierge } from '@/components/ai/concierge'
import { requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export default async function AiPage() {
  await requireEnabledPage('aiConcierge')
  const { t } = await getTranslations()

  return (
    <AppShell title={t('aiConcierge')}>
      <Concierge />
    </AppShell>
  )
}
