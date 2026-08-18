import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Award, MapPin, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/shell/app-shell'
import { ProfileConnectAction } from '@/components/profile/profile-connect-action'
import { BackButton } from '@/components/profile/back-button'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getConnectionState } from '@/lib/networking'
import { resolveAvatar } from '@/lib/avatar'
import { getTranslations } from '@/lib/i18n-server'

const badgeIcons: Record<string, string> = {
  zap: '⚡',
  users: '🤝',
  book: '📖',
  heart: '❤️',
  globe: '🌍',
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const [target, { t }] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), getTranslations()])
  return { title: target ? `${target.name} | ICESCO Crisis Forum 2026` : `${t('profile.pageTitle')} | ICESCO Crisis Forum 2026` }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ src?: string }>
}) {
  const { userId } = await params
  const { src } = await searchParams

  const [target, viewer, { t }] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getCurrentUser(),
    getTranslations(),
  ])
  if (!target) notFound()
  const isSelf = viewer?.id === target.id

  const [country, badges, certificates, connectionState] = await Promise.all([
    prisma.country.findUnique({ where: { name: target.country } }),
    prisma.badge.findMany({ where: { userId: target.id } }),
    prisma.certificate.findMany({ where: { userId: target.id, status: 'issued' }, orderBy: { issuedAt: 'desc' } }),
    viewer && !isSelf ? getConnectionState(viewer.id, target.id) : Promise.resolve('none' as const),
  ])

  return (
    <AppShell title={t('profile.pageTitle')}>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-10">
        <BackButton />

        <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveAvatar(target)} alt="" className="h-full w-full" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{target.name}</h1>
            <p className="text-sm text-muted-foreground">{target.role}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {country ? `${country.flag} ` : ''}
              {target.country}
            </p>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-accent/60 px-3 py-1.5 text-sm font-semibold text-icesco-blue">
            <Sparkles className="h-4 w-4" /> {t('passport.levelLabel', { level: target.level, title: target.levelTitle })}
          </span>

          {isSelf ? (
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full bg-accent/60 px-3 py-1.5 text-xs font-semibold text-icesco-blue">
                {t('profile.howOthersSeeYou')}
              </span>
              <Link href="/passport" className="text-sm font-medium text-icesco-blue hover:underline">
                {t('profile.backToPassport')}
              </Link>
            </div>
          ) : viewer ? (
            <ProfileConnectAction
              targetId={target.id}
              targetName={target.name}
              initialState={connectionState}
              autoConnect={src === 'qr'}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-icesco-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco"
            >
              {t('profile.loginToConnect', { name: target.name.split(' ')[0] })}
            </Link>
          )}
        </section>

        {badges.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t('passport.badgesHeading')}</h2>
            <div className="grid grid-cols-5 gap-2 text-center">
              {badges.map((b) => (
                <div key={b.id} className="flex flex-col items-center gap-1.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-icesco-blue to-cyan-accent text-lg text-white">
                    {badgeIcons[b.icon] ?? '🏅'}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">{t('certificates')}</h2>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('certificates.noneYet')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {certificates.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-icesco-blue">
                    <Award className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.type} · {c.issuedAt?.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  )
}
