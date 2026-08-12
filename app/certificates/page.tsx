import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { CertificatesList } from '@/components/certificates/certificates-list'

export const metadata: Metadata = {
  title: 'Certificates | ICESCO Crisis Forum 2026',
  description: 'Download and share your verified ICESCO forum certificates.',
}

export default function CertificatesPage() {
  return (
    <AppShell title="Certificates">
      <CertificatesList />
      <SiteFooter />
    </AppShell>
  )
}
