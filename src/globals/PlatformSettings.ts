import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

const colorField = (name: string, label: string, defaultValue: string) => ({
  name,
  label,
  type: 'text' as const,
  required: true as const,
  defaultValue,
  admin: { description: 'Hex or CSS color value' },
})

export const PlatformSettings: GlobalConfig = {
  slug: 'platform-settings',
  access: {
    read: () => true,
    update: isAdmin,
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
    },
    {
      name: 'description',
      type: 'textarea',
    },

    // ── Bereich: Projekte ──────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Farben – Bereich Projekte',
      fields: [
        colorField('projektesMain',    'Projekte (Main)',    '#ffd085'),
        colorField('projektesLight',   'Projekte Light',    '#ffe3b3'),
        colorField('projektesAccent',  'Projekte Accent',   '#ffb347'),
        colorField('projektesDark',    'Projekte Dark',     '#ff9c1a'),
      ],
    },

    // ── Bereich: Grundlagen ───────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Farben – Bereich Grundlagen',
      fields: [
        colorField('grundlagenMain',   'Grundlagen (Main)',  '#d8d9ff'),
        colorField('grundlagenLight',  'Grundlagen Light',  '#eeeeff'),
        colorField('grundlagenAccent', 'Grundlagen Accent', '#a0a2e8'),
        colorField('grundlagenDark',   'Grundlagen Dark',   '#7375c4'),
      ],
    },

    // ── Bereich: Zusammenarbeit ───────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Farben – Bereich Zusammenarbeit',
      fields: [
        colorField('zusammenarbeitMain',   'Zusammenarbeit (Main)',  '#b2deb7'),
        colorField('zusammenarbeitLight',  'Zusammenarbeit Light',  '#dff2e1'),
        colorField('zusammenarbeitAccent', 'Zusammenarbeit Accent', '#6dbf74'),
        colorField('zusammenarbeitDark',   'Zusammenarbeit Dark',   '#3d9445'),
      ],
    },

    // ── Plattform ─────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Farben – Plattform',
      fields: [
        colorField('plattform',        'Plattform',              '#007734'),
        colorField('plattformLight',   'Plattform Light',        '#f0f0f0'),
        colorField('plattformInk',     'Plattform Ink',          '#555555'),
        colorField('plattformInkAccent', 'Plattform Ink Accent', 'rgba(0,0,0,0.96)'),
        colorField('plattformAccent',  'Plattform Accent',       '#005828'),
        colorField('plattformWhite',            'Plattform White',             '#ffffff'),
        colorField('plattformWhiteTransparent', 'Plattform White Transparent', 'rgba(255, 255, 255, 0.7)'),
        colorField('plattformBlack',            'Plattform Black',             '#000000'),
      ],
    },
  ],
}
