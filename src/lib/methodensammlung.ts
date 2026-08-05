import 'server-only'

/**
 * Read-only client for the Methodensammlung's GraphQL API.
 *
 * The sibling app (methoden.urbankit.de) exposes published methods to external
 * consumers only via GraphQL, authenticated with an API-client key
 * (`Authorization: api-clients API-Key <key>` — see its ApiClients collection).
 * Without a configured key the teaser fetch degrades to an empty list, so the
 * Grundlagen page renders fine with just the collection CTA.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const DEFAULT_METHODEN_URL = 'https://methoden.urbankit.de'

/**
 * Base URL of the Methodensammlung. Resolution order: admin field
 * (Platform Settings → Allgemein → Methodensammlung-URL) → METHODEN_URL env
 * var → default. Blank values fall through; a trailing slash is stripped.
 */
export async function getMethodenBaseUrl(): Promise<string> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({ slug: 'platform-settings', overrideAccess: true })) as { methodenUrl?: string | null }
    const stored = settings.methodenUrl?.trim()
    if (stored) return stored.replace(/\/+$/, '')
  } catch {
    // fall through to env/default
  }
  const env = process.env.METHODEN_URL?.trim()
  return (env || DEFAULT_METHODEN_URL).replace(/\/+$/, '')
}

export interface MethodTeaser {
  id: string
  title: string
  slug?: string | null
  auszug?: string | null
  image?: { url?: string | null; sizes?: { card?: { url?: string | null } | null } | null } | null
  characteristics?: { id: string; name?: string | null }[] | null
}

const TEASER_QUERY = `
  query MethodTeasers($limit: Int, $locale: LocaleInputType) {
    Methods(limit: $limit, locale: $locale, fallbackLocale: de, sort: "-updatedAt") {
      docs {
        id
        title
        slug
        auszug
        image { url sizes { card { url } } }
        characteristics { id name }
      }
    }
  }
`

export async function getMethodTeasers(locale: 'de' | 'en', limit = 6): Promise<MethodTeaser[]> {
  const key = process.env.METHODEN_API_KEY
  if (!key) return []
  try {
    const base = await getMethodenBaseUrl()
    const res = await fetch(`${base}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `api-clients API-Key ${key}`,
      },
      body: JSON.stringify({ query: TEASER_QUERY, variables: { limit, locale } }),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: { Methods?: { docs?: MethodTeaser[] } } }
    return json.data?.Methods?.docs ?? []
  } catch {
    return []
  }
}

/**
 * Our Projektphasen (src/lib/options/projektphasen.ts) → the Methodensammlung's
 * `project-phases` taxonomy, matched by German name. `warum-wofuer` has no
 * counterpart over there and simply yields no example methods.
 */
const PHASE_NAME_MAP: Record<string, string | null> = {
  'warum-wofuer': null,
  einarbeitung: 'Einarbeitung',
  konzept: 'Konzeptentwicklung',
  projektplanung: 'Projektplanung',
  ausfuehrung: 'Projektausführung',
  ueberwachung: 'Projektüberwachung',
  abschluss: 'Projektabschluss',
}

/**
 * Up to `limit` example methods per Projektphase, keyed by OUR phase value.
 * Two round-trips: resolve the phase taxonomy ids by German name, then one
 * aliased query fetching the methods of every matched phase. Degrades to an
 * empty map without a key or on any failure.
 */
export async function getPhaseMethodTeasers(locale: 'de' | 'en', limit = 3): Promise<Record<string, MethodTeaser[]>> {
  const key = process.env.METHODEN_API_KEY
  if (!key) return {}
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `api-clients API-Key ${key}`,
  }
  try {
    const base = await getMethodenBaseUrl()
    const phasesRes = await fetch(`${base}/api/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'query { ProjectPhases(limit: 50, locale: de) { docs { id name } } }' }),
      next: { revalidate: 3600 },
    })
    if (!phasesRes.ok) return {}
    const phasesJson = (await phasesRes.json()) as { data?: { ProjectPhases?: { docs?: { id: string; name?: string | null }[] } } }
    const byName = new Map((phasesJson.data?.ProjectPhases?.docs ?? []).map((d) => [d.name ?? '', d.id]))

    const matched = Object.entries(PHASE_NAME_MAP)
      .map(([ours, theirs], i) => ({ ours, id: theirs ? byName.get(theirs) : undefined, alias: `p${i}` }))
      .filter((m): m is { ours: string; id: string; alias: string } => !!m.id)
    if (matched.length === 0) return {}

    const query = `query PhaseMethods($locale: LocaleInputType) { ${matched
      .map((m) => `${m.alias}: Methods(limit: ${limit}, locale: $locale, fallbackLocale: de, sort: "-updatedAt", where: { projectPhases: { in: ["${m.id}"] } }) { docs { id title slug } }`)
      .join(' ')} }`
    const res = await fetch(`${base}/api/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables: { locale } }),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return {}
    const json = (await res.json()) as { data?: Record<string, { docs?: MethodTeaser[] }> }
    const out: Record<string, MethodTeaser[]> = {}
    for (const m of matched) out[m.ours] = json.data?.[m.alias]?.docs ?? []
    return out
  } catch {
    return {}
  }
}

// Number of fallback cover images in the Methodensammlung's /method-defaults pool.
const DEFAULT_POOL_SIZE = 7

/**
 * Cover image for a method teaser, mirroring the Methodensammlung's own logic:
 * prefer the generated card rendition, then the original upload, otherwise a
 * deterministic pick from its default-image pool. Relative upload paths are
 * absolutized against the resolved base URL.
 */
export function methodImageUrl(m: MethodTeaser, base: string): string {
  const url = m.image?.sizes?.card?.url ?? m.image?.url
  if (url) return url.startsWith('http') ? url : `${base}${url}`
  const index = (String(m.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % DEFAULT_POOL_SIZE) + 1
  return `${base}/method-defaults/${index}.jpg`
}
