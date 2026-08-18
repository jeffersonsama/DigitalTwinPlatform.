import { AppShell } from '@/components/shell/app-shell'
import { Concierge } from '@/components/ai/concierge'
import { requireEnabledPage } from '@/lib/auth'

export default async function AiPage() {
  await requireEnabledPage('aiConcierge')

  return (
    <AppShell title="AI Concierge">
      <Concierge />
    </AppShell>
  )
}
