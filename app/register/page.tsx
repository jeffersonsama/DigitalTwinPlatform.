import type { Metadata } from 'next'
import { FullLogo } from '@/components/brand/full-logo'
import { RegisterForm } from '@/components/auth/register-form'
import { AuthBackgroundVideo } from '@/components/auth/auth-background-video'

export const metadata: Metadata = {
  title: 'Register | ICESCO Crisis Forum 2026',
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackgroundVideo />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/45 p-8 text-center shadow-xl backdrop-blur-sm">
        <FullLogo height={64} className="mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Join the ICESCO Crisis Forum 2026.</p>
        <div className="mt-6 text-left">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
