'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LanguageSwitcher, ThemeToggle } from '@/components/shell/top-bar'

export function AuthTopBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center gap-2">
        <LanguageSwitcher immersive />
        <ThemeToggle immersive />
      </div>
    </div>
  )
}
