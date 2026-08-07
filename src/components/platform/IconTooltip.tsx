'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Custom tooltip for icon controls: appears below the trigger after a short
 * delay, on hover and on keyboard focus. Portalled to <body> so it escapes
 * sticky/overflow containers. Colors read `--tooltip-bg` / `--tooltip-ink`
 * with app-token fallbacks — a project scope (sidebar, tab bar) can re-tint
 * tooltips later by setting those two vars, without touching this component.
 */
export function IconTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const show = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPos({ x: rect.left + rect.width / 2, y: rect.bottom }), 400)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setPos(null)
  }

  return (
    <span
      ref={ref}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={hide}
    >
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            className="tooltip-in-down pointer-events-none fixed text-small whitespace-nowrap px-2.5 py-1 rounded-lg shadow-md"
            style={{
              left: pos.x,
              top: pos.y + 8,
              zIndex: 9999,
              background: 'var(--tooltip-bg, var(--app-ink-accent))',
              color: 'var(--tooltip-ink, var(--app-white))',
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
