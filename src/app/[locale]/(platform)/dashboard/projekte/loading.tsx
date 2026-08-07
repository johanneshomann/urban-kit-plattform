import { CardSkeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="px-6 md:px-10 py-10" aria-busy="true">
      <div className="h-3.5 w-32 animate-pulse rounded bg-[color-mix(in_srgb,var(--app-ink)_12%,transparent)]" />
      <div aria-hidden className="h-px mt-2 mb-6" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
