import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin } from '@/lib/access'

export const LegalSettings: GlobalConfig = {
  slug: 'legal-settings',
  label: 'Legal – Kontakt & Impressum',
  access: {
    read: () => true,
    update: isAdmin,
  },
  admin: {
    group: 'Einstellungen',
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Kontaktdaten',
      fields: [
        {
          name: 'operatorName',
          type: 'text',
          label: 'Plattformbetreiber',
          defaultValue: 'Stadt Detmold',
          admin: { description: 'Name der Betreiberorganisation, z. B. „Stadt Detmold"' },
        },
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Kontakt-E-Mail',
          defaultValue: 'urbankit@detmold.de',
          admin: { description: 'Allgemeine Kontaktadresse' },
        },
        {
          name: 'technicalSupportEmail',
          type: 'email',
          label: 'E-Mail technischer Support',
          admin: { description: 'Für technische Probleme (kann identisch sein mit Kontakt-E-Mail)' },
        },
        {
          name: 'streetAddress',
          type: 'text',
          label: 'Straße / Gebäude',
          defaultValue: 'Rathaus Detmold, Marktplatz 1',
        },
        {
          name: 'zipCode',
          type: 'text',
          label: 'Postleitzahl',
          defaultValue: '32756',
        },
        {
          name: 'addressCity',
          type: 'text',
          label: 'Stadt',
          defaultValue: 'Detmold',
        },
      ],
    },
    {
      name: 'impressumContent',
      type: 'richText',
      label: 'Impressum',
      editor: lexicalEditor(),
      admin: {
        description: 'Vollständiger Impressumstext gemäß § 5 TMG',
      },
    },
  ],
}
