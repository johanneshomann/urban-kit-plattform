/**
 * Loading skeleton for the project layout (sidebar + content area).
 * Rendered immediately on navigation so the slide-in animation has
 * meaningful content — the sidebar is visible from frame 1, then the
 * real server-rendered layout replaces it once data loads. Pulse blocks are
 * tinted in --project-general (sand fallback before the chameleon vars load),
 * continuing the project-colored cover panel the exit transition slides in.
 */
export default function ProjectLoading() {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar skeleton — matches ProjectSidebar structure */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col sticky top-0 h-svh border-r" style={{ borderColor: 'color-mix(in srgb, var(--project-general, #e4c9a0) 20%, transparent)' }}>
        {/* Cover image placeholder */}
        <div className="h-24 w-full bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse" />

        {/* Title bar */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--project-general, #e4c9a0) 20%, transparent)' }}>
          <div className="h-5 w-28 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-2 px-2 flex flex-col gap-1.5 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded shrink-0" />
              <div className="h-3 flex-1 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t p-2" style={{ borderColor: 'color-mix(in srgb, var(--project-general, #e4c9a0) 20%, transparent)' }}>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded-full shrink-0" />
            <div className="h-3 w-20 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
          </div>
        </div>
      </aside>

      {/* Content area skeleton */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0 p-6 md:p-10 space-y-6">
        {/* Phase chip */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded-full" />
          <div className="h-4 w-16 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
        </div>

        {/* Title */}
        <div className="h-8 w-3/5 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />

        {/* Description lines */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3" style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink, #5f554a) 12%, transparent)' }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
                <div className="h-4 w-28 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
              </div>
              <div className="h-3 w-full bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
              <div className="h-3 w-3/4 bg-[color-mix(in_srgb,var(--project-general,#e4c9a0)_30%,transparent)] animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}