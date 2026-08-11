import { TopNav } from '@/components/nav/top-nav'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { StatRow } from '@/components/home/stat-row'
import { CrisisTimeline } from '@/components/home/crisis-timeline'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <Hero />
        <StatRow />
        <CrisisTimeline />
      </main>
      <SiteFooter />
    </div>
  )
}
