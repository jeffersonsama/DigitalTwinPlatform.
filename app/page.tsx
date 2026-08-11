import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { StatRow } from '@/components/home/stat-row'
import { CrisisTimeline } from '@/components/home/crisis-timeline'

export default function HomePage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <Hero />
        <StatRow />
        <CrisisTimeline />
      </main>
      <SiteFooter />
    </AppShell>
  )
}
