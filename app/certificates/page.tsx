import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { CertificatesList, type CertificateView } from '@/components/certificates/certificates-list'
import { prisma } from '@/lib/db'
import { requireUser, requireEnabledPage } from '@/lib/auth'
import { PARTICIPATION_THRESHOLD_RATIO, COURSERA_XP_THRESHOLD } from '@/lib/gamification/config'

export const metadata: Metadata = {
  title: 'Certificates | ICESCO Crisis Forum 2026',
  description: 'Download and share your verified ICESCO forum certificates.',
}

export default async function CertificatesPage() {
  await requireEnabledPage('certificates')
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

  // Certificats "à venir" (participation, prochain palier Coursera) : tant qu'ils ne sont pas
  // encore émis, aucune ligne Certificate n'existe en base — ce sont des résumés de progression
  // calculés à la volée, pas des enregistrements persistés (docs/xp-certification-system.md §9).
  if (!rows.some((c) => c.type === 'participation')) {
    const [suiviCount, totalSessions] = await Promise.all([
      prisma.sessionAttendance.count({ where: { userId: user.id, suivi: true } }),
      prisma.programSession.count(),
    ])
    const pct = totalSessions > 0 ? Math.round((suiviCount / totalSessions) * 100) : 0
    certificates.push({
      id: 'upcoming-participation',
      title: 'Certificat de participation au forum',
      type: 'participation',
      code: null,
      status: suiviCount > 0 ? 'in-progress' : 'locked',
      issuedAt: null,
      progressLabel: `${suiviCount}/${totalSessions} panels suivis (${pct}% — objectif ${Math.round(PARTICIPATION_THRESHOLD_RATIO * 100)}%)`,
    })
  }

  const issuedCourseraCount = rows.filter((c) => c.type === 'coursera').length
  const nextCourseraThreshold = (issuedCourseraCount + 1) * COURSERA_XP_THRESHOLD
  if (user.xp < nextCourseraThreshold) {
    certificates.push({
      id: 'upcoming-coursera',
      title: `Certification Coursera — palier ${nextCourseraThreshold.toLocaleString()} XP`,
      type: 'coursera',
      code: null,
      status: user.xp > 0 ? 'in-progress' : 'locked',
      issuedAt: null,
      progressLabel: `${user.xp.toLocaleString()} / ${nextCourseraThreshold.toLocaleString()} XP Passeport jusqu'au prochain palier`,
    })
  }

  return (
    <AppShell title="Certificates">
      <CertificatesList certificates={certificates} recipientName={user.name} />
      <SiteFooter />
    </AppShell>
  )
}
