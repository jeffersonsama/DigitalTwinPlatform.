'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Download, Sparkles, Type, Palette, CheckCircle2, UploadCloud } from 'lucide-react'
import { posterTemplates } from '@/lib/data'
import { publishPoster } from '@/lib/actions/poster-studio'
import { cn } from '@/lib/utils'

export function PosterStudio() {
  const [template, setTemplate] = useState(posterTemplates[0])
  const [title, setTitle] = useState('Building Resilient Communities')
  const [subtitle, setSubtitle] = useState('ICESCO Crisis Management Knowledge Forum 2026')
  const [published, setPublished] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">Poster Studio</h1>
            <p className="text-sm text-muted-foreground">Create shareable forum posters.</p>
          </div>
        </header>

        {/* Templates */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Palette className="h-3.5 w-3.5" /> Template
          </p>
          <div className="grid grid-cols-2 gap-2">
            {posterTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setTemplate(tpl)
                  setPublished(false)
                }}
                className={cn(
                  'overflow-hidden rounded-xl border p-2 text-left transition-colors',
                  template.id === tpl.id ? 'border-icesco-blue ring-2 ring-ring/40' : 'border-border hover:border-icesco-blue',
                )}
              >
                <span className={cn('block h-10 rounded-lg bg-gradient-to-br', tpl.accent)} />
                <span className="mt-1.5 block text-xs font-medium text-foreground">{tpl.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Text inputs */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Type className="h-3.5 w-3.5" /> Content
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Headline</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setPublished(false)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-icesco-blue focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Subtitle</span>
            <input
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value)
                setPublished(false)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-icesco-blue focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </section>

        <div className="flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-icesco-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-icesco">
            <Sparkles className="h-4 w-4" /> AI Enhance
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        <button
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await publishPoster({ template: template.id, title, subtitle })
              setPublished(true)
            })
          }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60',
            published ? 'bg-icesco-teal hover:bg-icesco-teal/90' : 'bg-forum-orange hover:bg-forum-orange/90',
          )}
        >
          {published ? <CheckCircle2 className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
          {pending ? 'Publication…' : published ? 'Publiée · +20 XP' : 'Publier cette affiche'}
        </button>
      </div>

      {/* Live preview */}
      <section className="flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/50 p-4 md:p-8">
        <div className="w-full max-w-sm">
          <div className={cn('relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br shadow-xl', template.accent)}>
            <Image
              src="/images/poster-person.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 90vw, 384px"
              className="object-cover opacity-40 mix-blend-luminosity"
            />
            <div className="grid-glow absolute inset-0 opacity-30" />
            <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold tracking-wide">ICESCO</span>
                <span className="rounded-full border border-white/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {template.label}
                </span>
              </div>
              <div>
                <h2 className="text-balance font-display text-3xl font-extrabold leading-tight">{title}</h2>
                <p className="mt-3 text-pretty text-sm text-white/85">{subtitle}</p>
                <div className="mt-4 h-1 w-16 rounded-full bg-cyan-accent" />
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Live preview · updates as you type</p>
        </div>
      </section>
    </main>
  )
}
