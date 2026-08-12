import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'
import { SiteFooter } from '@/components/site-footer'
import { ProgramSchedule } from '@/components/program/program-schedule'

export const metadata: Metadata = {
  title: 'Program | ICESCO Crisis Forum 2026',
  description: 'The full three-day agenda of the ICESCO Crisis Management Knowledge Forum 2026.',
}

export default function ProgramPage() {
  return (
    <AppShell title="Program">
      <ProgramSchedule />
      <SiteFooter />
    </AppShell>
  )
}
