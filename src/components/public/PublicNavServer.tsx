import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getCitySettings } from '@/lib/instance'
import { PublicNav } from './PublicNav'

export async function PublicNavServer({ locale }: { locale: string }) {
  const [user, { cityName, cityLogoUrl }] = await Promise.all([getUser(), getCitySettings()])

  // Avatar may arrive populated (object) or as a bare media id — resolve to a
  // URL either way for the header's user chip.
  let avatarUrl: string | null = null
  if (user?.avatar && typeof user.avatar === 'object') {
    avatarUrl = user.avatar.url ?? null
  } else if (typeof user?.avatar === 'string') {
    const payload = await getPayload({ config })
    const media = await payload
      .findByID({ collection: 'media', id: user.avatar, depth: 0, overrideAccess: true })
      .catch(() => null)
    avatarUrl = (media as { url?: string | null } | null)?.url ?? null
  }

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
      avatarUrl={avatarUrl}
      profileBadge={user?.profileBadge ?? null}
    />
  )
}
