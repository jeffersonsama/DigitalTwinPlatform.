import { Globe, Cpu, Boxes, Network, ShieldCheck } from 'lucide-react'
import { IcescoLogo } from '@/components/brand/icesco-logo'
import { getTranslations } from '@/lib/i18n-server'
import type { TranslationKey } from '@/lib/i18n'

const features: Array<{ icon: typeof Globe; titleKey: TranslationKey; subKey: TranslationKey }> = [
  { icon: Globe, titleKey: 'onlineExperience.features.multilingual.title', subKey: 'footer.features.multilingual.sub' },
  { icon: Cpu, titleKey: 'onlineExperience.features.aiPowered.title', subKey: 'footer.features.aiPowered.sub' },
  { icon: Boxes, titleKey: 'onlineExperience.features.digitalTwin.title', subKey: 'footer.features.digitalTwin.sub' },
  { icon: Network, titleKey: 'onlineExperience.features.globalCollab.title', subKey: 'footer.features.globalCollab.sub' },
  { icon: ShieldCheck, titleKey: 'onlineExperience.features.secure.title', subKey: 'footer.features.secure.sub' },
]

export async function SiteFooter() {
  const { t } = await getTranslations()
  return (
    <footer className="bg-icesco text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.titleKey} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25">
                <f.icon className="h-5 w-5 text-cyan-accent" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{t(f.titleKey)}</p>
                <p className="text-xs text-white/60">{t(f.subKey)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <IcescoLogo variant="light" />
          <p className="text-xs text-white/60">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  )
}
