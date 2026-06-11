'use client'

import { useState, useMemo, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { Search, X, FolderOpen } from 'lucide-react'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import type { Project } from './ProjectLibrary'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Laufend' },
  { value: 'planning', label: 'In Planung' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
]

const THEMA_OPTIONS = [
  { value: 'mobilitaet', label: 'Mobilität' },
  { value: 'wohnraum', label: 'Wohnraum' },
  { value: 'gruenflaechen', label: 'Grünflächen' },
  { value: 'infrastruktur', label: 'Infrastruktur' },
  { value: 'stadtentwicklung', label: 'Stadtentwicklung' },
  { value: 'kultur', label: 'Kultur' },
  { value: 'bildung', label: 'Bildung' },
  { value: 'umwelt', label: 'Umwelt' },
]

const STADTBEREICH_OPTIONS = [
  { value: 'innenstadt', label: 'Innenstadt' },
  { value: 'norden', label: 'Norden' },
  { value: 'sueden', label: 'Süden' },
  { value: 'osten', label: 'Osten' },
  { value: 'westen', label: 'Westen' },
  { value: 'gesamtstadt', label: 'Gesamtstadt' },
]

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))
const THEMA_LABELS = Object.fromEntries(THEMA_OPTIONS.map((o) => [o.value, o.label]))
const STADTBEREICH_LABELS = Object.fromEntries(STADTBEREICH_OPTIONS.map((o) => [o.value, o.label]))

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-small font-semibold w-24 shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>{label}</span>
      {children}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-small font-semibold border transition-all"
      style={{
        background: active ? 'var(--projekte-dark)' : 'transparent',
        color: 'var(--plattform-ink)',
        borderColor: 'var(--projekte-dark)',
        opacity: active ? 1 : 0.7,
      }}
    >
      {label}
    </button>
  )
}

function SearchInput({ value, onChange, onFocus }: { value: string; onChange: (v: string) => void; onFocus?: () => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }} />
      <input
        type="text"
        placeholder="Projekt suchen …"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full pl-11 pr-10 py-3 rounded-xl border text-text outline-none transition-colors"
        style={{ background: 'white', borderColor: 'var(--projekte-dark)', color: 'var(--plattform-ink)' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-4 top-1/2 -translate-y-1/2">
          <X className="w-4 h-4" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }} />
        </button>
      )}
    </div>
  )
}

export function AlleProjekteClient({ projects, locale, cityName }: { projects: Project[]; locale: string; cityName: string }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [thema, setThema] = useState<string | null>(null)
  const [stadtbereich, setStadtbereich] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const libraryRef = useRef<HTMLDivElement>(null)

  const scrollToLibrary = () => {
    if (!libraryRef.current) return
    const top = libraryRef.current.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const availableYears = useMemo(() => {
    const fromProjects = projects.map((p) => p.startYear ?? new Date(p.createdAt).getFullYear())
    const currentYear = new Date().getFullYear()
    const defaults = [currentYear, currentYear - 1, currentYear - 2]
    return [...new Set([...fromProjects, ...defaults])].sort((a, b) => b - a)
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.title.toLowerCase().includes(q) && !(p.shortDescription ?? '').toLowerCase().includes(q)) return false
      }
      if (status && p.status !== status) return false
      if (thema && !(p.thema ?? []).includes(thema)) return false
      if (stadtbereich && !(p.stadtbereich ?? []).includes(stadtbereich)) return false
      if (year) {
        const py = p.startYear ?? new Date(p.createdAt).getFullYear()
        if (py !== year) return false
      }
      return true
    })
  }, [projects, search, status, thema, stadtbereich, year])

  const hasFilters = search || status || thema || stadtbereich || year

  return (
    <>
      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden" style={{ background: 'var(--projekte-light)' }}>
        <ScrollHint color="var(--projekte-dark)" />
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Auf einen Blick" bg="var(--projekte)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Alle Projekte<span style={{ color: 'var(--projekte-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl mb-4" style={{ color: 'var(--plattform-ink)' }}>
            Hier kannst du nicht nur Projekte verfolgen, sondern aus ihnen lernen. Alle Projekte bleiben dokumentiert, mit Entscheidungen, Methoden und Ergebnissen.
          </p>
          <p className="text-text leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--plattform-ink)' }}>
            So entsteht mit der Zeit eine Wissensbasis. Das Archiv macht sichtbar, wie Stadtentwicklung tatsächlich abläuft und bündelt Erfahrungen, die für zukünftige Projekte genutzt werden können.
          </p>
          <div className="max-w-xl">
            <SearchInput value={search} onChange={setSearch} onFocus={scrollToLibrary} />
          </div>
        </div>
      </section>

      {/* Library */}
      <div ref={libraryRef} style={{ background: 'var(--projekte-light)' }}>
        {/* Sticky filter chips */}
        <div className="sticky top-14 z-20" style={{ background: 'var(--projekte-light)' }}>
          <div className="px-6 md:px-16 lg:px-24 py-4 flex flex-col gap-3">
            <FilterRow label="Status">
              <FilterChip label="Alle" active={!status} onClick={() => setStatus(null)} />
              {STATUS_OPTIONS.map(({ value, label }) => (
                <FilterChip key={value} label={label} active={status === value} onClick={() => setStatus(status === value ? null : value)} />
              ))}
            </FilterRow>
            <FilterRow label="Thema">
              <FilterChip label="Alle" active={!thema} onClick={() => setThema(null)} />
              {THEMA_OPTIONS.map(({ value, label }) => (
                <FilterChip key={value} label={label} active={thema === value} onClick={() => setThema(thema === value ? null : value)} />
              ))}
            </FilterRow>
            <FilterRow label="Stadtbereich">
              <FilterChip label="Alle" active={!stadtbereich} onClick={() => setStadtbereich(null)} />
              {STADTBEREICH_OPTIONS.map(({ value, label }) => (
                <FilterChip key={value} label={label} active={stadtbereich === value} onClick={() => setStadtbereich(stadtbereich === value ? null : value)} />
              ))}
            </FilterRow>
            <FilterRow label="Jahr">
              <FilterChip label="Alle" active={!year} onClick={() => setYear(null)} />
              {availableYears.map((y) => (
                <FilterChip key={y} label={String(y)} active={year === y} onClick={() => setYear(year === y ? null : y)} />
              ))}
            </FilterRow>
          </div>
        </div>

        {/* Results */}
        <div className="px-6 md:px-16 lg:px-24 py-12">
          <p className="text-small mb-8" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
            {filtered.length} {filtered.length === 1 ? 'Projekt' : 'Projekte'}{hasFilters ? ' gefunden' : ''}
          </p>

          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>Keine Projekte gefunden.</p>
              <button
                onClick={() => { setSearch(''); setStatus(null); setThema(null); setStadtbereich(null); setYear(null) }}
                className="mt-4 text-small underline"
                style={{ color: 'var(--projekte-dark)' }}
              >
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
                    <div className="h-1.5 w-full" style={{ background: 'var(--projekte-dark)' }} />
                    <div className="flex flex-col flex-1 p-7">
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
                      <h3 className="text-display font-black tracking-tight mb-3 group-hover:text-[var(--projekte-dark)] transition-colors" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {p.title}
                      </h3>
                      {p.shortDescription && (
                        <p className="text-text line-clamp-3 flex-1" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>{p.shortDescription}</p>
                      )}
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
    </>
  )
}
