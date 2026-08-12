import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { DigitalPassport } from '@/components/passport/digital-passport'

export const metadata: Metadata = {
  title: 'My Passport | ICESCO Crisis Forum 2026',
  description: 'Your digital forum passport — level, badges, certificates, skills and progress.',
}

export default function PassportPage() {
  return (
    <AppShell title="My Passport">
      <DigitalPassport />
      <SiteFooter />
    </AppShell>
  )
}
