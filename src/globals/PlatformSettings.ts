import type { GlobalConfig, Field } from 'payload'
import { isAdmin } from '@/lib/access'
import { COLOR_DEFAULTS } from '@/lib/color-tokens'

type Localized = { en: string; de: string }

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