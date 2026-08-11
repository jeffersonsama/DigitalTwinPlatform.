import { Sparkles, CircleDot, Lightbulb } from 'lucide-react'
import { aiKeyPoints, aiDecisions } from '@/lib/data'

export function AiSummaryPanel() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-navy-900 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-accent/15">
          <Sparkles className="h-4 w-4 text-cyan-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Summary</p>
          <p className="text-[11px] text-white/50">Updated live</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          Key Points
        </p>
        <ul className="flex flex-col gap-2">
          {aiKeyPoints.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-white/80">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-accent" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          Decisions &amp; Recommendations
        </p>
        <ul className="flex flex-col gap-2">
          {aiDecisions.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-white/80">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forum-orange" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
