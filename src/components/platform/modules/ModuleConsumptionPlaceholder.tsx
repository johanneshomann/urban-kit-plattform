import { Hammer } from 'lucide-react'

/** Temporary stand-in for module consumption UIs not yet built (filled in per module in Phase B). */
export function ModuleConsumptionPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-title font-bold leading-tight mb-6" style={{ color: 'var(--project-dark)' }}>{title}</h1>
      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)', color: 'var(--project-dark)' }}>
        <Hammer className="w-5 h-5 shrink-0" style={{ opacity: 0.6 }} />
        <p className="text-text" style={{ opacity: 0.7 }}>Dieser Bereich wird gerade gebaut.</p>
      </div>
    </div>
  )
}
