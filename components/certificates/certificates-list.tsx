'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'
import { Award, Download, Share2, CheckCircle2, Clock, Lock, Calendar, MapPin } from 'lucide-react'
import { useLocale, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] })

// Every size below is expressed in cqw (1% of the card's own width) instead of
// px/rem, so the whole certificate scales as one proportional unit no matter
// how wide its container ends up being — a fixed-px design only looks right
// at the one width it was tuned against.
const s = (px: number) => `${(px / 10).toFixed(3)}cqw`

// Chamfered-corner shape matching the reference certificate's cut corners.
const CERT_CLIP = `polygon(${s(18)} 0%, calc(100% - ${s(18)}) 0%, 100% ${s(18)}, 100% calc(100% - ${s(18)}), calc(100% - ${s(18)}) 100%, ${s(18)} 100%, 0% calc(100% - ${s(18)}), 0% ${s(18)})`

export interface CertificateView {
  id: string
  title: string
  type: string
  code: string | null
  status: 'issued' | 'in-progress' | 'locked'
  issuedAt: string | null
  /** Résumé statique de progression (ex. "3/8 panels suivis (38% — objectif 75%)"), calculé
   * côté serveur pour les certificats pas encore émis — jamais un décompte en temps réel, qui
   * reste sur la page source de l'activité (Live, Program, lecteur Knowledge Hub). */
  progressLabel?: string | null
}

const statusMeta = {
  issued: { labelKey: 'certificates.status.issued', tone: 'bg-icesco-teal/10 text-icesco-teal', Icon: CheckCircle2 },
  'in-progress': { labelKey: 'certificates.status.inProgress', tone: 'bg-forum-orange/10 text-forum-orange', Icon: Clock },
  locked: { labelKey: 'certificates.status.locked', tone: 'bg-secondary text-muted-foreground', Icon: Lock },
} satisfies Record<string, { labelKey: TranslationKey; tone: string; Icon: typeof CheckCircle2 }>

const PARTNERS = [
  { src: '/partners/icesco.png', alt: 'ICESCO', badge: '#0f4c4f' },
  { src: '/partners/mbrf.png', alt: 'Mohammed Bin Rashid Al Maktoum Knowledge Foundation', badge: '#0b2a4a' },
  { src: '/partners/undp.png', alt: 'UNDP', badge: '#0b2a4a' },
]

const GOLD = '#caa353'
const TEAL = '#0f4c4f'
const NAVY = '#14324a'
const MUTED = '#54606b'

