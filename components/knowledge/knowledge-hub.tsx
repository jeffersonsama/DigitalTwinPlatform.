'use client'

import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, BookOpen, FileText, Wrench, GraduationCap, Scale, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcon: Record<string, typeof FileText> = {
  report: FileText,
  case: BookOpen,
  tool: Wrench,
  training: GraduationCap,
  policy: Scale,
}

export interface ResourceView {
  id: string
  title: string
  type: string
  category: string
  country: string | null
  language: string | null
  tag: string | null
  image: string | null
}

export function KnowledgeHub({
  categories,
  featured,
  recent,
  activeCategory,
  query,
}: {
  categories: string[]
  featured: ResourceView[]
  recent: ResourceView[]
  activeCategory: string
  query: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [queryInput, setQueryInput] = useState(query)

  function updateParams(next: { category?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.category !== undefined) {
      if (next.category === 'All') params.delete('category')
      else params.set('category', next.category)
    }
    if (next.q !== undefined) {
      if (!next.q) params.delete('q')
      else params.set('q', next.q)
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">Knowledge Hub</h1>
          <p className="text-sm text-muted-foreground">Discover, learn and share knowledge.</p>
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateParams({ q: queryInput })
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search for sessions, documents, experts, cases…"
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-icesco-blue focus:ring-2 focus:ring-ring/40"
        />
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              disabled={pending}
              onClick={() => updateParams({ category: c })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                activeCategory === c
                  ? 'border-icesco-blue bg-icesco-blue text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-icesco-blue hover:text-icesco-blue',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured Resources</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((r) => {
            const Icon = typeIcon[r.type] ?? FileText
            return (
              <article
                key={r.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={r.image || '/placeholder.svg'}
                    alt={r.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {r.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="text-pretty font-semibold leading-snug text-foreground">{r.title}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-icesco-teal" />
                    {r.tag}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Additions</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No resources match your filters.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => {
                const Icon = typeIcon[r.type] ?? FileText
                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-icesco-blue">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category} · {r.country ?? 'Global'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {r.language && (
                        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {r.language}
                        </span>
                      )}
                      <button className="flex items-center gap-1 text-xs font-medium text-icesco-blue hover:underline">
                        Open
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
