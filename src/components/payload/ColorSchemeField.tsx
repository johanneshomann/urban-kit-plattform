'use client'

import { useEffect, useState } from 'react'
import { useField, useTranslation } from '@payloadcms/ui'
import { defaultColorSchemes, type ColorScheme } from '@/lib/defaults/colorSchemes'

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const ROLES = ['light', 'general', 'dark', 'accent', 'ink', 'white', 'black'] as const

/** Merge the admin-edited palettes (project-color-schemes global) over the defaults. */
function useEffectiveSchemes(): ColorScheme[] {
  const [schemes, setSchemes] = useState<ColorScheme[]>(defaultColorSchemes)
  useEffect(() => {
    let cancelled = false
    fetch('/api/globals/project-color-schemes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { schemes?: ({ name?: string } & Partial<Record<(typeof ROLES)[number], string>>)[] } | null) => {
        if (cancelled || !data?.schemes) return
        setSchemes(
          defaultColorSchemes.map((def) => {
            const row = data.schemes!.find((r) => r.name === def.name)
            if (!row) return def
            const merged = { ...def }
            for (const role of ROLES) {
              const v = row[role]
              if (typeof v === 'string' && HEX_RE.test(v)) merged[role] = v
            }
            return merged
          }),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return schemes
}

// Labels arrive localized ({ en, de }) — render the current language's one.
function labelOf(field: { label?: unknown }, fallback: string): string {
  const l = field?.label
  if (typeof l === 'string') return l
  if (l && typeof l === 'object' && 'de' in l) return String(l.de)
  return fallback
}

export function ColorSchemeField({ field }: { field: { label?: unknown } }) {
  const { value, setValue } = useField<string>({ path: 'colorScheme' })
  const { i18n } = useTranslation()
  const de = i18n.language?.startsWith('de')
  const label = labelOf(field, de ? 'Farbschema' : 'Color scheme')
  const schemes = useEffectiveSchemes()

  return (
    <div className="field-type">
      <label className="field-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        {schemes.map((scheme) => {
          const isSelected = value === scheme.name
          return (
            <button
              key={scheme.name}
              type="button"
              onClick={() => setValue(isSelected ? null : scheme.name)}
              title={scheme.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? scheme.dark : 'transparent'}`,
                background: isSelected ? scheme.light : '#f3f3f3',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {/* Color dots */}
              <span style={{ display: 'flex', gap: '3px' }}>
                {[scheme.light, scheme.general, scheme.dark, scheme.accent].map((color, i) => (
                  <span
                    key={i}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: color,
                      border: '1px solid rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </span>
              <span style={{ fontSize: '12px', color: scheme.black, fontWeight: isSelected ? 600 : 400 }}>
                {scheme.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
