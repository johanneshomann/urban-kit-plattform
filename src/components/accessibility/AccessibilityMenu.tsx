'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Accessibility, FileText, Minus, Plus, RotateCcw } from 'lucide-react'
import { IconTooltip } from '@/components/platform/IconTooltip'
import { useAccessibility } from './AccessibilityProvider'

/**
 * Dropdown variant of the accessibility settings for the dashboard top bar —
 * inside the platform area it replaces the floating FAB (which stays on the
 * public portal). Same controls and `accessibility` message namespace as
 * {@link AccessibilityButton}, styled with the neutral --app-* tokens.
 */
export function AccessibilityMenu({ triggerClassName }: { triggerClassName?: string }) {
  const t = useTranslations('accessibility')
  const locale = useLocale()
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
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

  const stepButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--app-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'

  return (
    <div ref={containerRef} className="relative self-stretch flex items-center">
      <IconTooltip label={t('title')}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t('open')}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className={triggerClassName}
        >
          <Accessibility aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('open')}</span>
        </button>
      </IconTooltip>

      {open && (
        /* overflow-hidden wrapper at the bar's bottom edge clips the slide-down,
           so the panel emerges from UNDER the header (public-nav pattern)
           instead of animating over it. */
        <div className="absolute right-0 top-full overflow-hidden rounded-b-xl z-50">
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={t('title')}
          tabIndex={-1}
          data-a11y-panel
          className="nav-panel-enter w-72 rounded-b-xl p-4 outline-none shadow-md"
          style={{
            background: 'var(--app-white)',
            color: 'var(--app-ink)',
          }}
        >
          <h2 className="text-text font-bold mb-3" style={{ color: 'var(--app-ink-accent)' }}>
            {t('title')}
          </h2>

          {/* Font size */}
          <div className="mb-4">
            <span className="text-small font-medium">{t('fontSize')}</span>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={decreaseFontScale} disabled={!canDecrease} aria-label={t('fontSizeDecrease')} className={stepButton}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-small min-w-[3.5rem] text-center tabular-nums" aria-live="polite">
                {Math.round(settings.fontScale * 100)}%
              </span>
              <button type="button" onClick={increaseFontScale} disabled={!canIncrease} aria-label={t('fontSizeIncrease')} className={stepButton}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-1">
            <MenuToggle label={t('reduceMotion')} checked={settings.reduceMotion} onChange={toggleReduceMotion} />
            <MenuToggle label={t('highContrast')} checked={settings.highContrast} onChange={toggleHighContrast} />
            <MenuToggle label={t('underlineLinks')} checked={settings.underlineLinks} onChange={toggleUnderlineLinks} />
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-small mt-4 inline-flex items-center gap-1.5 transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: 'var(--app-accent)' }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('reset')}
          </button>

          <div aria-hidden className="h-px my-3" style={{ background: 'var(--app-light)' }} />
          <Link
            href={`/${locale}/barrierefreiheit`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-small inline-flex items-center gap-1.5 underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--app-accent)' }}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {t('statement')}
          </Link>
        </div>
        </div>
      )}
    </div>
  )
}

function MenuToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="text-small flex items-center justify-between gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] cursor-pointer"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        data-a11y-switch-track
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--app-accent)' : 'var(--app-light)' }}
      >
        <span
          data-a11y-switch-knob
          className="inline-block h-4 w-4 rounded-full bg-[var(--app-white)] transition-transform"
          style={{ transform: checked ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }}
        />
      </span>
    </button>
  )
}
