import { AppShell } from '@/components/shell/app-shell'
import { CommandCenter } from '@/components/command/command-center'
import { requireAdmin } from '@/lib/auth'
import { getDisabledKeys, TOGGLEABLE_KEYS } from '@/lib/page-flags'
import { allRoutes } from '@/lib/nav'
import { getTranslations } from '@/lib/i18n-server'
import type { TranslationKey } from '@/lib/i18n'

export default async function CommandCenterPage() {
  await requireAdmin()
  const [disabledKeys, { t }] = await Promise.all([getDisabledKeys(), getTranslations()])

  const navByKey = new Map(allRoutes.map((r) => [r.key, r]))
  const pages = TOGGLEABLE_KEYS.map((key) => {
    const item = navByKey.get(key)!
    return { key, label: t(item.key as TranslationKey), href: item.href, enabled: !disabledKeys.has(key) }
  })

  return (
    <AppShell
      title={t('commandCenter')}
      right={
        <span className="mr-1 hidden items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t('command.liveEventOperations')}
        </span>
      }
    >
      <CommandCenter pages={pages} />
    </AppShell>
  )
}
