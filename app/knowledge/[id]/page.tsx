import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText, BookOpen, Wrench, GraduationCap, Scale } from 'lucide-react'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { ResourceReadTimer } from '@/components/knowledge/resource-read-timer'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireEnabledPage } from '@/lib/auth'
import { PRESENCE } from '@/lib/gamification/config'

const typeIcon: Record<string, typeof FileText> = {
  report: FileText,
  case: BookOpen,
  tool: Wrench,
  training: GraduationCap,
  policy: Scale,
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const resource = await prisma.resource.findUnique({ where: { id } })
  return { title: resource ? `${resource.title} | Knowledge Hub` : 'Knowledge Hub | ICESCO Crisis Forum 2026' }
}

export default async function ResourceReaderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireEnabledPage('knowledgeHub')
  const { id } = await params

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) notFound()

  const user = await getCurrentUser()
  const read = user
    ? await prisma.resourceRead.findUnique({ where: { userId_resourceId: { userId: user.id, resourceId: id } } })
    : null

  const Icon = typeIcon[resource.type] ?? FileText

  return (
    <AppShell title="Knowledge Hub">
      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-5 px-4 py-6 md:px-6">
        <Link
          href="/knowledge"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au Knowledge Hub
        </Link>

        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-pretty font-display text-xl font-bold text-foreground md:text-2xl">{resource.title}</h1>
            <p className="text-sm text-muted-foreground">
              {resource.category} · {resource.country ?? 'Global'}
              {resource.language ? ` · ${resource.language}` : ''}
            </p>
          </div>
        </header>

        {user && (
          <ResourceReadTimer
            initialSecondsSpent={read?.secondsSpent ?? 0}
            thresholdSeconds={PRESENCE.RESOURCE_READ_THRESHOLD_SECONDS}
            initialCompleted={!!read?.completedAt}
          />
        )}

        {resource.url ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <iframe src={resource.url} title={resource.title} className="h-[70vh] w-full" />
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1.5 text-sm font-medium text-icesco-blue hover:underline"
            >
              Ouvrir le document original <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Ce document n&apos;a pas encore de lien associé — la lecture reste comptabilisée depuis cette page.
          </div>
        )}
      </main>
      <SiteFooter />
    </AppShell>
  )
}
