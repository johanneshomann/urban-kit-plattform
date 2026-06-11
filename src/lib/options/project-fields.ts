/**
 * Single source of truth for the Projects collection's enumerated select
 * fields. Consumed by the Payload collection AND the manage UI, so the two
 * never drift. Each export is a `{ label, value }[]` plus a `*_VALUES` set for
 * server-side validation.
 */

export interface FieldOption {
  label: string
  value: string
}

export const THEMA_OPTIONS: FieldOption[] = [
  { label: 'Mobilität', value: 'mobilitaet' },
  { label: 'Wohnraum', value: 'wohnraum' },
  { label: 'Grünflächen', value: 'gruenflaechen' },
  { label: 'Infrastruktur', value: 'infrastruktur' },
  { label: 'Stadtentwicklung', value: 'stadtentwicklung' },
  { label: 'Kultur', value: 'kultur' },
  { label: 'Bildung', value: 'bildung' },
  { label: 'Umwelt', value: 'umwelt' },
]

export const STADTBEREICH_OPTIONS: FieldOption[] = [
  { label: 'Innenstadt', value: 'innenstadt' },
  { label: 'Norden', value: 'norden' },
  { label: 'Süden', value: 'sueden' },
  { label: 'Osten', value: 'osten' },
  { label: 'Westen', value: 'westen' },
  { label: 'Gesamtstadt', value: 'gesamtstadt' },
]

export const ALTERSGRUPPE_OPTIONS: FieldOption[] = [
  { label: 'Kinder (0–12)', value: 'kinder' },
  { label: 'Jugendliche (13–17)', value: 'jugendliche' },
  { label: 'Erwachsene (18–64)', value: 'erwachsene' },
  { label: 'Senioren (65+)', value: 'senioren' },
]

export const GENDER_OPTIONS: FieldOption[] = [
  { label: 'Männlich', value: 'maennlich' },
  { label: 'Weiblich', value: 'weiblich' },
  { label: 'Divers', value: 'divers' },
  { label: 'Alle', value: 'alle' },
]

const valuesOf = (opts: FieldOption[]) => new Set(opts.map((o) => o.value))

export const THEMA_VALUES = valuesOf(THEMA_OPTIONS)
export const STADTBEREICH_VALUES = valuesOf(STADTBEREICH_OPTIONS)
export const ALTERSGRUPPE_VALUES = valuesOf(ALTERSGRUPPE_OPTIONS)
export const GENDER_VALUES = valuesOf(GENDER_OPTIONS)
