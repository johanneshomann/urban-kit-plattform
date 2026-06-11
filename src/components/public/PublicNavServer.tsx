import { getUser } from '@/lib/auth/getUser'
import { getCitySettings } from '@/lib/instance'
import { PublicNav } from './PublicNav'

export async function PublicNavServer({ locale }: { locale: string }) {
  const [user, { cityName, cityLogoUrl }] = await Promise.all([getUser(), getCitySettings()])

  return (
    <PublicNav
      locale={locale}
      cityName={cityName}
      cityLogoUrl={cityLogoUrl}
      isLoggedIn={Boolean(user)}
      userName={user ? [
        (user as unknown as { firstName?: string }).firstName,
        (user as unknown as { lastName?: string }).lastName,
      ].filter(Boolean).join(' ') || null : null}
    />
  )
}
