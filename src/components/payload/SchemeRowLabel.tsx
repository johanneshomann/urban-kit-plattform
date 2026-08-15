// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useRowLabel } from '@payloadcms/ui'

/** Array row label for the color-scheme global: scheme name + live swatches. */
export function SchemeRowLabel() {
  const { data } = useRowLabel<{ name?: string; light?: string; general?: string; dark?: string; accent?: string }>()
  const swatches = [data?.light, data?.general, data?.dark, data?.accent].filter(Boolean) as string[]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ display: 'inline-flex', gap: '3px' }}>
        {swatches.map((color, i) => (
          <span
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: color,
              border: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
          />
        ))}
      </span>
      {data?.name ?? '…'}
    </span>
  )
}
