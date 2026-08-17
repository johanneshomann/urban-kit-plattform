// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { updateProjectAppearance } from '@/actions/manage/project'
import { defaultColorSchemes, type ColorScheme } from '@/lib/defaults/colorSchemes'

/**
 * Every token in the palette, in the order light → dark, so the swatch row
 * reads as a ramp. Same seven the project subtree exposes as `--project-*`.
 */
const PALETTE_ORDER: { key: keyof Omit<ColorScheme, 'name'>; labelKey: string }[] = [
  { key: 'white',   labelKey: 'darstellung.tokenWhite' },
  { key: 'light',   labelKey: 'darstellung.tokenLight' },
  { key: 'general', labelKey: 'darstellung.tokenGeneral' },
  { key: 'dark',    labelKey: 'darstellung.tokenDark' },
  { key: 'ink',     labelKey: 'darstellung.tokenInk' },
  { key: 'accent',  labelKey: 'darstellung.tokenAccent' },
  { key: 'black',   labelKey: 'darstellung.tokenBlack' },
]

export function DarstellungForm({
  slug,
  locale,
  initialScheme,
  schemes = defaultColorSchemes,
}: {
  slug: string
  locale: string
  initialScheme: string
  /** Effective palettes (admin-edited); defaults apply when omitted. */
  schemes?: ColorScheme[]
}) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [scheme, setScheme] = useState(initialScheme)
  const [error, setError] = useState<string | null>(null)
  const [savedScheme, setSavedScheme] = useState(initialScheme)

  const dirty = scheme !== savedScheme
  const active = schemes.find((s) => s.name === scheme)

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
      <div className="rounded-xl border p-5" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
        <h2 className="text-small font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--project-ink)' }}>{t('darstellung.sectionColorScheme')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {schemes.map((s) => {
            const selected = scheme === s.name
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setScheme(s.name)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                style={{ background: selected ? s.light : 'transparent', borderColor: selected ? s.dark : 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}
              >
                <span className="flex gap-1 shrink-0" aria-hidden="true">
                  {PALETTE_ORDER.map(({ key }) => (
                    <span key={key} className="w-2.5 h-2.5 rounded-full" style={{ background: s[key], border: '1px solid rgba(0,0,0,0.08)' }} />
                  ))}
                </span>
                <span className="text-small font-medium truncate" style={{ color: s.black }}>{s.name}</span>
                {selected && <Check className="w-4 h-4 ml-auto shrink-0" style={{ color: s.accent }} />}
              </button>
            )
          })}
        </div>

        {/* Role legend for the selected scheme — the swatch row above is
            decorative, so this is where the palette is actually explained. */}
        {active && (
          <div className="mt-5">
            <h3 className="text-small font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--project-ink)' }}>
              {t('darstellung.paletteTitle')}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {PALETTE_ORDER.map(({ key, labelKey }) => (
                <li key={key} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-md shrink-0"
                    style={{ background: active[key], border: '1px solid rgba(0,0,0,0.12)' }}
                  />
                  <span className="text-small truncate" style={{ color: 'var(--project-accent)' }}>{t(labelKey)}</span>
                  <code className="text-small ml-auto shrink-0" style={{ color: 'var(--project-ink)' }}>{active[key]}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
          >
            {!dirty && !pending ? <Check className="w-4 h-4" /> : null}
            {pending ? t('darstellung.saving') : dirty ? t('darstellung.save') : t('darstellung.saved')}
          </button>
          {error && <p className="text-small" style={{ color: 'var(--project-danger)' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
