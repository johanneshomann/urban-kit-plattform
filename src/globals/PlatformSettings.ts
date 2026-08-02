import type { GlobalConfig, Field } from 'payload'
import { isAdmin } from '@/lib/access'
import { COLOR_DEFAULTS } from '@/lib/color-tokens'

/**
 * A brand color field rendered with the native color-picker UI
 * (swatch + hex/text input, kept in sync). Empty falls back to the per-field
 * default in src/lib/theme.ts when injected into the public site.
 */
const colorField = (name: keyof typeof COLOR_DEFAULTS, label: string, description: string): Field => ({
  name,
  type: 'text',
  label,
  defaultValue: COLOR_DEFAULTS[name],
  admin: {
    description: `${description} Hex oder CSS-Farbwert – leer = Standardwert.`,
    components: { Field: '@/components/payload/ColorPicker#ColorPicker' },
  },
})

/** A collapsible group of four color fields (one per platform area). */
const colorGroup = (label: string, fields: Field[]): Field => ({
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
              label: 'Stadtname',
              required: true,
              defaultValue: 'Stadt Detmold',
              admin: { description: 'Name der Stadt, z. B. „Stadt Detmold"' },
            },
            {
              name: 'cityLogo',
              type: 'upload',
              label: 'Stadt-Logo',
              relationTo: 'media',
              required: false,
              admin: { description: 'Optionales Logo der Stadt (erscheint im Header)' },
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
              label: 'Hero-Bilder (Diashow)',
              admin: {
                description: 'Bilder werden auf der Startseite automatisch durchgeblendet.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                  label: 'Bildunterschrift (optional)',
                },
              ],
            },
            {
              name: 'joinRequestsEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Beitrittsanfragen erlauben',
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
            colorGroup('Farben – Bereich Projekte', [
              colorField('projektesMain', 'Projekte (Main)', ''),
              colorField('projektesLight', 'Projekte Light', ''),
              colorField('projektesAccent', 'Projekte Accent', ''),
              colorField('projektesDark', 'Projekte Dark', ''),
            ]),
            colorGroup('Farben – Bereich Grundlagen', [
              colorField('grundlagenMain', 'Grundlagen (Main)', ''),
              colorField('grundlagenLight', 'Grundlagen Light', ''),
              colorField('grundlagenAccent', 'Grundlagen Accent', ''),
              colorField('grundlagenDark', 'Grundlagen Dark', ''),
            ]),
            colorGroup('Farben – Bereich Zusammenarbeit', [
              colorField('zusammenarbeitMain', 'Zusammenarbeit (Main)', ''),
              colorField('zusammenarbeitLight', 'Zusammenarbeit Light', ''),
              colorField('zusammenarbeitAccent', 'Zusammenarbeit Accent', ''),
              colorField('zusammenarbeitDark', 'Zusammenarbeit Dark', ''),
            ]),
            colorGroup('Farben – Plattform', [
              colorField('plattform', 'Plattform', ''),
              colorField('plattformLight', 'Plattform Light', ''),
              colorField('plattformInk', 'Plattform Ink', ''),
              colorField('plattformInkAccent', 'Plattform Ink Accent', ''),
              colorField('plattformAccent', 'Plattform Accent', ''),
              colorField('plattformWhite', 'Plattform White', ''),
              colorField('plattformWhiteTransparent', 'Plattform White Transparent', ''),
              colorField('plattformBlack', 'Plattform Black', ''),
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