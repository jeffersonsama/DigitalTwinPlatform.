import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { CertificatesList, type CertificateView } from '@/components/certificates/certificates-list'
import { prisma } from '@/lib/db'
import { requireUser, requireEnabledPage } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('certificates')} | ICESCO Crisis Forum 2026`, description: t('certificates.pageDescription') }
}

export default async function CertificatesPage() {
  await requireEnabledPage('certificates')
  const user = await requireUser()
  const { t } = await getTranslations()
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
    <AppShell title={t('certificates')}>
      <CertificatesList certificates={certificates} recipientName={user.name} />
      <SiteFooter />
    </AppShell>
  )
}
