import { AppShell } from '@/components/shell/app-shell'
import { Concierge } from '@/components/ai/concierge'

export default function AiPage() {
  return (
    <AppShell title="AI Concierge">
      <Concierge />
    </AppShell>
  )
}
