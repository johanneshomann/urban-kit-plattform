import { getPayload } from 'payload'
import config from '@payload-config'
import type { PlatformSetting, Media } from '@/payload-types'

/** A normalized partner logo, ready to render (see SponsorStrip). */
export interface Sponsor {
  logoUrl: string
  alt: string
  name: string
  url: string | null
  height: number
  padTop: number
  padRight: number
  padBottom: number
  padLeft: number
}

const DEFAULT_HEIGHT = 72

/**
 * Maps the raw `sponsors` rows of platform-settings into render-ready entries.
 * Rows without a resolved logo upload or a name are dropped silently — the
 * admin marks both required, but depth-0 fetches or deleted media would
 * otherwise leak broken images.
 */
export function mapSponsors(settings: PlatformSetting): Sponsor[] {
  const rows = settings.sponsors ?? []
  const sponsors: Sponsor[] = []
  for (const row of rows) {
    const logo = row.logo as Media | string | null | undefined
    if (typeof logo !== 'object' || !logo?.url || !row.name) continue
    sponsors.push({
      logoUrl: logo.url,
      alt: logo.alt || row.name,
      name: row.name,
      url: row.url || null,
      height: row.height ?? DEFAULT_HEIGHT,
      padTop: row.padTop ?? 0,
      padRight: row.padRight ?? 0,
      padBottom: row.padBottom ?? 0,
      padLeft: row.padLeft ?? 0,
    })
  }
  return sponsors
}

/** Fetches platform-settings and returns the normalized partner logos. */
export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'platform-settings',
      depth: 1,
      overrideAccess: true,
    })) as unknown as PlatformSetting
    return mapSponsors(settings)
  } catch {
    return []
  }
}
