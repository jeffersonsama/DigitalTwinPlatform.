import Link from 'next/link'
import Image from 'next/image'
import { Play, ArrowRight } from 'lucide-react'
import { AiAssistantCard } from './ai-assistant-card'

export function Hero() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-icesco">
        <Image
          src="/images/icesco-front.png"
          alt="ICESCO forum venue, front view"
          fill
          priority
          className="hero-photo-fade object-cover"
          sizes="(max-width: 1024px) 100vw, 800px"
        />
        <Image
          src="/images/icesco-angle.png"
          alt="ICESCO forum venue, angled view"
          fill
          className="hero-photo-fade hero-photo-fade-2 object-cover"
          sizes="(max-width: 1024px) 100vw, 800px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-icesco/90 via-icesco/70 to-icesco/20" />
        <div className="relative flex h-full flex-col justify-center gap-5 p-8 md:p-10">
          <div>
            <p className="text-sm font-medium text-cyan-accent">Welcome to</p>
            <h1 className="mt-1 max-w-md text-balance font-display text-3xl font-bold leading-tight text-white md:text-4xl">
              ICESCO Crisis Management Knowledge Forum 2026
            </h1>
            <p className="mt-3 max-w-md text-pretty text-sm text-white/80">
              Connecting minds. Building resilience. Shaping a safer tomorrow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-accent px-5 py-2.5 text-sm font-semibold text-icesco transition-colors hover:bg-cyan-accent/90"
            >
              <Play className="h-4 w-4 fill-current" />
              Join Live Now
            </Link>
            <Link
              href="/program"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore Program
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <AiAssistantCard />
    </section>
  )
}
