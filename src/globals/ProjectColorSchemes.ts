import type { GlobalConfig, TextField } from 'payload'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'
import { isAdmin } from '@/lib/access'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Hex color text field with validation — one per palette role. */
function colorField(name: string, label: { en: string; de: string }, description: { en: string; de: string }): TextField {
  return {
    name,
    type: 'text',
    required: true,
    label,
    validate: (value: unknown) =>
      typeof value === 'string' && HEX_RE.test(value)
        ? true
        : 'Bitte einen 6-stelligen Hex-Farbwert angeben (z. B. #aabbcc). / Please provide a 6-digit hex color (e.g. #aabbcc).',
    admin: { description },
  }
}

/**
 * Admin-editable palettes for the eight project color schemes. The scheme
 * NAMES are fixed in code (src/lib/defaults/colorSchemes.ts) — projects store
 * a scheme by name, so names are read-only here; only the seven role colors
 * can be tuned. `getColorSchemes()` merges these rows over the code defaults.
 *
 * The role structure and its contrast gate are documented in
 * src/lib/defaults/colorSchemes.ts — keep edited colors within those pairings
 * (e.g. `white` text only ever sits on `accent`, never on `dark`).
 */
export const ProjectColorSchemes: GlobalConfig = {
  slug: 'project-color-schemes',
  label: { en: 'Project Color Schemes', de: 'Projekt-Farbschemata' },
  admin: {
    group: 'Einstellungen',
    description: {
      en: 'Fine-tune the palettes of the eight project color schemes. Scheme names are fixed — projects reference them. Mind the contrast pairings: accent/ink/black carry text on white/light/general, black on dark, white on accent.',
      de: 'Feinjustierung der Paletten der acht Projekt-Farbschemata. Die Namen sind fest — Projekte referenzieren sie. Kontrast-Paarungen beachten: accent/ink/black tragen Text auf white/light/general, black auf dark, white auf accent.',
    },
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'schemes',
      type: 'array',
      label: { en: 'Schemes', de: 'Schemata' },
      minRows: defaultColorSchemes.length,
      maxRows: defaultColorSchemes.length,
      defaultValue: defaultColorSchemes.map((s) => ({ ...s })),
      admin: {
        isSortable: false,
        components: {
          RowLabel: '@/components/payload/SchemeRowLabel#SchemeRowLabel',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: { en: 'Name (fixed)', de: 'Name (fest)' },
          admin: {
            readOnly: true,
            description: {
              en: 'Identity — projects store this name. Not editable.',
              de: 'Identität — Projekte speichern diesen Namen. Nicht änderbar.',
            },
          },
        },
        colorField('light', { en: 'Light', de: 'Light' }, { en: 'Page / section background.', de: 'Seiten-/Abschnittshintergrund.' }),
        colorField('general', { en: 'General', de: 'General' }, { en: 'Pastel brand surface.', de: 'Pastellige Markenfläche.' }),
        colorField('dark', { en: 'Dark', de: 'Dark' }, { en: 'Chip/badge surface — carries dark text only.', de: 'Chip-/Badge-Fläche — trägt nur dunklen Text.' }),
        colorField('accent', { en: 'Accent', de: 'Accent' }, { en: 'Darkest hue tone: links, solid buttons (white text).', de: 'Dunkelster Farbton: Links, Buttons (weißer Text).' }),
        colorField('ink', { en: 'Ink', de: 'Ink' }, { en: 'Desaturated body copy.', de: 'Entsättigter Fließtext.' }),
        colorField('white', { en: 'White', de: 'White' }, { en: 'Near-white surface; text on accent.', de: 'Fast-weiße Fläche; Text auf Accent.' }),
        colorField('black', { en: 'Black', de: 'Black' }, { en: 'Headings; text on general/dark.', de: 'Überschriften; Text auf General/Dark.' }),
      ],
    },
  ],
}
