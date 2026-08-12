import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { OnlineExperience } from '@/components/online-experience/online-experience'

export const metadata: Metadata = {
  title: 'Online Experience | ICESCO Crisis Forum 2026',
  description: 'Experience the ICESCO Crisis Management Knowledge Forum 2026 across web and mobile.',
}

export default function OnlineExperiencePage() {
  return (
    <AppShell title="Online Experience">
      <OnlineExperience />
      <SiteFooter />
    </AppShell>
  )
}
