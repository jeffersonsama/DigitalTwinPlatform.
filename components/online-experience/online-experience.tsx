import Image from 'next/image'
import Link from 'next/link'
import {
  Globe,
  Cpu,
  Boxes,
  Network,
  ShieldCheck,
  Smartphone,
  Monitor,
  ArrowRight,
  Radio,
} from 'lucide-react'
import { getTranslations } from '@/lib/i18n-server'
import type { TranslationKey } from '@/lib/i18n'

const features: Array<{ icon: typeof Globe; titleKey: TranslationKey; subKey: TranslationKey }> = [
  { icon: Globe, titleKey: 'onlineExperience.features.multilingual.title', subKey: 'onlineExperience.features.multilingual.sub' },
  { icon: Cpu, titleKey: 'onlineExperience.features.aiPowered.title', subKey: 'onlineExperience.features.aiPowered.sub' },
  { icon: Boxes, titleKey: 'onlineExperience.features.digitalTwin.title', subKey: 'onlineExperience.features.digitalTwin.sub' },
  { icon: Network, titleKey: 'onlineExperience.features.globalCollab.title', subKey: 'onlineExperience.features.globalCollab.sub' },
  { icon: ShieldCheck, titleKey: 'onlineExperience.features.secure.title', subKey: 'onlineExperience.features.secure.sub' },
]

const platforms: Array<{ icon: typeof Monitor; labelKey: TranslationKey; subKey: TranslationKey }> = [
  { icon: Monitor, labelKey: 'onlineExperience.platforms.web.label', subKey: 'onlineExperience.platforms.web.sub' },
  { icon: Smartphone, labelKey: 'onlineExperience.platforms.mobile.label', subKey: 'onlineExperience.platforms.mobile.sub' },
]

export async function OnlineExperience() {
  const { t } = await getTranslations()
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero showcase */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="grid-glow pointer-events-none absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-icesco/40 via-navy-950/60 to-navy-950" />

        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-accent">
              {t('onlineExperience.badge')}
            </span>
            <h1 className="text-balance font-display text-3xl font-extrabold leading-tight md:text-5xl">
              {t('onlineExperience.heroTitle')}
            </h1>
            <p className="max-w-md text-pretty text-sm text-white/75 md:text-base">
              {t('onlineExperience.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/live"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-accent px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-cyan-accent/90"
              >
                <Radio className="h-4 w-4" /> {t('home.joinLiveNow')}
              </Link>
              <Link
                href="/program"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('home.exploreProgram')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Devices */}
          <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-4 sm:max-w-lg">
            {/* Laptop */}
            <div className="w-full max-w-md">
              <div className="rounded-t-xl border border-white/15 bg-navy-800 p-1.5 shadow-2xl">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  <Image
                    src="/images/hero-city.png"
                    alt={t('onlineExperience.dashboardAlt')}
                    fill
                    sizes="(max-width: 1024px) 90vw, 460px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-icesco/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[11px] font-medium text-cyan-accent">{t('home.welcomeTo')}</p>
                    <p className="text-pretty text-sm font-bold leading-tight">{t('home.heroTitle')}</p>
                  </div>
                </div>
              </div>
              <div className="h-2.5 rounded-b-xl border border-t-0 border-white/15 bg-navy-700" />
            </div>

            {/* Phone */}
            <div className="absolute -bottom-2 right-0 w-24 sm:w-28">
              <div className="overflow-hidden rounded-[1.25rem] border-2 border-white/20 bg-navy-800 p-1 shadow-2xl">
                <div className="relative aspect-[9/19] overflow-hidden rounded-[1rem]">
                  <Image
                    src="/images/live-speaker.png"
                    alt={t('onlineExperience.mobileAlt')}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold">
                    <Radio className="h-2 w-2" /> {t('home.liveBadge')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {platforms.map((p) => (
            <div key={p.labelKey} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-icesco-blue">
                <p.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-foreground">{t(p.labelKey)}</p>
                <p className="text-sm text-muted-foreground">{t(p.subKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 md:px-6">
        <h2 className="mb-6 font-display text-xl font-bold text-foreground md:text-2xl">
          {t('onlineExperience.builtForFuture')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.titleKey} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-icesco-blue to-cyan-accent text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{t(f.titleKey)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(f.subKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
