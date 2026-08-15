// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect } from 'react'
import { useField, useFormFields, useTranslation } from '@payloadcms/ui'
import { statusFromProjektphase, type ProjektStatus } from '@/lib/options/projektphasen'

// Labels arrive localized ({ en, de }) — render the German/current one.
function labelOf(field: { label?: unknown }): string {
  const l = field?.label
  if (typeof l === 'string') return l
  if (l && typeof l === 'object' && 'de' in l) return String(l.de)
  return 'Status'
}

const STATUS_LABELS: Record<ProjektStatus, string> = {
  active: 'Aktiv',
  planning: 'In Planung',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
}

const STATUS_COLORS: Record<ProjektStatus, { bg: string; fg: string }> = {
  active: { bg: '#dcfce7', fg: '#166534' },
  planning: { bg: '#fef9c3', fg: '#854d0e' },
  completed: { bg: '#e0e7ff', fg: '#3730a3' },
  archived: { bg: '#f3f4f6', fg: '#4b5563' },
}

export function StatusField({ field }: { field: { label?: unknown } }) {
  const { value, setValue } = useField<string>({ path: 'status' })
  const { i18n } = useTranslation()
  const phase = useFormFields(([fields]) => fields?.projektphase?.value as string | undefined)
  const derived = statusFromProjektphase(phase)
  const label = labelOf(field)
  const de = i18n.language?.startsWith('de')

  // Keep the form value in sync live, before saving. The server-side
  // beforeChange hook re-derives the same value as the authoritative backstop.
  useEffect(() => {
    if (value !== derived) setValue(derived)
  }, [derived, value, setValue])

  const color = STATUS_COLORS[derived]

  return (
    <div className="field-type">
      <label className="field-label">{label}</label>
      <div style={{ marginTop: '4px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '999px',
            background: color.bg,
            color: color.fg,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {STATUS_LABELS[derived]}
        </span>
      </div>
      <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
        {de ? 'Wird automatisch aus der Projektphase abgeleitet.' : 'Derived automatically from the project phase.'}
      </p>
    </div>
  )
}