export function CertificatesList({
  certificates,
  recipientName,
}: {
  certificates: CertificateView[]
  recipientName: string
}) {
  const { t } = useLocale()
  const issued = certificates.filter((c) => c.status === 'issued').length
  const [selectedId, setSelectedId] = useState(certificates[0]?.id)
  const selected = certificates.find((c) => c.id === selectedId) ?? certificates[0]

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">{t('certificates')}</h1>
            <p className="text-sm text-muted-foreground">{t('certificates.subtitle')}</p>
          </div>
        </div>
        <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-icesco-blue">
          {t('certificates.earned', { count: issued })}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        {/* Selectable list */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {certificates.map((c) => {
            const meta = statusMeta[c.status]
            const locked = c.status === 'locked'
            const active = c.id === selected?.id
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors',
                  active ? 'border-icesco-blue bg-accent/60' : 'border-border bg-card hover:border-icesco-blue/50',
                  locked && 'opacity-70',
                )}
              >
                <div className="flex items-center justify-between">
                  <Award className="h-5 w-5 text-icesco-blue" />
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.tone)}>
                    <meta.Icon className="h-3 w-3" />
                    {t(meta.labelKey)}
                  </span>
                </div>
                <h3 className="text-pretty text-sm font-semibold leading-snug text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {c.status === 'issued'
                    ? t('certificates.issuedOn', { date: c.issuedAt ?? '' })
                    : (c.progressLabel ?? t(meta.labelKey))}
                </p>
              </button>
            )
          })}
        </div>

        {/* Certificate preview */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-20">
          {selected ? (
            <div style={{ containerType: 'inline-size' }}>
              <div style={{ padding: s(6), background: '#dfe3de', clipPath: CERT_CLIP, aspectRatio: '1492 / 1054' }}>
                <div
                  className="relative h-full overflow-hidden bg-white text-center"
                  style={{ border: `${s(6)} solid ${TEAL}`, clipPath: CERT_CLIP, padding: s(32) }}
                >
                  <Image
                    src="/certificates/corner-motif.png"
                    alt=""
                    width={312}
                    height={235}
                    className="pointer-events-none absolute w-auto"
                    style={{ height: s(176), right: s(-8), top: s(-8), mixBlendMode: 'multiply' }}
                  />
                  <Image
                    src="/certificates/corner-motif.png"
                    alt=""
                    width={312}
                    height={235}
                    className="pointer-events-none absolute w-auto -scale-x-100 -scale-y-100"
                    style={{ height: s(176), left: s(-8), bottom: s(-8), mixBlendMode: 'multiply' }}
                  />
                  <Image
                    src="/certificates/wave-texture.png"
                    alt=""
                    width={370}
                    height={300}
                    className="pointer-events-none absolute right-0 w-auto"
                    style={{ height: s(208), top: '30%', mixBlendMode: 'multiply' }}
                  />

                  <div className="relative flex items-center justify-center">
                    <Image
                      src="/icesco-logo.png"
                      alt="ICESCO"
                      width={260}
                      height={125}
                      className="h-auto w-auto"
                      style={{ width: s(256) }}
                    />
                  </div>

                  <h2
                    className="relative font-display font-extrabold uppercase leading-none"
                    style={{ color: TEAL, marginTop: s(28), fontSize: s(44), letterSpacing: '0.08em' }}
                  >
                    {t('certificates.template.heading')}
                  </h2>
                  <div className="relative flex items-center justify-center" style={{ marginTop: s(10), gap: s(12) }}>
                    <span style={{ height: '1px', width: s(48), background: GOLD }} />
                    <p className="font-semibold uppercase" style={{ color: GOLD, fontSize: s(14), letterSpacing: '0.3em' }}>
                      {t('certificates.template.of', { type: selected.type })}
                    </p>
                    <span style={{ height: '1px', width: s(48), background: GOLD }} />
                  </div>

                  <p className="relative text-slate-500" style={{ marginTop: s(28), fontSize: s(14) }}>
                    {t('certificates.template.certifyThat')}
                  </p>
                  <p
                    className={cn(playfair.className, 'relative font-bold')}
                    style={{ color: TEAL, marginTop: s(4), fontSize: s(36) }}
                  >
                    {recipientName}
                  </p>
                  <div
                    className="relative mx-auto rotate-45"
                    style={{ marginTop: s(10), height: s(8), width: s(8), background: GOLD }}
                  />

                  <p className="relative text-slate-500" style={{ marginTop: s(20), fontSize: s(14) }}>
                    {t('certificates.template.participatedIn')}
                  </p>
                  <p className="relative font-bold" style={{ color: NAVY, marginTop: s(4), fontSize: s(18) }}>
                    {t('certificates.template.forumName', { title: selected.title })}
                  </p>

                  <div
                    className="relative flex flex-wrap items-center justify-center font-medium"
                    style={{ color: MUTED, marginTop: s(16), gap: s(16), fontSize: s(14) }}
                  >
                    <span className="flex items-center" style={{ gap: s(6) }}>
                      <Calendar style={{ color: TEAL, height: s(16), width: s(16) }} /> {t('certificates.template.dateRange')}
                    </span>
                    <span style={{ height: s(14), width: '1px', background: GOLD }} />
                    <span className="flex items-center" style={{ gap: s(6) }}>
                      <MapPin style={{ color: TEAL, height: s(16), width: s(16) }} /> {t('certificates.template.location')}
                    </span>
                  </div>

                  <div
                    className="relative grid grid-cols-[0.9fr_1.6fr_auto] items-center border-t text-left"
                    style={{ borderColor: '#e2e5e0', marginTop: s(32), gap: s(20), paddingTop: s(24), paddingBottom: s(6) }}
                  >
                    <div>
                      <Image
                        src="/certificates/signature.png"
                        alt="Signature"
                        width={280}
                        height={80}
                        className="w-auto"
                        style={{ height: s(44), mixBlendMode: 'multiply' }}
                      />
                      <div className="flex items-center" style={{ marginTop: s(8), gap: s(6) }}>
                        <span style={{ height: '1px', width: s(56), background: GOLD }} />
                        <span className="rotate-45" style={{ height: s(4), width: s(4), background: GOLD }} />
                      </div>
                      <p className="font-semibold text-slate-700" style={{ marginTop: s(6), fontSize: s(12) }}>
                        {t('certificates.template.directorGeneral')}
                      </p>
                      <p className="text-slate-400" style={{ fontSize: s(11) }}>
                        ICESCO
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center" style={{ gap: s(8) }}>
                        <span className="shrink-0" style={{ height: '1px', width: s(20), background: GOLD }} />
                        <p
                          className="whitespace-nowrap font-semibold uppercase"
                          style={{ color: GOLD, fontSize: s(10), letterSpacing: '0.15em' }}
                        >
                          {t('certificates.template.partnership')}
                        </p>
                        <span className="shrink-0" style={{ height: '1px', width: s(20), background: GOLD }} />
                      </div>
                      <div className="flex items-center justify-center" style={{ marginTop: s(10), gap: s(8) }}>
                        {PARTNERS.map((p) => (
                          <div
                            key={p.src}
                            className="overflow-hidden"
                            style={{ background: p.badge, borderRadius: s(6), padding: `${s(8)} ${s(10)}` }}
                          >
                            <Image
                              src={p.src}
                              alt={p.alt}
                              width={150}
                              height={48}
                              className="w-auto object-contain"
                              style={{ height: s(28) }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Image
                        src="/certificates/seal-ribbon.png"
                        alt="ICESCO seal"
                        width={280}
                        height={235}
                        className="w-auto"
                        style={{ height: s(104), mixBlendMode: 'multiply' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t('certificates.noneYet')}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={selected?.status !== 'issued'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-icesco-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
            >
              <Download className="h-4 w-4" /> {t('certificates.downloadPdf')}
            </button>
            <button
              disabled={selected?.status !== 'issued'}
              aria-label={t('certificates.shareCertificate')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
