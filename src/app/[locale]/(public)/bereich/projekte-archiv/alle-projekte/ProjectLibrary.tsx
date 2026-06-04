'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

export interface Project {
  id: string
  title: string
  slug: string
  description?: string
  status?: string
  thema?: string[]
  stadtbereich?: string[]
  startYear?: number
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Laufend',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
}

const THEMA_LABELS: Record<string, string> = {
  mobilitaet: 'Mobilität',
  wohnraum: 'Wohnraum',
  gruenflaechen: 'Grünflächen',
  infrastruktur: 'Infrastruktur',
  stadtentwicklung: 'Stadtentwicklung',
  kultur: 'Kultur',
  bildung: 'Bildung',
  umwelt: 'Umwelt',
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-small font-semibold border transition-all"
      style={{
        background: active ? 'var(--projekte-dark)' : 'transparent',
        color: active ? 'white' : 'var(--plattform-ink)',
        borderColor: active ? 'var(--projekte-dark)' : 'var(--plattform-ink-accent)',
        opacity: active ? 1 : 0.6,
      }}
    >
      {label}
    </button>
  )
}

export function ProjectLibrary({ projects, locale }: { projects: Project[]; locale: string }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [thema, setThema] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)

  const availableYears = useMemo(() => {
    const years = projects.map((p) => p.startYear ?? new Date(p.createdAt).getFullYear())
    return [...new Set(years)].sort((a, b) => b - a)
  }, [projects])

  const availableThemen = useMemo(() => {
    const all = projects.flatMap((p) => p.thema ?? [])
    return [...new Set(all)]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.title.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false
      }
      if (status && p.status !== status) return false
      if (thema && !(p.thema ?? []).includes(thema)) return false
      if (year) {
        const py = p.startYear ?? new Date(p.createdAt).getFullYear()
        if (py !== year) return false
      }
      return true
    })
  }, [projects, search, status, thema, year])

  const hasFilters = search || status || thema || year

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-20 border-b" style={{ background: 'white' }}>
        <div className="px-6 md:px-16 lg:px-24 py-4 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }} />
            <input
              type="text"
              placeholder="Projekt suchen …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border text-text outline-none focus:border-[var(--projekte-dark)] transition-colors"
              style={{ background: 'var(--projekte-light)', borderColor: 'transparent', color: 'var(--plattform-ink)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-small font-semibold self-center mr-1" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>Status</span>
            <FilterChip label="Alle" active={!status} onClick={() => setStatus(null)} />
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <FilterChip key={val} label={label} active={status === val} onClick={() => setStatus(status === val ? null : val)} />
            ))}

            {availableYears.length > 0 && (
              <>
                <span className="text-small font-semibold self-center ml-3 mr-1" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>Jahr</span>
                {availableYears.map((y) => (
                  <FilterChip key={y} label={String(y)} active={year === y} onClick={() => setYear(year === y ? null : y)} />
                ))}
              </>
            )}

            {availableThemen.length > 0 && (
              <>
                <span className="text-small font-semibold self-center ml-3 mr-1" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>Thema</span>
                {availableThemen.map((t) => (
                  <FilterChip key={t} label={THEMA_LABELS[t] ?? t} active={thema === t} onClick={() => setThema(thema === t ? null : t)} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-6 md:px-16 lg:px-24 py-12" style={{ background: 'var(--projekte-light)' }}>
        <p className="text-small mb-8" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
          {filtered.length} {filtered.length === 1 ? 'Projekt' : 'Projekte'}{hasFilters ? ' gefunden' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>Keine Projekte gefunden.</p>
            <button onClick={() => { setSearch(''); setStatus(null); setThema(null); setYear(null) }} className="mt-4 text-small underline" style={{ color: 'var(--projekte-dark)' }}>
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const projYear = p.startYear ?? new Date(p.createdAt).getFullYear()
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Color bar */}
                  <div className="h-1.5 w-full" style={{ background: 'var(--projekte-dark)' }} />

                  <div className="flex flex-col flex-1 p-7">
                    {/* Status + year */}
                    <div className="flex items-center justify-between mb-4">
                      {p.status && (
                        <span
                          className="text-small font-semibold px-3 py-1 rounded-full"
                          style={{
                            background: p.status === 'active' ? 'var(--projekte-light)' : 'var(--plattform-light)',
                            color: p.status === 'active' ? 'var(--projekte-dark)' : 'var(--plattform-ink)',
                          }}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      )}
                      <span className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>{projYear}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-display font-black tracking-tight mb-3 group-hover:text-[var(--projekte-dark)] transition-colors" style={{ color: 'var(--plattform-ink-accent)' }}>
                      {p.title}
                    </h3>

                    {/* Description */}
                    {p.description && (
                      <p className="text-text line-clamp-3 flex-1" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>{p.description}</p>
                    )}

                    {/* Thema tags */}
                    {(p.thema ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(p.thema ?? []).map((t) => (
                          <span key={t} className="text-small px-2.5 py-0.5 rounded-full border" style={{ color: 'var(--plattform-ink)', opacity: 0.5, borderColor: 'currentColor' }}>
                            {THEMA_LABELS[t] ?? t}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="mt-5 text-small font-semibold group-hover:underline" style={{ color: 'var(--projekte-dark)' }}>
                      Zum Projekt →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
