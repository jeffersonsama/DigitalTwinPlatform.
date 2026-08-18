import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { TwinCity } from '@/components/digital-twin/twin-city'
import { prisma } from '@/lib/db'
import { requireEnabledPage } from '@/lib/auth'
import type { TwinBuilding } from '@/components/digital-twin/twin-scene'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('digitalTwin.pageTitle')} | ICESCO Crisis Forum 2026`, description: t('digitalTwin.pageDescription') }
}

export default async function DigitalTwinPage() {
  await requireEnabledPage('digitalTwin')
  const { t } = await getTranslations()

  const rows = await prisma.twinBuilding.findMany({ orderBy: { name: 'asc' } })
  const buildings: TwinBuilding[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status === 'flood_risk' ? 'flood-risk' : b.status,
    x: b.x,
    y: b.y,
  }))

  return (
    <AppShell title={t('digitalTwin.pageTitle')}>
      <TwinCity buildings={buildings} />
    </AppShell>
  )
}
