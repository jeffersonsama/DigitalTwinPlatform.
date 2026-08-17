import { FileText } from 'lucide-react'

export interface LiveResourceView {
  id: string
  title: string
  type: string
}

export function LiveResourcesTab({ resources }: { resources: LiveResourceView[] }) {
  if (resources.length === 0) {
    return <p className="text-white/60">No resources shared for this session yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {resources.map((r) => (
        <li key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-navy-950 p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-accent/15 text-cyan-accent">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-white/90">{r.title}</p>
            <p className="text-[11px] capitalize text-white/40">{r.type}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
