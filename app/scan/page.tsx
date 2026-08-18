import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { QrScanner, CloseScannerButton } from '@/components/networking/qr-scanner'
import { requireUser } from '@/lib/auth'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('networking.scanQr')} | ICESCO Crisis Forum 2026`, description: t('scan.pageDescription') }
}

export default async function ScanPage() {
  await requireUser()
  const { t } = await getTranslations()

  return (
    <AppShell title={t('networking.scanQr')} right={<CloseScannerButton />}>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
        <QrScanner />
      </main>
    </AppShell>
  )
}
