import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin } from '@/lib/access'

// Localized legal texts (imprint / privacy / cookie policy) live under their own
// tabs and carry a DE + EN version each (edit via the admin language switch;
// empty locales fall back to German on the public site). Contact details are
// language-agnostic and stay single-value.
const legalContentLabel = { en: 'Content', de: 'Inhalt' }

export const LegalSettings: GlobalConfig = {
  slug: 'legal-settings',
  label: 'Legal – Kontakt & Recht',
  access: {
    read: () => true,
    update: isAdmin,
  },
  admin: {
    group: 'Einstellungen',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Contact Details', de: 'Kontaktdaten' },
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
          label: { en: 'Imprint', de: 'Impressum' },
          fields: [
            {
              name: 'impressum',
              type: 'richText',
              localized: true,
              editor: lexicalEditor(),
              label: legalContentLabel,
              admin: { description: 'Vollständiger Impressumstext gemäß § 5 TMG' },
            },
          ],
        },
        {
          label: { en: 'Privacy Policy', de: 'Datenschutz' },
          fields: [
            {
              name: 'datenschutz',
              type: 'richText',
              localized: true,
              editor: lexicalEditor(),
              label: legalContentLabel,
              admin: { description: 'Datenschutzerklärung gemäß Art. 13 DSGVO' },
            },
          ],
        },
        {
          label: { en: 'Cookie Policy', de: 'Cookie-Richtlinie' },
          fields: [
            {
              name: 'cookies',
              type: 'richText',
              localized: true,
              editor: lexicalEditor(),
              label: legalContentLabel,
              admin: { description: 'Cookie-Richtlinie / Hinweise zu eingesetzten Cookies' },
            },
          ],
        },
      ],
    },
  ],
}
