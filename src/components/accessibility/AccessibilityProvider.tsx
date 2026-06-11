'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  A11Y_DEFAULTS,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  applySettings,
  loadSettings,
  saveSettings,
  type AccessibilitySettings,
} from '@/lib/accessibility'

interface AccessibilityContextValue {
  settings: AccessibilitySettings
  setFontScale: (value: number) => void
  increaseFontScale: () => void
  decreaseFontScale: () => void
  toggleReduceMotion: () => void
  toggleHighContrast: () => void
  toggleUnderlineLinks: () => void
  reset: () => void
  canIncrease: boolean
  canDecrease: boolean
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(A11Y_DEFAULTS)

  // Hydrate from localStorage after mount. On first visit (no stored value),
  // seed reduceMotion from the OS-level prefers-reduced-motion setting.
  useEffect(() => {
    const stored = window.localStorage.getItem('uk-a11y')
    if (stored) {
      setSettings(loadSettings())
    } else if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSettings({ ...A11Y_DEFAULTS, reduceMotion: true })
    }
  }, [])

  // Apply + persist on every change.
  useEffect(() => {
    applySettings(settings)
    saveSettings(settings)
  }, [settings])

  const setFontScale = useCallback((value: number) => {
    setSettings((s) => ({ ...s, fontScale: round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value))) }))
  }, [])

  const increaseFontScale = useCallback(() => {
    setSettings((s) => ({ ...s, fontScale: round(Math.min(FONT_SCALE_MAX, s.fontScale + FONT_SCALE_STEP)) }))
  }, [])

  const decreaseFontScale = useCallback(() => {
    setSettings((s) => ({ ...s, fontScale: round(Math.max(FONT_SCALE_MIN, s.fontScale - FONT_SCALE_STEP)) }))
  }, [])

  const toggleReduceMotion = useCallback(() => {
    setSettings((s) => ({ ...s, reduceMotion: !s.reduceMotion }))
  }, [])

  const toggleHighContrast = useCallback(() => {
    setSettings((s) => ({ ...s, highContrast: !s.highContrast }))
  }, [])

  const toggleUnderlineLinks = useCallback(() => {
    setSettings((s) => ({ ...s, underlineLinks: !s.underlineLinks }))
  }, [])

  const reset = useCallback(() => setSettings(A11Y_DEFAULTS), [])

  const value: AccessibilityContextValue = {
    settings,
    setFontScale,
    increaseFontScale,
    decreaseFontScale,
    toggleReduceMotion,
    toggleHighContrast,
    toggleUnderlineLinks,
    reset,
    canIncrease: settings.fontScale < FONT_SCALE_MAX,
    canDecrease: settings.fontScale > FONT_SCALE_MIN,
  }

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider')
  return ctx
}
