import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { DigitalPassport } from '@/components/passport/digital-passport'
import { prisma } from '@/lib/db'
import { requireUser, requireEnabledPage } from '@/lib/auth'
import { resolveAvatarId } from '@/lib/avatar'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('passport')} | ICESCO Crisis Forum 2026`, description: t('passport.pageDescription') }
}

export default async function PassportPage() {
  await requireEnabledPage('passport')
  const user = await requireUser()
  const { t } = await getTranslations()

  const [badges, skills, progress, activity, certs, connectionsCount, certificatesCount, countries, referralsCount] =
    await Promise.all([
      prisma.badge.findMany({ where: { userId: user.id } }),
      prisma.skill.findMany({ where: { userId: user.id } }),
      prisma.progressItem.findMany({ where: { userId: user.id } }),
      prisma.activityLogEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: 'desc' }, take: 4 }),
      prisma.connection.count({
        where: { status: 'accepted', OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
      }),
      prisma.certificate.count({ where: { userId: user.id, status: 'issued' } }),
      prisma.country.findMany({ orderBy: { name: 'asc' } }),
      prisma.user.count({ where: { referredById: user.id } }),
    ])

  const missions = progress.find((p) => p.label === 'Missions Completed')?.value ?? 0

  return (
    <AppShell title={t('passport')}>
      <DigitalPassport
        passport={{
          id: user.id,
          name: user.name,
          avatar: resolveAvatarId(user),
          role: user.role,
          country: user.country,
          level: user.level,
          levelTitle: user.levelTitle,
          xp: user.xp,
          xpMax: user.xpMax,
          referralCode: user.referralCode,
          referralsCount,
          stats: { missions, connections: connectionsCount, certificates: certificatesCount },
        }}
        countries={countries.map((c) => ({ name: c.name, flag: c.flag }))}
        badges={badges}
        skills={skills}
        progress={progress}
        activity={activity}
        certificates={certs.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          issuedLabel: c.issuedAt
            ? c.issuedAt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
            : c.status === 'in_progress'
              ? t('certificates.status.inProgress')
              : t('certificates.status.locked'),
        }))}
      />
      <SiteFooter />
    </AppShell>
  )
}
