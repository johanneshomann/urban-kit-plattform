// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * Editable content for the public Grundlagen page — the Methodensammlung's
 * "add section" pattern (title + richtext, drag-and-drop sortable) for the
 * three areas Projektplanung, Partizipation and Rechtlicher Rahmen.
 *
 * The page falls back to the message-catalog content while an area's array is
 * empty; Projektplanung additionally keeps its structured journey accordion
 * until sections are entered here.
 */
const sectionFields = [
  {
    name: 'sectionTitle',
    type: 'text' as const,
    required: true,
    label: { en: 'Title', de: 'Titel' },
    admin: { description: { en: 'Heading of this accordion section.', de: 'Überschrift des Abschnitts im Aufklapp-Bereich.' } },
  },
  {
    name: 'content',
    type: 'richText' as const,
    label: { en: 'Content', de: 'Inhalt' },
    admin: { description: { en: 'Content of this section.', de: 'Inhalt dieses Abschnitts.' } },
  },
]

const sectionArray = (name: string, labelDe: string, labelEn: string, descDe: string, descEn: string) => ({
  name,
  type: 'array' as const,
  label: { en: labelEn, de: labelDe },
  localized: true,
  labels: { singular: { en: 'Section', de: 'Abschnitt' }, plural: { en: 'Sections', de: 'Abschnitte' } },
  admin: { description: { en: descEn, de: descDe } },
  fields: sectionFields,
})

export const Grundlagen: GlobalConfig = {
  slug: 'grundlagen',
  label: { en: 'Basics (Grundlagen)', de: 'Grundlagen' },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    sectionArray(
      'projektplanung', 'Projektplanung', 'Project planning',
      'Abschnitte für den Bereich Projektplanung. Solange leer, zeigt die Seite die eingebaute Schritt-für-Schritt-Reise.',
      'Sections for the project-planning area. While empty, the page shows the built-in step-by-step journey.',
    ),
    sectionArray(
      'partizipation', 'Partizipation', 'Participation',
      'Abschnitte für den Bereich Partizipation. Solange leer, zeigt die Seite die eingebauten Texte.',
      'Sections for the participation area. While empty, the page shows the built-in texts.',
    ),
    sectionArray(
      'recht', 'Rechtlicher Rahmen', 'Legal framework',
      'Abschnitte für den Bereich Rechtlicher Rahmen. Solange leer, zeigt die Seite die eingebauten Texte.',
      'Sections for the legal-framework area. While empty, the page shows the built-in texts.',
    ),
  ],
}
