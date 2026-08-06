import { getPayload } from 'payload'
import config from '@payload-config'
import { COLOR_DEFAULTS } from './color-tokens'
import type { PlatformColors } from './color-tokens'

// The canonical token definitions live in src/lib/color-tokens.ts
// (dependency-free, safe for client components).
export type { PlatformColors }

// A stored value only wins when it is a non-empty string — clearing a color
// field in the admin persists `''`, which must fall back to the default
// (an empty custom property would otherwise silently break every var() chain).
const pick = (stored: string | null | undefined, fallback: string): string =>
  stored && stored.trim() !== '' ? stored : fallback

export async function getPlatformColors(): Promise<PlatformColors> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'platform-settings', overrideAccess: true })
    const s = settings as unknown as Partial<PlatformColors>
    return {
      projektesMain:    pick(s.projektesMain,    COLOR_DEFAULTS.projektesMain),
      projektesLight:   pick(s.projektesLight,   COLOR_DEFAULTS.projektesLight),
      projektesAccent:  pick(s.projektesAccent,  COLOR_DEFAULTS.projektesAccent),
      projektesDark:    pick(s.projektesDark,    COLOR_DEFAULTS.projektesDark),
      projektesOnBrand: pick(s.projektesOnBrand, COLOR_DEFAULTS.projektesOnBrand),

      grundlagenMain:   pick(s.grundlagenMain,   COLOR_DEFAULTS.grundlagenMain),
      grundlagenLight:  pick(s.grundlagenLight,  COLOR_DEFAULTS.grundlagenLight),
      grundlagenAccent: pick(s.grundlagenAccent, COLOR_DEFAULTS.grundlagenAccent),
      grundlagenDark:   pick(s.grundlagenDark,   COLOR_DEFAULTS.grundlagenDark),
      grundlagenOnBrand: pick(s.grundlagenOnBrand, COLOR_DEFAULTS.grundlagenOnBrand),

      zusammenarbeitMain:   pick(s.zusammenarbeitMain,   COLOR_DEFAULTS.zusammenarbeitMain),
      zusammenarbeitLight:  pick(s.zusammenarbeitLight,  COLOR_DEFAULTS.zusammenarbeitLight),
      zusammenarbeitAccent: pick(s.zusammenarbeitAccent, COLOR_DEFAULTS.zusammenarbeitAccent),
      zusammenarbeitDark:   pick(s.zusammenarbeitDark,   COLOR_DEFAULTS.zusammenarbeitDark),
      zusammenarbeitOnBrand: pick(s.zusammenarbeitOnBrand, COLOR_DEFAULTS.zusammenarbeitOnBrand),

      plattform:          pick(s.plattform,          COLOR_DEFAULTS.plattform),
      plattformLight:     pick(s.plattformLight,     COLOR_DEFAULTS.plattformLight),
      plattformInk:       pick(s.plattformInk,       COLOR_DEFAULTS.plattformInk),
      plattformInkAccent: pick(s.plattformInkAccent, COLOR_DEFAULTS.plattformInkAccent),
      plattformAccent:    pick(s.plattformAccent,    COLOR_DEFAULTS.plattformAccent),
      plattformWhite:            pick(s.plattformWhite,            COLOR_DEFAULTS.plattformWhite),
      plattformWhiteTransparent: pick(s.plattformWhiteTransparent, COLOR_DEFAULTS.plattformWhiteTransparent),
      plattformBlack:            pick(s.plattformBlack,            COLOR_DEFAULTS.plattformBlack),
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
    '--projekte-on-brand':      c.projektesOnBrand,

    '--grundlagen':             c.grundlagenMain,
    '--grundlagen-light':       c.grundlagenLight,
    '--grundlagen-accent':      c.grundlagenAccent,
    '--grundlagen-dark':        c.grundlagenDark,
    '--grundlagen-on-brand':    c.grundlagenOnBrand,

    '--zusammenarbeit':         c.zusammenarbeitMain,
    '--zusammenarbeit-light':   c.zusammenarbeitLight,
    '--zusammenarbeit-accent':  c.zusammenarbeitAccent,
    '--zusammenarbeit-dark':    c.zusammenarbeitDark,
    '--zusammenarbeit-on-brand': c.zusammenarbeitOnBrand,

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
