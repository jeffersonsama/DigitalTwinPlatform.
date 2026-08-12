import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { NetworkingDirectory } from '@/components/networking/networking-directory'

export const metadata: Metadata = {
  title: 'Networking | ICESCO Crisis Forum 2026',
  description: 'Connect and collaborate with delegates from across the Islamic world.',
}

export default function NetworkingPage() {
  return (
    <AppShell title="Networking">
      <NetworkingDirectory />
      <SiteFooter />
    </AppShell>
  )
}
