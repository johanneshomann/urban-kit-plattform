import { getPayload } from 'payload'
import config from '@payload-config'
import type { PlatformSetting, Media } from '@/payload-types'

export interface CitySettings {
  cityName: string
  cityLogoUrl: string | null
}

export async function getCitySettings(): Promise<CitySettings> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'platform-settings', depth: 1, overrideAccess: true }) as unknown as PlatformSetting
    const logo = settings.cityLogo as Media | null | undefined
    let cityLogoUrl: string | null = null
    if (logo?.url) {
      cityLogoUrl = logo.url
    }
    return {
      cityName: settings.cityName ?? 'Stadt Detmold',
      cityLogoUrl,
    }
  } catch {
    return { cityName: 'Stadt Detmold', cityLogoUrl: null }
  }
}
