'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Zap,
  Users,
  BookOpen,
  Heart,
  Globe,
  Award,
  Trophy,
  Handshake,
  Sparkles,
  Share2,
  ScanLine,
  Pencil,
  Copy,
  Check,
  X,
  MapPin,
  CheckCircle2,
  Lock,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import { useLocale, type TranslationKey } from '@/lib/i18n'
import { EditProfileModal } from '@/components/passport/edit-profile-modal'
import { recordShareIntent } from '@/lib/actions/gamification'

const badgeIcons: Record<string, typeof Zap> = { zap: Zap, users: Users, book: BookOpen, heart: Heart, globe: Globe }

const tabs = ['Activity', 'Certificates', 'Skills', 'Progress'] as const
type Tab = (typeof tabs)[number]
const tabLabelKeys: Record<Tab, TranslationKey> = {
  Activity: 'passport.tabs.activity',
  Certificates: 'certificates',
  Skills: 'passport.tabs.skills',
  Progress: 'passport.tabs.progress',
}

export interface PassportView {
  id: string
  name: string
  avatar: string
  role: string
  country: string
  level: number
  levelTitle: string
  xp: number
  xpMax: number
  stats: { missions: number; connections: number; certificates: number }
}

export interface ActivityView {
  id: string
  title: string
  meta: string
  xp: number
}

export interface BadgeView {
  id: string
  label: string
  icon: string
}

export interface SkillView {
  id: string
  label: string
  value: number
}

export interface ProgressView {
  id: string
  label: string
  value: number
  max: number
}

export interface PassportCertView {
  id: string
  title: string
  type: string
  issuedLabel: string
}

export function DigitalPassport({
  passport,
  countries,
  badges,
  skills,
  progress,
  activity,
  certificates,
}: {
  passport: PassportView
  countries: { name: string; flag: string }[]
  badges: BadgeView[]
  skills: SkillView[]
  progress: ProgressView[]
  activity: ActivityView[]
  certificates: PassportCertView[]
}) {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('Activity')
  const [showShare, setShowShare] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const xpPct = Math.round((passport.xp / passport.xpMax) * 100)

  return (
    <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      {/* Profile column */}
      <div className="flex flex-col gap-5">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative h-20 rounded-t-2xl bg-gradient-to-r from-icesco via-icesco-blue to-cyan-accent">
            <button
              aria-label={t('passport.editProfile')}
              onClick={() => setShowEdit(true)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="mt-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc(passport.avatar)} alt="" className="h-full w-full" />
            </div>

            <div className="mt-3">
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">{passport.name}</h1>
              <p className="text-xs text-muted-foreground">{passport.role}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {passport.country}
                </span>
                <Link href={`/profile/${passport.id}`} target="_blank" className="font-medium text-icesco-blue hover:underline">
                  {t('passport.viewPublicProfile')}
                </Link>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowShare(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-icesco-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco"
              >
                <Share2 className="h-4 w-4" /> {t('passport.shareProfile')}
              </button>
              <Link
                href="/scan"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ScanLine className="h-4 w-4" /> {t('passport.scan')}
              </Link>
            </div>

            <div className="mt-5 rounded-xl bg-accent/60 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-icesco-blue">
                  <Sparkles className="h-4 w-4" />{' '}
                  {t('passport.levelLabel', { level: passport.level, title: passport.levelTitle })}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t('passport.xpOf', { xp: passport.xp.toLocaleString(), xpMax: passport.xpMax.toLocaleString() })}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-icesco-blue to-cyan-accent"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Trophy, value: passport.stats.missions, label: t('passport.stats.missions'), color: 'text-forum-orange' },
                { icon: Handshake, value: passport.stats.connections, label: t('passport.stats.connections'), color: 'text-icesco-teal' },
                { icon: Award, value: passport.stats.certificates, label: t('certificates'), color: 'text-icesco-blue' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-3">
                  <s.icon className={cn('mx-auto h-4 w-4', s.color)} />
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t('passport.badgesHeading')}</h2>
            <span className="text-xs text-muted-foreground">{t('passport.badgesEarned', { count: badges.length })}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {badges.map((b) => {
              const Icon = badgeIcons[b.icon] ?? Award
              return (
                <div key={b.id} className="flex flex-col items-center gap-1.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-icesco-blue to-cyan-accent text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{b.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Tabbed content */}
      <section className="flex flex-col rounded-2xl border border-border bg-card p-5">
        <div className="scrollbar-thin flex gap-1 overflow-x-auto rounded-xl bg-accent/60 p-1">
          {tabs.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === tabKey ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tabLabelKeys[tabKey])}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1">
          {tab === 'Activity' && (
            <ul className="flex flex-col gap-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-icesco-blue">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.meta}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-icesco-teal/10 px-2.5 py-1 text-xs font-semibold text-icesco-teal">
                    +{a.xp} XP
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === 'Certificates' && (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {certificates.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-icesco-blue">
                    <Award className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.type} · {c.issuedLabel}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === 'Skills' && (
            <div className="flex flex-col gap-4">
              {skills.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{s.label}</span>
                    <span className="font-semibold text-icesco-blue">{s.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-icesco-blue to-cyan-accent"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Progress' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {progress.map((p) => {
                const pct = Math.round((p.value / p.max) * 100)
                const complete = p.value >= p.max
                return (
                  <div key={p.id} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-icesco-teal" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {p.value}
                      <span className="text-sm font-medium text-muted-foreground"> / {p.max}</span>
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-icesco-teal" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {showShare && <SharePassportModal userId={passport.id} name={passport.name} onClose={() => setShowShare(false)} />}
      {showEdit && (
        <EditProfileModal
          name={passport.name}
          role={passport.role}
          country={passport.country}
          avatar={passport.avatar}
          countries={countries}
          onClose={() => setShowEdit(false)}
        />
      )}
    </main>
  )
}

function SharePassportModal({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const { t } = useLocale()
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/profile/${userId}`
  const qrUrl = `${shareUrl}?src=qr`

  useEffect(() => {
    QRCode.toDataURL(qrUrl, { width: 220, margin: 1, color: { dark: '#0b2a4a', light: '#ffffff' } }).then(setDataUrl)
  }, [qrUrl])

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    recordShareIntent('link').catch(() => {})
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: t('passport.share.nativeTitle'), text: t('passport.share.nativeText', { name }), url: shareUrl })
      recordShareIntent('native').catch(() => {})
    } catch {
      // user cancelled the native share sheet — nothing to do
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center shadow-2xl"
      >
        <div className="flex w-full items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{t('passport.share.title')}</p>
          <button aria-label={t('common.close')} onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-border bg-white p-3">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={t('passport.share.qrAlt', { name })} className="h-full w-full" />
          ) : (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-icesco-blue border-t-transparent" />
          )}
        </div>

        <p className="text-xs text-muted-foreground">{t('passport.share.instructions', { name })}</p>

        <div className="flex w-full gap-2">
          <button
            onClick={copyLink}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-icesco-teal" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('common.linkCopied') : t('common.copyLink')}
          </button>
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <button
              onClick={nativeShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-icesco-blue px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-icesco"
            >
              <Share2 className="h-3.5 w-3.5" /> {t('common.share')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
