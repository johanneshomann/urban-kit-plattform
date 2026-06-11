'use client'

import { useField } from '@payloadcms/ui'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'

export function ColorSchemeField({ field }: { field: { label?: string } }) {
  const { value, setValue } = useField<string>({ path: 'colorScheme' })

  return (
    <div className="field-type">
      <label className="field-label">{field.label ?? 'Farbschema'}</label>
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
                {[scheme.light, scheme.mid, scheme.dark, scheme.accent].map((color, i) => (
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
