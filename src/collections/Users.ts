import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { en: 'User', de: 'Benutzer:in' },
    plural: { en: 'Users', de: 'Benutzer:innen' },
  },
  auth: true,
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
  ],
}
