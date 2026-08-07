import { getPlatformColors } from '@/lib/theme'

/**
 * The neutral app palette as CSS custom properties, including the
 * `--plattform-*` re-aliasing that makes shared components render neutral
 * inside the app area. Used by the dashboard layout and the login page so
 * both carry the exact same app look.
 */
export async function getAppVars(): Promise<Record<string, string>> {
  const platformColors = await getPlatformColors()
  return {
    '--app-black': platformColors.appBlack,
    '--app-ink': platformColors.appInk,
    '--app-ink-accent': platformColors.appInkAccent,
    '--app-white': platformColors.appWhite,
    '--app-light': platformColors.appLight,
    '--app-accent': platformColors.appAccent,
    // Override plattform tokens with app (neutral) values so every component
    // inside the app area uses the neutral black/white scheme instead of the
    // green public-brand palette.
    '--plattform': platformColors.appAccent,
    '--plattform-light': platformColors.appLight,
    '--plattform-ink': platformColors.appInk,
    '--plattform-ink-accent': platformColors.appInkAccent,
    '--plattform-accent': platformColors.appAccent,
    '--plattform-white': platformColors.appWhite,
    '--plattform-white-transparent': 'rgba(255, 255, 255, 0.7)',
    '--plattform-black': platformColors.appBlack,
  }
}
