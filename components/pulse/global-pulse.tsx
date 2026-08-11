import Image from "next/image"
import { globalStats } from "@/lib/data"
import { IcescoLogo } from "@/components/brand/icesco-logo"

const bigStats = [
  { label: "Countries Online", value: globalStats.countriesConnected.toString() },
  { label: "Participants", value: globalStats.participantsOnline.toLocaleString() },
  { label: "Ideas Shared", value: globalStats.ideasShared.toLocaleString() },
  { label: "Projects Initiated", value: globalStats.projectsInitiated.toString() },
  { label: "Challenges Completed", value: globalStats.challengesCompleted.toString() },
]

const highlights = [
  { label: "Most Active Country", value: "Türkiye" },
  { label: "Most Discussed Crisis", value: "Floods" },
  { label: "Top AI Insight", value: "Invest in early warning and community education" },
]

export function GlobalPulse() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient stage backdrop */}
      <Image
        src="/images/pulse-stage.png"
        alt=""
        fill
        aria-hidden
        className="object-cover opacity-20"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 py-14 text-center">
        <div className="flex items-center gap-3 text-primary-foreground/80">
          <IcescoLogo className="h-8 w-8" variant="mark" />
          <span className="font-mono text-xs uppercase tracking-[0.4em] text-accent">Live Global Pulse</span>
        </div>

        <h1 className="mt-6 font-sans text-4xl font-bold tracking-tight text-primary-foreground text-balance sm:text-6xl">
          ICESCO GLOBAL PULSE
        </h1>
        <p className="mt-3 text-sm text-primary-foreground/60 sm:text-base text-pretty">
          Uniting the Islamic World for a Resilient Future
        </p>

        {/* Big stat row */}
        <div className="mt-14 grid w-full grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {bigStats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="font-mono text-3xl font-bold text-accent tabular-nums sm:text-5xl">
                {s.value}
              </span>
              <span className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground/55 sm:text-xs">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm"
            >
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground/50">
                {h.label}
              </div>
              <div className="mt-3 text-lg font-semibold text-primary-foreground text-balance">
                {h.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-14 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-primary-foreground/40">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Broadcasting live from the main stage
        </div>
      </div>
    </div>
  )
}
