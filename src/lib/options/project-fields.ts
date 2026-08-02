/**
 * Single source of truth for the Projects collection's enumerated select
 * fields. Consumed by the Payload collection AND the manage UI, so the two
 * never drift. Each export is a `{ label, value }[]` plus a `*_VALUES` set for
 * server-side validation.
 *
 * `label` keeps the German display string used by the manage UI and the
 * Payload admin's German view; `labelLocalized` is the DE/EN pair handed to the
 * Payload `select` options so the admin panel switches languages too.
 */

export interface FieldOption {
  label: string
  labelLocalized: { en: string; de: string }
  value: string
}

const opt = (de: string, en: string, value: string): FieldOption => ({
  label: de,
  labelLocalized: { en, de },
  value,
})

export const THEMA_OPTIONS: FieldOption[] = [
  opt('Mobilität', 'Mobility', 'mobilitaet'),
  opt('Wohnraum', 'Housing', 'wohnraum'),
  opt('Grünflächen', 'Green spaces', 'gruenflaechen'),
  opt('Infrastruktur', 'Infrastructure', 'infrastruktur'),
  opt('Stadtentwicklung', 'Urban development', 'stadtentwicklung'),
  opt('Kultur', 'Culture', 'kultur'),
  opt('Bildung', 'Education', 'bildung'),
  opt('Umwelt', 'Environment', 'umwelt'),
]

export const STADTBEREICH_OPTIONS: FieldOption[] = [
  opt('Innenstadt', 'City centre', 'innenstadt'),
  opt('Norden', 'North', 'norden'),
  opt('Süden', 'South', 'sueden'),
  opt('Osten', 'East', 'osten'),
  opt('Westen', 'West', 'westen'),
  opt('Gesamtstadt', 'Whole city', 'gesamtstadt'),
]

export const ALTERSGRUPPE_OPTIONS: FieldOption[] = [
  opt('Kinder (0–12)', 'Children (0–12)', 'kinder'),
  opt('Jugendliche (13–17)', 'Teenagers (13–17)', 'jugendliche'),
  opt('Erwachsene (18–64)', 'Adults (18–64)', 'erwachsene'),
  opt('Senioren (65+)', 'Seniors (65+)', 'senioren'),
]

export const GENDER_OPTIONS: FieldOption[] = [
  opt('Männlich', 'Male', 'maennlich'),
  opt('Weiblich', 'Female', 'weiblich'),
  opt('Divers', 'Diverse', 'divers'),
  opt('Alle', 'All', 'alle'),
]

const valuesOf = (opts: FieldOption[]) => new Set(opts.map((o) => o.value))

export const THEMA_VALUES = valuesOf(THEMA_OPTIONS)
export const STADTBEREICH_VALUES = valuesOf(STADTBEREICH_OPTIONS)
export const ALTERSGRUPPE_VALUES = valuesOf(ALTERSGRUPPE_OPTIONS)
export const GENDER_VALUES = valuesOf(GENDER_OPTIONS)