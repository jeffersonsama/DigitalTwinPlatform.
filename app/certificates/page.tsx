import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { CertificatesList, type CertificateView } from '@/components/certificates/certificates-list'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Certificates | ICESCO Crisis Forum 2026',
  description: 'Download and share your verified ICESCO forum certificates.',
}

export default async function CertificatesPage() {
  const user = await requireUser()
  const rows = await prisma.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: 'desc' } })

  const certificates: CertificateView[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    code: c.code,
    status: c.status === 'in_progress' ? 'in-progress' : c.status,
    issuedAt: c.issuedAt
      ? c.issuedAt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
      : null,
  }))

  return (
    <AppShell title="Certificates">
      <CertificatesList certificates={certificates} />
      <SiteFooter />
    </AppShell>
  )
}
