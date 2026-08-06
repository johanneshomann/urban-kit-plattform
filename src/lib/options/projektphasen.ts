/**
 * Single source of truth for the 7-step participatory-planning journey
 * ("Projektphase"). The same model is documented for citizens on
 * Grundlagen / Projektplanung — keep both reading from this list so labels
 * and order never drift.
 *
 * The coarse `status` field on a project is derived from the current phase
 * (see {@link statusFromProjektphase}); editors only ever pick the phase.
 */

export type ProjektStatus = 'active' | 'planning' | 'completed' | 'archived'

type Lokalisiert = { en: string; de: string }

export interface Projektphase {
  /** Stable value persisted on the project. */
  value: string
  /** Short label shown in admin & on cards (localized DE-first). */
  label: Lokalisiert
  /** 0-based position in the journey. */
  step: number
  /** Coarse lifecycle state this phase maps to. */
  status: ProjektStatus
}

export const PROJEKTPHASEN: readonly Projektphase[] = [
  { value: 'warum-wofuer', label: { en: 'Why & what for?', de: 'Warum & Wofür?' }, step: 0, status: 'planning' },
  { value: 'einarbeitung', label: { en: 'Preparation', de: 'Einarbeitung' }, step: 1, status: 'planning' },
  { value: 'konzept', label: { en: 'Concept', de: 'Konzept' }, step: 2, status: 'planning' },
  { value: 'projektplanung', label: { en: 'Project planning', de: 'Projektplanung' }, step: 3, status: 'planning' },
  { value: 'ausfuehrung', label: { en: 'Implementation', de: 'Ausführung' }, step: 4, status: 'active' },
  { value: 'ueberwachung', label: { en: 'Monitoring', de: 'Überwachung' }, step: 5, status: 'active' },
  { value: 'abschluss', label: { en: 'Conclusion', de: 'Abschluss' }, step: 6, status: 'completed' },
] as const

/** First phase — used as the default for new projects. */
export const DEFAULT_PROJEKTPHASE = PROJEKTPHASEN[0].value

/** Payload `select` options for the Projektphase field (DE strings — shared
 *  with the manage UI which renders them directly). */
export const projektphaseOptions = PROJEKTPHASEN.map(({ value, label, step }) => ({
  label: `${step + 1}. ${label.de}`,
  value,
}))

/** Localized variant for the Payload admin (DE + EN pairs). */
export const projektphaseOptionsLocalized = PROJEKTPHASEN.map(({ value, label, step }) => ({
  label: {
    en: `${step + 1}. ${label.en}`,
    de: `${step + 1}. ${label.de}`,
  },
  value,
}))

/** Derive the coarse lifecycle `status` from the current Projektphase. */
export function statusFromProjektphase(phase: string | null | undefined): ProjektStatus {
  return PROJEKTPHASEN.find((p) => p.value === phase)?.status ?? 'planning'
}