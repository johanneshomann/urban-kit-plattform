'use client'

import { useEffect } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import { statusFromProjektphase, type ProjektStatus } from '@/lib/options/projektphasen'

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

export function StatusField({ field }: { field: { label?: string } }) {
  const { value, setValue } = useField<string>({ path: 'status' })
  const phase = useFormFields(([fields]) => fields?.projektphase?.value as string | undefined)
  const derived = statusFromProjektphase(phase)

  // Keep the form value in sync live, before saving. The server-side
  // beforeChange hook re-derives the same value as the authoritative backstop.
  useEffect(() => {
    if (value !== derived) setValue(derived)
  }, [derived, value, setValue])

  const color = STATUS_COLORS[derived]

  return (
    <div className="field-type">
      <label className="field-label">{field.label ?? 'Status'}</label>
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
        Wird automatisch aus der Projektphase abgeleitet.
      </p>
    </div>
  )
}
