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
    gender?: string | null
    birthYear?: number | null
    stadtbereich?: string | null
    affiliations?: string[] | null
    cityInfo?: { organization?: string | null; fachbereich?: string | null; position?: string | null } | null
  }
  const firstName = u.firstName ?? ''
  const lastName = u.lastName ?? ''

  return (
    <div className="max-w-xl mx-auto px-6 py-12 flex flex-col gap-8" style={{ color: 'var(--app-ink)' }}>

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' }}
        >
          <UserCircle className="w-8 h-8" style={{ color: 'var(--app-accent)' }} />
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
