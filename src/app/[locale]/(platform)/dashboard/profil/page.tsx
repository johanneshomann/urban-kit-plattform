import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { resolveColorScheme } from '@/lib/colorScheme'
import { ProfileForm } from './ProfileForm'
import { MembershipList, type MembershipItem } from './MembershipList'
import { IconTooltip } from '@/components/platform/IconTooltip'
import { ArrowLeft } from 'lucide-react'

export default async function ProfilPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await getUser()
  if (!user) notFound()
  const [t, tp] = await Promise.all([getTranslations('profile'), getTranslations('platform')])

  const u = user as unknown as {
    firstName?: string
    lastName?: string
    avatar?: string | { id: string; url?: string | null } | null
    profileBadge?: string | null
    bio?: string | null
    gallery?: { image?: string | { id: string; url?: string | null } | null }[] | null
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

  const payloadClient = await getPayload({ config })

  // Gallery: entries may arrive populated or as bare media ids — resolve all
  // to {id, url}; bare ids are batch-fetched in one query.
  const galleryEntries = (u.gallery ?? []).map((g) => g.image).filter((img): img is NonNullable<typeof img> => !!img)
  const galleryImages: { id: string; url: string }[] = []
  const pendingIds: string[] = []
  for (const img of galleryEntries) {
    if (typeof img === 'object') {
      if (img.url) galleryImages.push({ id: String(img.id), url: img.url })
    } else {
      pendingIds.push(img)
    }
  }
  if (pendingIds.length > 0) {
    const mediaRes = await payloadClient.find({
      collection: 'media',
      where: { id: { in: pendingIds } },
      limit: pendingIds.length,
      depth: 0,
      overrideAccess: true,
    })
    for (const id of pendingIds) {
      const doc = mediaRes.docs.find((d) => String(d.id) === id) as { id: string; url?: string | null } | undefined
      if (doc?.url) galleryImages.push({ id, url: doc.url })
    }
  }

  // Active memberships + pending join requests — one query, split below.
  const membershipsRes = await payloadClient.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: user.id } }, { status: { in: ['active', 'requested'] } }] },
    sort: 'order',
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })
  const toMembershipItem = (m: (typeof membershipsRes.docs)[number]): (MembershipItem & { status: string }) | null => {
    const project = m.project as { id: string; title?: string; colorScheme?: string | null } | undefined
    if (!project?.title) return null
    const scheme = resolveColorScheme(project.colorScheme)
    return {
      membershipId: String(m.id),
      title: project.title,
      role: (m.role as string) ?? 'Citizen',
      status: (m.status as string) ?? 'active',
      schemeLight: scheme.light,
      schemeGeneral: scheme.general,
      schemeAccent: scheme.accent,
      schemeDark: scheme.dark,
    }
  }
  const allMembershipItems = membershipsRes.docs.map(toMembershipItem).filter((x): x is MembershipItem & { status: string } => x !== null)
  const membershipItems = allMembershipItems.filter((x) => x.status === 'active')
  const requestItems = allMembershipItems.filter((x) => x.status === 'requested')

  return (
    <div className="px-6 md:px-10 py-10 flex flex-col gap-8" style={{ color: 'var(--app-ink)' }}>

      {/* Section title with inline back arrow + hairline divider, matching the
          dashboard's section-header pattern */}
      <div>
        <div className="flex items-center gap-2">
          <IconTooltip label={tp('navDashboard')}>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center opacity-50 transition-opacity hover:opacity-100"
              style={{ color: 'var(--app-ink-accent)' }}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              <span className="sr-only">{tp('navDashboard')}</span>
            </Link>
          </IconTooltip>
          <h1 className="text-small font-semibold opacity-50">{t('title')}</h1>
        </div>
        <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      </div>

      {/* Wide layout: form left (2/3), memberships as a sticky aside right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2">
          <ProfileForm
            firstName={firstName}
            lastName={lastName}
            email={user.email}
            avatarUrl={avatarUrl}
            profileBadge={u.profileBadge ?? ''}
            bio={u.bio ?? ''}
            galleryImages={galleryImages}
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

        <div className="lg:sticky lg:top-16">
          <MembershipList items={membershipItems} requests={requestItems} />
        </div>
      </div>

    </div>
  )
}
