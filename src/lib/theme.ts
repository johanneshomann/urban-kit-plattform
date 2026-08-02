import { getPayload } from 'payload'
import config from '@payload-config'
import { COLOR_DEFAULTS } from './color-tokens'
import type { PlatformColors } from './color-tokens'

// Re-exported for backward compatibility — the canonical token definitions live
// in src/lib/color-tokens.ts (dependency-free, safe for client components).
export { COLOR_DEFAULTS }
export type { PlatformColors }

export async function getPlatformColors(): Promise<PlatformColors> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'platform-settings', overrideAccess: true })
    const s = settings as unknown as Partial<PlatformColors>
    return {
      projektesMain:    s.projektesMain    ?? COLOR_DEFAULTS.projektesMain,
      projektesLight:   s.projektesLight   ?? COLOR_DEFAULTS.projektesLight,
      projektesAccent:  s.projektesAccent  ?? COLOR_DEFAULTS.projektesAccent,
      projektesDark:    s.projektesDark    ?? COLOR_DEFAULTS.projektesDark,

      grundlagenMain:   s.grundlagenMain   ?? COLOR_DEFAULTS.grundlagenMain,
      grundlagenLight:  s.grundlagenLight  ?? COLOR_DEFAULTS.grundlagenLight,
      grundlagenAccent: s.grundlagenAccent ?? COLOR_DEFAULTS.grundlagenAccent,
      grundlagenDark:   s.grundlagenDark   ?? COLOR_DEFAULTS.grundlagenDark,

      zusammenarbeitMain:   s.zusammenarbeitMain   ?? COLOR_DEFAULTS.zusammenarbeitMain,
      zusammenarbeitLight:  s.zusammenarbeitLight  ?? COLOR_DEFAULTS.zusammenarbeitLight,
      zusammenarbeitAccent: s.zusammenarbeitAccent ?? COLOR_DEFAULTS.zusammenarbeitAccent,
      zusammenarbeitDark:   s.zusammenarbeitDark   ?? COLOR_DEFAULTS.zusammenarbeitDark,

      plattform:          s.plattform          ?? COLOR_DEFAULTS.plattform,
      plattformLight:     s.plattformLight     ?? COLOR_DEFAULTS.plattformLight,
      plattformInk:       s.plattformInk       ?? COLOR_DEFAULTS.plattformInk,
      plattformInkAccent: s.plattformInkAccent ?? COLOR_DEFAULTS.plattformInkAccent,
      plattformAccent:    s.plattformAccent    ?? COLOR_DEFAULTS.plattformAccent,
      plattformWhite:            s.plattformWhite            ?? COLOR_DEFAULTS.plattformWhite,
      plattformWhiteTransparent: s.plattformWhiteTransparent ?? COLOR_DEFAULTS.plattformWhiteTransparent,
      plattformBlack:            s.plattformBlack            ?? COLOR_DEFAULTS.plattformBlack,
    }
  } catch {
    return COLOR_DEFAULTS
  }
}

export function colorsToCssVars(c: PlatformColors): Record<string, string> {
  return {
    '--projekte':               c.projektesMain,
    '--projekte-light':         c.projektesLight,
    '--projekte-accent':        c.projektesAccent,
    '--projekte-dark':          c.projektesDark,

    '--grundlagen':             c.grundlagenMain,
    '--grundlagen-light':       c.grundlagenLight,
    '--grundlagen-accent':      c.grundlagenAccent,
    '--grundlagen-dark':        c.grundlagenDark,

    '--zusammenarbeit':         c.zusammenarbeitMain,
    '--zusammenarbeit-light':   c.zusammenarbeitLight,
    '--zusammenarbeit-accent':  c.zusammenarbeitAccent,
    '--zusammenarbeit-dark':    c.zusammenarbeitDark,

    '--plattform':                    c.plattform,
    '--plattform-light':              c.plattformLight,
    '--plattform-ink':                c.plattformInk,
    '--plattform-ink-accent':         c.plattformInkAccent,
    '--plattform-accent':             c.plattformAccent,
    '--plattform-white':              c.plattformWhite,
    '--plattform-white-transparent':  c.plattformWhiteTransparent,
    '--plattform-black':              c.plattformBlack,
  }
}
