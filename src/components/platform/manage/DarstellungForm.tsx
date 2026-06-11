'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { updateProjectAppearance } from '@/actions/manage/project'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'

export function DarstellungForm({ slug, locale, initialScheme }: { slug: string; locale: string; initialScheme: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [scheme, setScheme] = useState(initialScheme)
  const [error, setError] = useState<string | null>(null)
  const [savedScheme, setSavedScheme] = useState(initialScheme)

  const dirty = scheme !== savedScheme

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProjectAppearance(slug, locale, { colorScheme: scheme })
      if (res.error) { setError(res.error); return }
      setSavedScheme(scheme)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Color scheme */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
        <h2 className="text-small font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Farbschema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {defaultColorSchemes.map((s) => {
            const selected = scheme === s.name
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setScheme(s.name)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                style={{ background: selected ? s.light : 'transparent', borderColor: selected ? s.dark : 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}
              >
                <span className="flex gap-1 shrink-0">
                  {[s.light, s.mid, s.dark, s.accent].map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                  ))}
                </span>
                <span className="text-small font-medium truncate" style={{ color: s.black }}>{s.name}</span>
                {selected && <Check className="w-4 h-4 ml-auto shrink-0" style={{ color: s.dark }} />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
          >
            {!dirty && !pending ? <Check className="w-4 h-4" /> : null}
            {pending ? 'Speichern …' : dirty ? 'Speichern' : 'Gespeichert'}
          </button>
          {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
