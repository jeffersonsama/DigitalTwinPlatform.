import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { requireEnabledPage } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'World Crisis Map | ICESCO Crisis Forum 2026',
  description: 'A live global view of ongoing crises around the world.',
}

export default async function WorldMapPage() {
  await requireEnabledPage('worldMap')

  return (
    <AppShell title="World Crisis Map">
      <main className="flex-1 p-4 md:p-6">
        <iframe
          src="https://crisight.com"
          title="World Crisis Map"
          className="h-[calc(100vh-6.5rem)] w-full rounded-xl border border-white/10"
        />
      </main>
    </AppShell>
  )
}
