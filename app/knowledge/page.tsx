import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { KnowledgeHub, type ResourceView } from '@/components/knowledge/knowledge-hub'
import { prisma } from '@/lib/db'
import { requireEnabledPage } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Knowledge Hub | ICESCO Crisis Forum 2026',
  description:
    'Discover, learn and share crisis-management knowledge — case studies, reports, tools, training and policies.',
}

const CATEGORIES = ['All', 'Case Studies', 'Reports', 'Tools', 'Training', 'Policies']

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  await requireEnabledPage('knowledgeHub')

  const params = await searchParams
  const activeCategory = CATEGORIES.includes(params.category ?? '') ? params.category! : 'All'
  const query = params.q ?? ''

  const [featuredRows, recentRows] = await Promise.all([
    prisma.resource.findMany({ where: { featured: true }, orderBy: { addedAt: 'desc' } }),
    prisma.resource.findMany({
      where: {
        featured: false,
        ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { addedAt: 'desc' },
    }),
  ])

  const toView = (r: (typeof featuredRows)[number]): ResourceView => ({
    id: r.id,
    title: r.title,
    type: r.type,
    category: r.category,
    country: r.country,
    language: r.language,
    tag: r.tag,
    image: r.image,
  })

  return (
    <AppShell title="Knowledge Hub">
      <KnowledgeHub
        categories={CATEGORIES}
        featured={featuredRows.map(toView)}
        recent={recentRows.map(toView)}
        activeCategory={activeCategory}
        query={query}
      />
      <SiteFooter />
    </AppShell>
  )
}
