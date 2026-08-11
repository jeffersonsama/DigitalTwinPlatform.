import { DarkTopbar } from '@/components/nav/dark-topbar'
import { CommandCenter } from '@/components/command/command-center'

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <DarkTopbar
        title="Command Center"
        right={
          <span className="mr-1 hidden items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live Event Operations
          </span>
        }
      />
      <CommandCenter />
    </div>
  )
}
