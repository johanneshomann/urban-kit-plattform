import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { UserCircle } from 'lucide-react'

export default async function ProfilPage() {
  const user = await getUser()
  if (!user) notFound()
  const t = await getTranslations('profile')

  const u = user as unknown as {
    firstName?: string
    lastName?: string
    avatar?: string | { id: string; url?: string | null } | null
    gender?: string | null
    birthYear?: number | null
    stadtbereich?: string | null
    affiliations?: string[] | null
    cityInfo?: { organization?: string | null; fachbereich?: string | null; position?: string | null } | null
  }
  const firstName = u.firstName ?? ''
  const lastName = u.lastName ?? ''

  // Avatar may arrive populated (object) or as a bare media id, depending on
  // the auth depth — resolve to a URL either way.
  let avatarUrl: string | null = null
  if (u.avatar && typeof u.avatar === 'object') {
    avatarUrl = u.avatar.url ?? null
  } else if (typeof u.avatar === 'string') {
    const payload = await getPayload({ config })
    const media = await payload.findByID({ collection: 'media', id: u.avatar, depth: 0, overrideAccess: true }).catch(() => null)
    avatarUrl = (media as { url?: string | null } | null)?.url ?? null
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 flex flex-col gap-8" style={{ color: 'var(--app-ink)' }}>

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" aria-hidden className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-8 h-8" style={{ color: 'var(--app-accent)' }} />
          )}
        </div>
        <div>
          <h1 className="text-text font-bold" style={{ color: 'var(--app-ink-accent)' }}>
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : t('title')}
          </h1>
          <p className="text-small opacity-50">{user.email}</p>
        </div>
      </div>

      <ProfileForm
        firstName={firstName}
        lastName={lastName}
        email={user.email}
        avatarUrl={avatarUrl}
        gender={u.gender ?? ''}
        birthYear={u.birthYear ?? null}
        stadtbereich={u.stadtbereich ?? ''}
        affiliations={u.affiliations ?? []}
        cityInfo={{
          organization: u.cityInfo?.organization ?? '',
          fachbereich: u.cityInfo?.fachbereich ?? '',
          position: u.cityInfo?.position ?? '',
        }}
      />

    </div>
  )
}
