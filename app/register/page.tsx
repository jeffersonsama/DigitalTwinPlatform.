import type { Metadata } from 'next'
import { FullLogo } from '@/components/brand/full-logo'
import { RegisterForm } from '@/components/auth/register-form'
import { AuthBackgroundVideo } from '@/components/auth/auth-background-video'
import { AuthTopBar } from '@/components/auth/auth-top-bar'
import { getTranslations } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return { title: `${t('auth.register.pageTitle')} | ICESCO Crisis Forum 2026` }
}

export default async function RegisterPage() {
  const { t } = await getTranslations()
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackgroundVideo />
      <AuthTopBar />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/45 p-8 text-center shadow-xl backdrop-blur-sm">
        <FullLogo height={64} className="mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-foreground">{t('auth.register.createAccount')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>
        <div className="mt-6 text-left">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
