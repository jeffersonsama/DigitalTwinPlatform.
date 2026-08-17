import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { QrScanner, CloseScannerButton } from '@/components/networking/qr-scanner'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Scan QR | ICESCO Crisis Forum 2026',
  description: 'Scan a delegate’s QR code to view their profile and connect.',
}

export default async function ScanPage() {
  await requireUser()

  return (
    <AppShell title="Scan QR" right={<CloseScannerButton />}>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
        <QrScanner />
      </main>
    </AppShell>
  )
}
