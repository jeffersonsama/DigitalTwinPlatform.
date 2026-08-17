'use client'

import { useState } from 'react'
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
  QrCode,
  Share2,
  MapPin,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const badgeIcons: Record<string, typeof Zap> = { zap: Zap, users: Users, book: BookOpen, heart: Heart, globe: Globe }

const tabs = ['Activity', 'Certificates', 'Skills', 'Progress'] as const
type Tab = (typeof tabs)[number]

export interface PassportView {
  name: string
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
  badges,
  skills,
  progress,
  activity,
  certificates,
}: {
  passport: PassportView
  badges: BadgeView[]
  skills: SkillView[]
  progress: ProgressView[]
  activity: ActivityView[]
  certificates: PassportCertView[]
}) {
  const [tab, setTab] = useState<Tab>('Activity')
  const xpPct = Math.round((passport.xp / passport.xpMax) * 100)

  return (
    <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      {/* Profile column */}
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-icesco to-cyan-accent text-lg font-bold text-white">
                {passport.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h1 className="font-display text-lg font-bold leading-tight text-foreground">{passport.name}</h1>
                <p className="text-xs text-muted-foreground">{passport.role}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {passport.country}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button aria-label="Show QR" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
                <QrCode className="h-4 w-4" />
              </button>
              <button aria-label="Share passport" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-accent/60 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-icesco-blue">
                <Sparkles className="h-4 w-4" /> Level {passport.level} · {passport.levelTitle}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {passport.xp.toLocaleString()} / {passport.xpMax.toLocaleString()} XP
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
              { icon: Trophy, value: passport.stats.missions, label: 'Missions' },
              { icon: Handshake, value: passport.stats.connections, label: 'Connections' },
              { icon: Award, value: passport.stats.certificates, label: 'Certificates' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border p-3">
                <s.icon className="mx-auto h-4 w-4 text-icesco-teal" />
                <p className="mt-1 font-display text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Badges</h2>
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
      <section className="flex flex-col rounded-2xl border border-border bg-card">
        <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border px-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-icesco-blue" />}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-5">
          {tab === 'Activity' && (
            <ul className="flex flex-col gap-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
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
    </main>
  )
}
