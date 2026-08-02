'use client'

import { useField, FieldLabel } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

/**
 * Color field for Platform Settings. Renders a native color swatch next to a
 * text input, kept in sync. Hex-only by design for the swatch; non-hex values
 * (e.g. rgba() for the translucent white) fall back to a neutral swatch while
 * the text input stays editable. Empty value falls back to the per-field
 * default defined in src/lib/theme.ts when injected into the public site.
 */
const DESCRIPTION_SUFFIX = ' Hex oder CSS-Farbwert – leer = Standardwert.'

function labelOf(field: TextFieldClientProps['field']): string | undefined {
  const l = field?.label
  if (typeof l === 'string') return l
  if (l && typeof l === 'object' && 'de' in l) return String(l.de)
  return undefined
}

function descriptionOf(field: TextFieldClientProps['field']): string | undefined {
  const d = field?.admin?.description
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && 'de' in d) return String(d.de)
  return undefined
}

export function ColorPicker(props: TextFieldClientProps) {
  const { path, field } = props
  const { value, setValue } = useField<string>({ path })

  const label = labelOf(field)
  const description = descriptionOf(field)

  // Native <input type=color> requires a valid #rrggbb; fall back to a neutral
  // swatch when the field is empty or holds a non-hex value (rgba…, named colors).
  const isHex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
  const swatch = isHex ? value : '#ffffff'

  return (
    <div className="field-type text" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={label} path={path} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="color"
          value={swatch}
          onChange={(e) => setValue(e.target.value)}
          aria-label={label ? `${label} Farbwähler` : 'Farbwähler'}
          className="uk-color-swatch"
          style={{
            width: 40,
            height: 40,
            padding: 0,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            background: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value ?? ''}
          placeholder="#000000"
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="uk-color-hex"
          style={{
            flex: 1,
            height: 40,
            padding: '0 12px',
            fontFamily: 'monospace',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
          }}
        />
      </div>
      {description && (
        <div
          className="field-description"
          style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4, color: 'var(--theme-elevation-450)' }}
        >
          {description}
          {!description.includes('Hex') && DESCRIPTION_SUFFIX}
        </div>
      )}
    </div>
  )
}