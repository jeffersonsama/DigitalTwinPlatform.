import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { OnlineExperience } from '@/components/online-experience/online-experience'
import { requireEnabledPage } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Online Experience | ICESCO Crisis Forum 2026',
  description: 'Experience the ICESCO Crisis Management Knowledge Forum 2026 across web and mobile.',
}

export default async function OnlineExperiencePage() {
  await requireEnabledPage('onlineExperience')

  return (
    <AppShell title="Online Experience">
      <OnlineExperience />
      <SiteFooter />
    </AppShell>
  )
}
