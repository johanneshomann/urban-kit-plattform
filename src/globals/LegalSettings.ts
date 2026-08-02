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
  label: { en: 'Legal – Contact & Terms', de: 'Legal – Kontakt & Recht' },
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
              label: { en: 'Platform operator', de: 'Plattformbetreiber' },
              defaultValue: 'Stadt Detmold',
              admin: { description: { en: 'Name of the operating organisation, e.g. “Stadt Detmold”.', de: 'Name der Betreiberorganisation, z. B. „Stadt Detmold".' } },
            },
            {
              name: 'contactEmail',
              type: 'email',
              label: { en: 'Contact email', de: 'Kontakt-E-Mail' },
              defaultValue: 'urbankit@detmold.de',
              admin: { description: { en: 'General contact address', de: 'Allgemeine Kontaktadresse' } },
            },
            {
              name: 'technicalSupportEmail',
              type: 'email',
              label: { en: 'Technical support email', de: 'E-Mail technischer Support' },
              admin: { description: { en: 'For technical issues (may be the same as the contact email)', de: 'Für technische Probleme (kann identisch sein mit Kontakt-E-Mail)' } },
            },
            {
              name: 'streetAddress',
              type: 'text',
              label: { en: 'Street / building', de: 'Straße / Gebäude' },
              defaultValue: 'Rathaus Detmold, Marktplatz 1',
            },
            {
              name: 'zipCode',
              type: 'text',
              label: { en: 'Postal code', de: 'Postleitzahl' },
              defaultValue: '32756',
            },
            {
              name: 'addressCity',
              type: 'text',
              label: { en: 'City', de: 'Stadt' },
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
              admin: { description: { en: 'Full imprint text in accordance with § 5 TMG', de: 'Vollständiger Impressumstext gemäß § 5 TMG' } },
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
              admin: { description: { en: 'Privacy policy in accordance with Art. 13 GDPR', de: 'Datenschutzerklärung gemäß Art. 13 DSGVO' } },
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
              admin: { description: { en: 'Cookie policy / notes on cookies used', de: 'Cookie-Richtlinie / Hinweise zu eingesetzten Cookies' } },
            },
          ],
        },
      ],
    },
  ],
}
