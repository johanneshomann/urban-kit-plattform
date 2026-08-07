/**
 * Dashboard loading skeleton — mirrors the real page (Meine-Projekte bands →
 * activity feed with its control row) in app tokens, so the slide-left/right
 * page transition always carries a recognizable dashboard silhouette while
 * data loads. The slide itself comes from DashboardTransition wrapping this
 * boundary; the skeleton only has to look like the page it becomes.
 */

const divider = { background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }

function SectionTitle({ width }: { width: string }) {
  return (
    <div>
      <div className={`h-3.5 ${width} animate-pulse rounded bg-[color-mix(in_srgb,var(--app-ink)_12%,transparent)]`} />
      <div aria-hidden className="h-px mt-2" style={divider} />
    </div>
  )
}

export default function AppLoading() {
  return (
    <div className="flex flex-col" aria-busy="true">
      {/* ── Meine Projekte: full-width pill bands ── */}
      <section className="px-6 md:px-10 py-10">
        <SectionTitle width="w-36" />
        <div className="flex flex-col gap-3 mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl shadow-sm bg-[var(--app-white)]"
              style={{ height: 'max(140px, 18vh)', animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </section>

      {/* ── Neues aus den Projekten: control row + list rows ── */}
      <section className="px-6 md:px-10 py-10">
        <SectionTitle width="w-44" />
        <div className="flex flex-col md:flex-row md:items-center gap-2 mt-4 mb-6">
          <div className="md:flex-1 h-10 animate-pulse rounded-lg bg-[var(--app-white)]" />
          <div className="flex items-center gap-2">
            <div className="w-44 h-10 animate-pulse rounded-md bg-[var(--app-white)]" />
            <div className="w-44 h-10 animate-pulse rounded-md bg-[var(--app-white)]" />
            <div className="w-28 h-10 animate-pulse rounded-lg bg-[var(--app-white)]" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
