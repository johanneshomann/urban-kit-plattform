// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { emailVerificationEnabled } from '@/lib/email'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { en: 'User', de: 'Benutzer:in' },
    plural: { en: 'Users', de: 'Benutzer:innen' },
  },
  auth: {
    // Activation mail: new accounts must confirm their address before they
    // can log in. Coupled to SMTP being configured (src/lib/email.ts) so
    // dev setups without a mailer keep instant registration.
    verify: emailVerificationEnabled
      ? {
          generateEmailSubject: () => 'UrbanKIT – E-Mail-Adresse bestätigen',
          generateEmailHTML: ({ token }) => {
            const url = `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/de/verifizieren/${token}`
            return `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
                <p style="font-size: 18px; font-weight: 700; margin: 0 0 24px;">Urban<span style="opacity: 0.6;">KIT</span></p>
                <h1 style="font-size: 20px; margin: 0 0 12px;">E-Mail-Adresse bestätigen</h1>
                <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                  Willkommen! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr UrbanKIT-Konto zu aktivieren.
                </p>
                <p style="margin: 0 0 24px;">
                  <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Konto aktivieren</a>
                </p>
                <p style="font-size: 12px; line-height: 1.6; color: #6b6b6b; margin: 0;">
                  Falls der Button nicht funktioniert, öffnen Sie diesen Link:<br />
                  <a href="${url}" style="color: #6b6b6b;">${url}</a><br /><br />
                  Sie haben sich nicht registriert? Dann können Sie diese E-Mail ignorieren.
                </p>
              </div>`
          },
        }
      : false,
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'firstName', type: 'text', label: { en: 'First name', de: 'Vorname' } },
    { name: 'lastName', type: 'text', label: { en: 'Last name', de: 'Nachname' } },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: { en: 'Avatar', de: 'Avatar' } },
    {
      name: 'bio',
      type: 'textarea',
      label: { en: 'About me', de: 'Über mich' },
      maxLength: 1000,
    },
    {
      name: 'gallery',
      type: 'array',
      label: { en: 'Gallery', de: 'Galerie' },
      maxRows: 12,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', label: { en: 'Image', de: 'Bild' } }],
    },
    {
      name: 'memberships',
      type: 'join',
      collection: 'project-memberships',
      on: 'user',
      label: { en: 'Memberships', de: 'Mitgliedschaften' },
    },
    {
      name: 'role',
      type: 'select',
      label: { en: 'Role', de: 'Rolle' },
      defaultValue: 'user',
      options: [
        { label: { en: 'Admin', de: 'Admin' }, value: 'admin' },
        { label: { en: 'User', de: 'User' }, value: 'user' },
      ],
    },
    // Voluntary demographic details — self-service via the profile page, used
    // to evaluate how representative participation is. All optional.
    {
      name: 'gender',
      type: 'select',
      label: { en: 'Gender', de: 'Geschlecht' },
      options: [
        { label: { en: 'Female', de: 'Weiblich' }, value: 'female' },
        { label: { en: 'Male', de: 'Männlich' }, value: 'male' },
        { label: { en: 'Diverse', de: 'Divers' }, value: 'diverse' },
        { label: { en: 'Prefer not to say', de: 'Keine Angabe' }, value: 'noAnswer' },
      ],
    },
    {
      name: 'birthYear',
      type: 'number',
      label: { en: 'Year of birth', de: 'Geburtsjahr' },
      min: 1900,
      max: new Date().getFullYear(),
    },
    {
      name: 'stadtbereich',
      type: 'select',
      label: { en: 'City area', de: 'Stadtbereich' },
      options: [
        { label: { en: 'City centre', de: 'Innenstadt' }, value: 'innenstadt' },
        { label: { en: 'North', de: 'Norden' }, value: 'norden' },
        { label: { en: 'South', de: 'Süden' }, value: 'sueden' },
        { label: { en: 'East', de: 'Osten' }, value: 'osten' },
        { label: { en: 'West', de: 'Westen' }, value: 'westen' },
      ],
    },
    {
      name: 'affiliations',
      type: 'select',
      hasMany: true,
      label: { en: 'Background', de: 'Hintergrund' },
      options: [
        { label: { en: 'Citizen', de: 'Bürger:in' }, value: 'citizen' },
        { label: { en: 'Student', de: 'Student:in' }, value: 'student' },
        { label: { en: 'City employee', de: 'Mitarbeiter:in der Stadt' }, value: 'cityEmployee' },
        { label: { en: 'University / Research', de: 'Hochschule / Forschung' }, value: 'academia' },
        { label: { en: 'Other', de: 'Sonstiges' }, value: 'other' },
      ],
    },
    {
      name: 'cityInfo',
      type: 'group',
      label: { en: 'City details', de: 'Angaben zur Stadt' },
      admin: {
        condition: (data) => Array.isArray(data?.affiliations) && data.affiliations.includes('cityEmployee'),
      },
      fields: [
        { name: 'organization', type: 'text', label: { en: 'Organisation', de: 'Organisation' } },
        { name: 'fachbereich', type: 'text', label: { en: 'Department', de: 'Fachbereich' } },
        { name: 'position', type: 'text', label: { en: 'Position / Function', de: 'Position / Funktion' } },
      ],
    },
    // Self-chosen badge icon, shown as a small overlay on the avatar. Values
    // map to lucide icons via PROFILE_BADGE_ICONS in src/lib/profile-badges.ts.
    {
      name: 'profileBadge',
      type: 'select',
      label: { en: 'Profile badge', de: 'Profil-Badge' },
      options: [
        { label: { en: 'Star', de: 'Stern' }, value: 'star' },
        { label: { en: 'Heart', de: 'Herz' }, value: 'heart' },
        { label: { en: 'Sparkles', de: 'Funkeln' }, value: 'sparkles' },
        { label: { en: 'Leaf', de: 'Blatt' }, value: 'leaf' },
        { label: { en: 'Sun', de: 'Sonne' }, value: 'sun' },
        { label: { en: 'Flower', de: 'Blume' }, value: 'flower' },
        { label: { en: 'Rocket', de: 'Rakete' }, value: 'rocket' },
        { label: { en: 'Music', de: 'Musik' }, value: 'music' },
        { label: { en: 'Camera', de: 'Kamera' }, value: 'camera' },
        { label: { en: 'Book', de: 'Buch' }, value: 'book' },
        { label: { en: 'Bike', de: 'Fahrrad' }, value: 'bike' },
        { label: { en: 'Paw', de: 'Pfote' }, value: 'paw' },
      ],
    },
    // Self-service platform settings, edited from the profile page.
    {
      name: 'settings',
      type: 'group',
      label: { en: 'Settings', de: 'Einstellungen' },
      fields: [
        {
          name: 'hideActivityFeed',
          type: 'checkbox',
          defaultValue: false,
          label: { en: 'Hide dashboard activity feed', de: 'Neuigkeiten im Dashboard ausblenden' },
        },
        {
          name: 'hideAllProjects',
          type: 'checkbox',
          defaultValue: false,
          label: { en: 'Hide "All projects" on the dashboard', de: '„Alle Projekte" im Dashboard ausblenden' },
        },
        {
          name: 'hidePeopleSearch',
          type: 'checkbox',
          defaultValue: false,
          label: { en: 'Hide people search on the dashboard', de: 'Personen-Suche im Dashboard ausblenden' },
        },
        {
          name: 'profileVisible',
          type: 'checkbox',
          defaultValue: true,
          label: { en: 'Profile visible to project members', de: 'Profil für Projektmitglieder sichtbar' },
        },
      ],
    },
  ],
}
