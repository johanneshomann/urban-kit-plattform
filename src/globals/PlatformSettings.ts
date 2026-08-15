import type { GlobalConfig, Field, TextField } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin } from '@/lib/access'
import { COLOR_DEFAULTS } from '@/lib/color-tokens'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'

type Localized = { en: string; de: string }

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Hex color text field with validation — one per project-scheme palette role. */
function schemeColorField(name: string, label: Localized, description: Localized): TextField {
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
 * A brand color field rendered with the native color-picker UI
 * (swatch + hex/text input, kept in sync). Label + description are localized
 * DE-first; empty falls back to the per-field default in src/lib/theme.ts
 * when injected into the public site.
 */
const colorField = (
  name: keyof typeof COLOR_DEFAULTS,
  label: Localized,
  descriptionHint: Localized,
): Field => ({
  name,
  type: 'text',
  label,
  defaultValue: COLOR_DEFAULTS[name],
  admin: {
    description: {
      en: `${descriptionHint.en} Hex or CSS color value – empty = default.`,
      de: `${descriptionHint.de} Hex oder CSS-Farbwert – leer = Standardwert.`,
    },
    components: { Field: '@/components/payload/ColorPicker#ColorPicker' },
  },
})

/** A collapsible group of four color fields (one per platform area). */
const colorGroup = (label: Localized, fields: Field[]): Field => ({
  type: 'collapsible',
  label,
  fields,
})

export const PlatformSettings: GlobalConfig = {
  slug: 'platform-settings',
  label: { en: 'Platform Settings', de: 'Plattform-Einstellungen' },
  admin: {
    group: 'Einstellungen',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'City', de: 'Stadt' },
          description: {
            en: 'City identity shown across the public portal (header, hero, metadata).',
            de: 'Stadt-Identität, die im öffentlichen Portal erscheint (Header, Hero, Metadaten).',
          },
          fields: [
            {
              name: 'cityName',
              type: 'text',
              label: { en: 'City name', de: 'Stadtname' },
              required: true,
              defaultValue: 'Stadt Detmold',
              admin: { description: { en: 'Name of the city, e.g. “Stadt Detmold”.', de: 'Name der Stadt, z. B. „Stadt Detmold".' } },
            },
            {
              name: 'cityLogo',
              type: 'upload',
              label: { en: 'City logo', de: 'Stadt-Logo' },
              relationTo: 'media',
              required: false,
              admin: { description: { en: 'Optional city logo (shown in the header).', de: 'Optionales Logo der Stadt (erscheint im Header).' } },
            },
          ],
        },
        {
          label: { en: 'General', de: 'Allgemein' },
          description: {
            en: 'Public frontpage hero and general platform behaviour.',
            de: 'Öffentlicher Startseiten-Bereich und allgemeines Plattform-Verhalten.',
          },
          fields: [
            {
              name: 'heroImages',
              type: 'array',
              label: { en: 'Hero images (slideshow)', de: 'Hero-Bilder (Diashow)' },
              admin: {
                description: { en: 'Images cross-fade automatically on the frontpage.', de: 'Bilder werden auf der Startseite automatisch durchgeblendet.' },
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: { en: 'Image', de: 'Bild' },
                },
                {
                  name: 'caption',
                  type: 'text',
                  label: { en: 'Caption (optional)', de: 'Bildunterschrift (optional)' },
                },
              ],
            },
            {
              name: 'joinRequestsEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: { en: 'Allow join requests', de: 'Beitrittsanfragen erlauben' },
            },
            {
              name: 'methodenUrl',
              type: 'text',
              label: { en: 'Method collection URL', de: 'Methodensammlung-URL' },
              admin: {
                placeholder: 'https://methoden.urbankit.de',
                description: {
                  en: 'Base URL of the Methodensammlung — used for the method teasers (GraphQL API) and all links into the collection. Leave empty to use the METHODEN_URL environment variable or the default.',
                  de: 'Basis-URL der Methodensammlung — genutzt für die Methoden-Teaser (GraphQL-API) und alle Links in die Sammlung. Leer lassen, um die Umgebungsvariable METHODEN_URL bzw. den Standard zu nutzen.',
                },
              },
            },
          ],
        },
        {
          label: { en: 'About', de: 'Über' },
          description: {
            en: 'Editorial content of the “Über UrbanKIT” page (shown between the fixed sections).',
            de: 'Redaktioneller Inhalt der Seite „Über UrbanKIT“ (erscheint zwischen den festen Abschnitten).',
          },
          fields: [
            {
              name: 'ueber',
              type: 'richText',
              localized: true,
              editor: lexicalEditor(),
              label: { en: 'Content', de: 'Inhalt' },
              admin: {
                description: {
                  en: 'Free text about the project, e.g. background, funding, participants. Empty = the section is hidden.',
                  de: 'Freitext über das Projekt, z. B. Hintergrund, Förderung, Beteiligte. Leer = der Abschnitt wird ausgeblendet.',
                },
              },
            },
          ],
        },
        {
          label: { en: 'Partners', de: 'Partner' },
          description: {
            en: 'Partner / sponsor logos, shown in the footer of the public portal and on the “Über UrbanKIT” page. Order here = display order.',
            de: 'Partner-/Förderer-Logos, erscheinen im Footer des öffentlichen Portals und auf der Seite „Über UrbanKIT“. Reihenfolge hier = Anzeigereihenfolge.',
          },
          fields: [
            {
              name: 'sponsors',
              type: 'array',
              label: { en: 'Partner logos', de: 'Partner-Logos' },
              labels: {
                singular: { en: 'Partner', de: 'Partner' },
                plural: { en: 'Partners', de: 'Partner' },
              },
              admin: {
                description: {
                  en: 'Preferably SVG or an optimized PNG with transparent background.',
                  de: 'Bevorzugt SVG oder ein optimiertes PNG mit transparentem Hintergrund.',
                },
              },
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: { en: 'Logo', de: 'Logo' },
                },
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: { en: 'Name', de: 'Name' },
                  admin: {
                    description: {
                      en: 'Not shown as text — used as the accessible name / tooltip of the logo.',
                      de: 'Wird nicht als Text angezeigt — dient als barrierefreier Name / Tooltip des Logos.',
                    },
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: { en: 'Link (optional)', de: 'Link (optional)' },
                  admin: { placeholder: 'https://…' },
                },
                {
                  type: 'collapsible',
                  label: { en: 'Display (optional)', de: 'Darstellung (optional)' },
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      name: 'height',
                      type: 'number',
                      min: 24,
                      max: 240,
                      label: { en: 'Height (px)', de: 'Höhe (px)' },
                      admin: { description: { en: 'Rendered logo height. Empty = 72 px.', de: 'Dargestellte Logo-Höhe. Leer = 72 px.' } },
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'padTop', type: 'number', min: 0, max: 120, label: { en: 'Padding top (px)', de: 'Abstand oben (px)' } },
                        { name: 'padRight', type: 'number', min: 0, max: 120, label: { en: 'Padding right (px)', de: 'Abstand rechts (px)' } },
                        { name: 'padBottom', type: 'number', min: 0, max: 120, label: { en: 'Padding bottom (px)', de: 'Abstand unten (px)' } },
                        { name: 'padLeft', type: 'number', min: 0, max: 120, label: { en: 'Padding left (px)', de: 'Abstand links (px)' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: { en: 'Project Colors', de: 'Projektfarben' },
          description: {
            en: 'Fine-tune the palettes of the eight project color schemes. Scheme names are fixed — projects reference them. Mind the contrast pairings: accent/ink/black carry text on white/light/general, black on dark, white on accent.',
            de: 'Feinjustierung der Paletten der acht Projekt-Farbschemata. Die Namen sind fest — Projekte referenzieren sie. Kontrast-Paarungen beachten: accent/ink/black tragen Text auf white/light/general, black auf dark, white auf accent.',
          },
          fields: [
            // The scheme NAMES are fixed in code (src/lib/defaults/colorSchemes.ts) —
            // projects store a scheme by name, so names are read-only here; only the
            // seven role colors can be tuned. `getColorSchemes()` merges these rows
            // over the code defaults. The role structure and its contrast gate are
            // documented in src/lib/defaults/colorSchemes.ts.
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
                schemeColorField('light', { en: 'Light', de: 'Light' }, { en: 'Page / section background.', de: 'Seiten-/Abschnittshintergrund.' }),
                schemeColorField('general', { en: 'General', de: 'General' }, { en: 'Pastel brand surface.', de: 'Pastellige Markenfläche.' }),
                schemeColorField('dark', { en: 'Dark', de: 'Dark' }, { en: 'Chip/badge surface — carries dark text only.', de: 'Chip-/Badge-Fläche — trägt nur dunklen Text.' }),
                schemeColorField('accent', { en: 'Accent', de: 'Accent' }, { en: 'Darkest hue tone: links, solid buttons (white text).', de: 'Dunkelster Farbton: Links, Buttons (weißer Text).' }),
                schemeColorField('ink', { en: 'Ink', de: 'Ink' }, { en: 'Desaturated body copy.', de: 'Entsättigter Fließtext.' }),
                schemeColorField('white', { en: 'White', de: 'White' }, { en: 'Near-white surface; text on accent.', de: 'Fast-weiße Fläche; Text auf Accent.' }),
                schemeColorField('black', { en: 'Black', de: 'Black' }, { en: 'Headings; text on general/dark.', de: 'Überschriften; Text auf General/Dark.' }),
              ],
            },
          ],
        },
        {
          label: { en: 'Colors', de: 'Farben' },
          description: {
            en: 'Brand colors for the public portal. Leave a field empty to use its default. Changes apply on the next page load.',
            de: 'Markenfarben des öffentlichen Portals. Ein leeres Feld nutzt den Standardwert. Änderungen greifen beim nächsten Seitenaufruf.',
          },
          fields: [
            colorGroup({ en: 'Area colors – Projects', de: 'Farben – Bereich Projekte' }, [
              colorField('projektesMain', { en: 'Projects (main)', de: 'Projekte (Main)' }, { en: 'Primary color of the “Projekte” area.', de: 'Primärfarbe des Bereichs „Projekte“.' }),
              colorField('projektesLight', { en: 'Projects light', de: 'Projekte Light' }, { en: 'Light tint of the “Projekte” area.', de: 'Heller Ton des Bereichs „Projekte“.' }),
              colorField('projektesAccent', { en: 'Projects accent', de: 'Projekte Accent' }, { en: 'Accent of the “Projekte” area.', de: 'Akzentfarbe des Bereichs „Projekte“.' }),
              colorField('projektesDark', { en: 'Projects dark', de: 'Projekte Dark' }, { en: 'Darkest shade of the “Projekte” area.', de: 'Dunkelste Schattierung des Bereichs „Projekte“.' }),
              colorField('projektesOnBrand', { en: 'Projects on-brand text', de: 'Projekte On-Brand-Text' }, { en: 'Text/icon color on “Projekte” brand surfaces (chips, balls).', de: 'Text-/Iconfarbe auf Markenflächen des Bereichs „Projekte“ (Chips, Buttons).' }),
            ]),
            colorGroup({ en: 'Area colors – Basics', de: 'Farben – Bereich Grundlagen' }, [
              colorField('grundlagenMain', { en: 'Basics (main)', de: 'Grundlagen (Main)' }, { en: 'Primary color of the “Grundlagen” area.', de: 'Primärfarbe des Bereichs „Grundlagen“.' }),
              colorField('grundlagenLight', { en: 'Basics light', de: 'Grundlagen Light' }, { en: 'Light tint of the “Grundlagen” area.', de: 'Heller Ton des Bereichs „Grundlagen“.' }),
              colorField('grundlagenAccent', { en: 'Basics accent', de: 'Grundlagen Accent' }, { en: 'Accent of the “Grundlagen” area.', de: 'Akzentfarbe des Bereichs „Grundlagen“.' }),
              colorField('grundlagenDark', { en: 'Basics dark', de: 'Grundlagen Dark' }, { en: 'Darkest shade of the “Grundlagen” area.', de: 'Dunkelste Schattierung des Bereichs „Grundlagen“.' }),
              colorField('grundlagenOnBrand', { en: 'Basics on-brand text', de: 'Grundlagen On-Brand-Text' }, { en: 'Text/icon color on “Grundlagen” brand surfaces (chips, balls).', de: 'Text-/Iconfarbe auf Markenflächen des Bereichs „Grundlagen“ (Chips, Buttons).' }),
            ]),
            colorGroup({ en: 'Area colors – Collaboration', de: 'Farben – Bereich Zusammenarbeit' }, [
              colorField('zusammenarbeitMain', { en: 'Collaboration (main)', de: 'Zusammenarbeit (Main)' }, { en: 'Primary color of the “Zusammenarbeit” area.', de: 'Primärfarbe des Bereichs „Zusammenarbeit“.' }),
              colorField('zusammenarbeitLight', { en: 'Collaboration light', de: 'Zusammenarbeit Light' }, { en: 'Light tint of the “Zusammenarbeit” area.', de: 'Heller Ton des Bereichs „Zusammenarbeit“.' }),
              colorField('zusammenarbeitAccent', { en: 'Collaboration accent', de: 'Zusammenarbeit Accent' }, { en: 'Accent of the “Zusammenarbeit” area.', de: 'Akzentfarbe des Bereichs „Zusammenarbeit“.' }),
              colorField('zusammenarbeitDark', { en: 'Collaboration dark', de: 'Zusammenarbeit Dark' }, { en: 'Darkest shade of the “Zusammenarbeit” area.', de: 'Dunkelste Schattierung des Bereichs „Zusammenarbeit“.' }),
              colorField('zusammenarbeitOnBrand', { en: 'Collaboration on-brand text', de: 'Zusammenarbeit On-Brand-Text' }, { en: 'Text/icon color on “Zusammenarbeit” brand surfaces (chips, balls).', de: 'Text-/Iconfarbe auf Markenflächen des Bereichs „Zusammenarbeit“ (Chips, Buttons).' }),
            ]),
            colorGroup({ en: 'Platform colors', de: 'Farben – Plattform' }, [
              colorField('plattform', { en: 'Platform', de: 'Plattform' }, { en: 'Primary platform color.', de: 'Primäre Plattformfarbe.' }),
              colorField('plattformLight', { en: 'Platform light', de: 'Plattform Light' }, { en: 'Light platform surface.', de: 'Helle Plattformfläche.' }),
              colorField('plattformInk', { en: 'Platform ink', de: 'Plattform Ink' }, { en: 'Default body-copy color.', de: 'Standardfarbe für Fließtext.' }),
              colorField('plattformInkAccent', { en: 'Platform ink accent', de: 'Plattform Ink Accent' }, { en: 'Strong text / heading color.', de: 'Kräftige Text-/Überschriftenfarbe.' }),
              colorField('plattformAccent', { en: 'Platform accent', de: 'Plattform Accent' }, { en: 'Hover / highlight accent.', de: 'Akzent für Hover und Hervorhebungen.' }),
              colorField('plattformWhite', { en: 'Platform white', de: 'Plattform White' }, { en: 'Card / surface white.', de: 'Weiß für Karten und Flächen.' }),
              colorField('plattformWhiteTransparent', { en: 'Platform white (transparent)', de: 'Plattform White Transparent' }, { en: 'Translucent white overlay.', de: 'Transparente weiße Überlagerung.' }),
              colorField('plattformBlack', { en: 'Platform black', de: 'Plattform Black' }, { en: 'Contrast black for dark accents.', de: 'Kontrast-Schwarz für dunkle Akzente.' }),
            ]),
            colorGroup({ en: 'App colors (workspace)', de: 'App-Farben (Arbeitsbereich)' }, [
              colorField('appBlack', { en: 'App black', de: 'App Black' }, { en: 'Darkest contrast color for the workspace.', de: 'Dunkelste Kontrastfarbe für den Arbeitsbereich.' }),
              colorField('appInk', { en: 'App ink', de: 'App Ink' }, { en: 'Default body-copy color in the workspace.', de: 'Standardfarbe für Fließtext im Arbeitsbereich.' }),
              colorField('appInkAccent', { en: 'App ink accent', de: 'App Ink Accent' }, { en: 'Strong text / heading color in the workspace.', de: 'Kräftige Text-/Überschriftenfarbe im Arbeitsbereich.' }),
              colorField('appWhite', { en: 'App white', de: 'App White' }, { en: 'Card / surface white in the workspace.', de: 'Weiß für Karten und Flächen im Arbeitsbereich.' }),
              colorField('appLight', { en: 'App light', de: 'App Light' }, { en: 'Light surface background in the workspace.', de: 'Helle Hintergrundfläche im Arbeitsbereich.' }),
              colorField('appAccent', { en: 'App accent', de: 'App Accent' }, { en: 'Accent color for buttons and highlights in the workspace.', de: 'Akzentfarbe für Buttons und Hervorhebungen im Arbeitsbereich.' }),
            ]),
            {
              name: 'resetColors',
              type: 'ui',
              admin: { components: { Field: '@/components/payload/ColorResetButton#ColorResetButton' } },
            },
          ],
        },
      ],
    },
  ],
}