'use client'

import { useField, useTranslation } from '@payloadcms/ui'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'

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

  return (
    <div className="field-type">
      <label className="field-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        {defaultColorSchemes.map((scheme) => {
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
