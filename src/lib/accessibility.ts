export interface AccessibilitySettings {
  fontScale: number
  reduceMotion: boolean
  highContrast: boolean
  underlineLinks: boolean
}

export const A11Y_STORAGE_KEY = 'uk-a11y'

export const FONT_SCALE_MIN = 0.9
export const FONT_SCALE_MAX = 1.5
export const FONT_SCALE_STEP = 0.1

export const A11Y_DEFAULTS: AccessibilitySettings = {
  fontScale: 1,
  reduceMotion: false,
  highContrast: false,
  underlineLinks: false,
}

function clampScale(value: number): number {
  if (Number.isNaN(value)) return A11Y_DEFAULTS.fontScale
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value))
}

/** Merge unknown stored data onto the defaults, ignoring malformed values. */
export function normalizeSettings(raw: unknown): AccessibilitySettings {
  const r = (raw ?? {}) as Partial<AccessibilitySettings>
  return {
    fontScale: typeof r.fontScale === 'number' ? clampScale(r.fontScale) : A11Y_DEFAULTS.fontScale,
    reduceMotion: typeof r.reduceMotion === 'boolean' ? r.reduceMotion : A11Y_DEFAULTS.reduceMotion,
    highContrast: typeof r.highContrast === 'boolean' ? r.highContrast : A11Y_DEFAULTS.highContrast,
    underlineLinks:
      typeof r.underlineLinks === 'boolean' ? r.underlineLinks : A11Y_DEFAULTS.underlineLinks,
  }
}

/** Apply settings to the document root. Safe to call only in the browser. */
export function applySettings(s: AccessibilitySettings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.fontSize = s.fontScale === 1 ? '' : `${Math.round(s.fontScale * 100)}%`
  root.classList.toggle('a11y-reduce-motion', s.reduceMotion)
  root.classList.toggle('a11y-high-contrast', s.highContrast)
  root.classList.toggle('a11y-underline-links', s.underlineLinks)
}

export function loadSettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return A11Y_DEFAULTS
  try {
    const stored = window.localStorage.getItem(A11Y_STORAGE_KEY)
    if (!stored) return A11Y_DEFAULTS
    return normalizeSettings(JSON.parse(stored))
  } catch {
    return A11Y_DEFAULTS
  }
}

export function saveSettings(s: AccessibilitySettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable (private mode / quota) — settings still apply for the session */
  }
}
