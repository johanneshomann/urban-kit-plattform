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

export const METHODEN_URL = process.env.METHODEN_URL ?? 'https://methoden.urbankit.de'

export interface MethodTeaser {
  id: string
  title: string
  slug?: string | null
  auszug?: string | null
}

const TEASER_QUERY = `
  query MethodTeasers($limit: Int, $locale: LocaleInputType) {
    Methods(limit: $limit, locale: $locale, fallbackLocale: de, sort: "-updatedAt") {
      docs { id title slug auszug }
    }
  }
`

export async function getMethodTeasers(locale: 'de' | 'en', limit = 6): Promise<MethodTeaser[]> {
  const key = process.env.METHODEN_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`${METHODEN_URL}/api/graphql`, {
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
