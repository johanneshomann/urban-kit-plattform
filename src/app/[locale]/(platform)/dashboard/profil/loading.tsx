// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Profile loading skeleton — mirrors the real page (back-arrow title row,
 * form column left, memberships/settings aside right) in app tokens, so the
 * dashboard → profile slide-in carries the page's silhouette while data loads.
 */

export default function ProfilLoading() {
  return (
    <div className="px-6 md:px-10 py-10 flex flex-col gap-8" aria-busy="true">
      {/* Section title row + hairline divider */}
      <div>
        <div className="h-3.5 w-32 animate-pulse rounded bg-[color-mix(in_srgb,var(--app-ink)_12%,transparent)]" />
        <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Form column */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]" />
            <div className="h-10 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]" />
          </div>
          <div className="h-10 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 animate-pulse rounded-full bg-[var(--app-white)]" />
            <div className="h-10 w-36 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]" />
          </div>
          <div className="h-28 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]" />
        </div>

        {/* Aside: membership/settings rows */}
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg shadow-sm bg-[var(--app-white)]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
