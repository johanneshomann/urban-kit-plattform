'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Accessibility, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useAccessibility } from './AccessibilityProvider'

export function AccessibilityButton() {
  const t = useTranslations('accessibility')
  const {
    settings,
    increaseFontScale,
    decreaseFontScale,
    toggleReduceMotion,
    toggleHighContrast,
    toggleUnderlineLinks,
    reset,
    canIncrease,
    canDecrease,
  } = useAccessibility()

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Close on Escape (returning focus to the trigger) and on outside click.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  return (
    <div ref={containerRef} className="fixed bottom-6 left-6 z-40">
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={t('title')}
          tabIndex={-1}
          className="dropdown-enter absolute bottom-full left-0 mb-3 w-72 rounded-xl border p-4 outline-none"
          style={{
            background: 'var(--plattform-white)',
            borderColor: 'var(--plattform-light)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
            color: 'var(--plattform-ink)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-text font-bold" style={{ color: 'var(--plattform-ink-accent)' }}>
              {t('title')}
            </h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                buttonRef.current?.focus()
              }}
              aria-label={t('close')}
              className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Font size */}
          <div className="mb-4">
            <span className="text-small font-medium">{t('fontSize')}</span>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseFontScale}
                disabled={!canDecrease}
                aria-label={t('fontSizeDecrease')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: 'var(--plattform-light)' }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-small min-w-[3.5rem] text-center tabular-nums" aria-live="polite">
                {Math.round(settings.fontScale * 100)}%
              </span>
              <button
                type="button"
                onClick={increaseFontScale}
                disabled={!canIncrease}
                aria-label={t('fontSizeIncrease')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: 'var(--plattform-light)' }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-1">
            <Toggle label={t('reduceMotion')} checked={settings.reduceMotion} onChange={toggleReduceMotion} />
            <Toggle label={t('highContrast')} checked={settings.highContrast} onChange={toggleHighContrast} />
            <Toggle label={t('underlineLinks')} checked={settings.underlineLinks} onChange={toggleUnderlineLinks} />
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-small mt-4 inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--plattform-accent)' }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('reset')}
          </button>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('open')}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
      >
        <Accessibility className="h-6 w-6" />
      </button>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="text-small flex items-center justify-between gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-black/5"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--plattform)' : 'var(--plattform-light)' }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }}
        />
      </span>
    </button>
  )
}
