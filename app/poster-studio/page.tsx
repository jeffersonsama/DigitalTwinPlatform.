import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { PosterStudio } from '@/components/poster/poster-studio'
import { requireEnabledPage } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Poster Studio | ICESCO Crisis Forum 2026',
  description: 'Design and export shareable posters for the ICESCO Crisis Forum 2026.',
}

export default async function PosterStudioPage() {
  await requireEnabledPage('posterStudio')

  return (
    <AppShell title="Poster Studio">
      <PosterStudio />
      <SiteFooter />
    </AppShell>
  )
}
