import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { KnowledgeHub } from '@/components/knowledge/knowledge-hub'

export const metadata: Metadata = {
  title: 'Knowledge Hub | ICESCO Crisis Forum 2026',
  description:
    'Discover, learn and share crisis-management knowledge — case studies, reports, tools, training and policies.',
}

export default function KnowledgePage() {
  return (
    <AppShell title="Knowledge Hub">
      <KnowledgeHub />
      <SiteFooter />
    </AppShell>
  )
}
