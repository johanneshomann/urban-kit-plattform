// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

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
import { normalizeProjektphase } from '@/lib/options/projektphasen'

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
 * Our Projektphasen (src/lib/options/projektphasen.ts) are adopted 1:1 from
 * the Methodensammlung — our phase VALUES are the archive's stable `slug`s,
 * so matching is slug identity. The German display names below remain only as
 * a fallback for archive databases whose phases don't carry slugs yet.
 */
const PHASE_NAME_FALLBACK: Record<string, string> = {
  einarbeitung: 'Einarbeitung',
  konzeptentwicklung: 'Konzeptentwicklung',
  projektplanung: 'Projektplanung',
  projektausfuehrung: 'Projektausführung',
  projektueberwachung: 'Projektüberwachung',
  projektabschluss: 'Projektabschluss',
  'abschluss-wirkung': 'Abschluss & Wirkung',
  'reflexion-evaluation': 'Reflexion & Evaluation',
}

/**
 * Up to `limit` suggested methods per requested Projektphase, keyed by OUR
 * phase value. Two round-trips: resolve the archive's phase taxonomy (with
 * categories) once, then one aliased query fetching the methods of every
 * matched phase set. Degrades to an empty map without a key or on any failure.
 */
export async function getMethodSuggestions(
  locale: 'de' | 'en',
  phaseValues: string[],
  limit = 6,
): Promise<Record<string, MethodTeaser[]>> {
  const key = process.env.METHODEN_API_KEY
  if (!key) return {}
  const requested = [...new Set(phaseValues.map((v) => normalizeProjektphase(v)))].filter((v) => v in PHASE_NAME_FALLBACK)
  if (requested.length === 0) return {}
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `api-clients API-Key ${key}`,
  }
  try {
    const base = await getMethodenBaseUrl()
    const phasesRes = await fetch(`${base}/api/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: 'query { ProjectPhases(limit: 100, locale: de) { docs { id name slug } } }',
      }),
      next: { revalidate: 3600 },
    })
    if (!phasesRes.ok) return {}
    const phasesJson = (await phasesRes.json()) as {
      data?: { ProjectPhases?: { docs?: { id: string; name?: string | null; slug?: string | null }[] } }
    }
    const archivePhases = phasesJson.data?.ProjectPhases?.docs ?? []

    const matched = requested
      .map((ours, i) => {
        // Stable slug first; German display name only as legacy fallback.
        let ids = archivePhases.filter((d) => d.slug === ours).map((d) => d.id)
        if (ids.length === 0) {
          ids = archivePhases.filter((d) => d.name === PHASE_NAME_FALLBACK[ours]).map((d) => d.id)
        }
        return { ours, ids, alias: `p${i}` }
      })
      .filter((m) => m.ids.length > 0)
    if (matched.length === 0) return {}

    const query = `query PhaseMethods($locale: LocaleInputType) { ${matched
      .map(
        (m) =>
          `${m.alias}: Methods(limit: ${limit}, locale: $locale, fallbackLocale: de, sort: "-updatedAt", where: { projectPhases: { in: [${m.ids.map((id) => `"${id}"`).join(', ')}] } }) { docs { id title slug auszug } }`,
      )
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

/**
 * Up to `limit` example methods for EVERY Projektphase (Grundlagen page) —
 * same data source and mapping as {@link getMethodSuggestions}.
 */
export async function getPhaseMethodTeasers(locale: 'de' | 'en', limit = 3): Promise<Record<string, MethodTeaser[]>> {
  return getMethodSuggestions(locale, Object.keys(PHASE_NAME_FALLBACK), limit)
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
