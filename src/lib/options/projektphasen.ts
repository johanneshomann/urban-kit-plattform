/**
 * Single source of truth for the project lifecycle ("Projektphase") — adopted
 * 1:1 from the Methodensammlung's phase taxonomy (`project-phases` grouped
 * into `project-phase-categories`), so both products share one system and the
 * dashboard's method suggestions match by identical names. The public
 * Grundlagen journey adds an editorial intro ("Zuerst – Warum & Wofür?") on
 * top of these phases — that intro is deliberately NOT a phase.
 *
 * The coarse `status` field on a project is derived from the phase's CATEGORY
 * (see {@link statusFromProjektphase}); editors only ever pick the phase.
 */

export type ProjektStatus = 'active' | 'planning' | 'completed' | 'archived'
export type PhaseCategory = 'vorbereitung' | 'durchfuehrung' | 'nachbereitung'

type Lokalisiert = { en: string; de: string }

export interface Projektphase {
  /** Stable value persisted on the project — slugified archive phase name. */
  value: string
  /** Label shown in admin & on cards — identical wording to the archive. */
  label: Lokalisiert
  /** 0-based position in the lifecycle. */
  step: number
  /** Archive phase category this phase belongs to. */
  category: PhaseCategory
}

/** The archive's three phase categories; each maps to a coarse status. */
export const PHASE_CATEGORIES: Record<PhaseCategory, { label: Lokalisiert; status: ProjektStatus }> = {
  vorbereitung: { label: { de: 'Vorbereitung', en: 'Preparation' }, status: 'planning' },
  durchfuehrung: { label: { de: 'Durchführung', en: 'Execution' }, status: 'active' },
  nachbereitung: { label: { de: 'Nachbereitung', en: 'Follow-up' }, status: 'completed' },
}

export const PROJEKTPHASEN: readonly Projektphase[] = [
  { value: 'einarbeitung', label: { de: 'Einarbeitung', en: 'Onboarding' }, step: 0, category: 'vorbereitung' },
  { value: 'konzeptentwicklung', label: { de: 'Konzeptentwicklung', en: 'Concept development' }, step: 1, category: 'vorbereitung' },
  { value: 'projektplanung', label: { de: 'Projektplanung', en: 'Project planning' }, step: 2, category: 'vorbereitung' },
  { value: 'projektausfuehrung', label: { de: 'Projektausführung', en: 'Project execution' }, step: 3, category: 'durchfuehrung' },
  { value: 'projektueberwachung', label: { de: 'Projektüberwachung', en: 'Project monitoring' }, step: 4, category: 'durchfuehrung' },
  { value: 'projektabschluss', label: { de: 'Projektabschluss', en: 'Project closure' }, step: 5, category: 'nachbereitung' },
  { value: 'abschluss-wirkung', label: { de: 'Abschluss & Wirkung', en: 'Finalisation & impact' }, step: 6, category: 'nachbereitung' },
  { value: 'reflexion-evaluation', label: { de: 'Reflexion & Evaluation', en: 'Reflection & evaluation' }, step: 7, category: 'nachbereitung' },
] as const

/** First phase — used as the default for new projects. */
export const DEFAULT_PROJEKTPHASE = PROJEKTPHASEN[0].value

/**
 * Legacy 7-step journey values (pre archive alignment) → current phases.
 * Kept so unmigrated documents keep rendering; the migration script
 * (scripts/migrate-projektphasen.ts) rewrites stored values with this map.
 */
export const LEGACY_PHASE_MAP: Record<string, string> = {
  'warum-wofuer': 'einarbeitung',
  konzept: 'konzeptentwicklung',
  ausfuehrung: 'projektausfuehrung',
  ueberwachung: 'projektueberwachung',
  abschluss: 'projektabschluss',
}

/** Map legacy stored values onto the current system (identity otherwise). */
export function normalizeProjektphase(value: string | null | undefined): string {
  if (!value) return DEFAULT_PROJEKTPHASE
  return LEGACY_PHASE_MAP[value] ?? value
}

/** Resolve a stored phase value (incl. legacy values) to its phase entry. */
export function findProjektphase(value: string | null | undefined): Projektphase | undefined {
  const normalized = normalizeProjektphase(value)
  return PROJEKTPHASEN.find((p) => p.value === normalized)
}

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
  const p = findProjektphase(phase)
  return p ? PHASE_CATEGORIES[p.category].status : 'planning'
}
