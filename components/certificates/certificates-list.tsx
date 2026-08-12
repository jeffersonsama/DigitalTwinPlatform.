import { Award, Download, Share2, CheckCircle2, Clock, Lock, ShieldCheck } from 'lucide-react'
import { certificates } from '@/lib/data'
import { cn } from '@/lib/utils'

const statusMeta = {
  issued: { label: 'Issued', tone: 'bg-icesco-teal/10 text-icesco-teal', Icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', tone: 'bg-forum-orange/10 text-forum-orange', Icon: Clock },
  locked: { label: 'Locked', tone: 'bg-secondary text-muted-foreground', Icon: Lock },
} as const

export function CertificatesList() {
  const issued = certificates.filter((c) => c.status === 'issued').length

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">Certificates</h1>
            <p className="text-sm text-muted-foreground">Your verified forum achievements.</p>
          </div>
        </div>
        <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-icesco-blue">
          {issued} earned
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((c) => {
          const meta = statusMeta[c.status]
          const locked = c.status === 'locked'
          return (
            <article
              key={c.title}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-border bg-card',
                locked && 'opacity-70',
              )}
            >
              {/* Certificate visual */}
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-icesco to-icesco-blue p-4">
                <div className="grid-glow absolute inset-0 opacity-40" />
                <div className="relative flex flex-col items-center text-center text-white">
                  <ShieldCheck className="h-9 w-9 text-cyan-accent" />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/70">Certificate of</p>
                  <p className="text-sm font-semibold">{c.type}</p>
                </div>
                <span
                  className={cn(
                    'absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    meta.tone,
                  )}
                >
                  <meta.Icon className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-h-[3rem]">
                  <h3 className="text-pretty font-semibold leading-snug text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.status === 'issued' ? `Issued ${c.issued}` : meta.label}
                  </p>
                </div>
                {c.status === 'issued' && (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">ID: {c.id}</p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    disabled={c.status !== 'issued'}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-icesco-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    disabled={c.status !== 'issued'}
                    aria-label="Share certificate"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
