import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { resolveColorScheme } from '@/lib/colorScheme'

/** What the people search exposes about a user — never e-mail or demographics. */
export type Person = {
  id: string
  name: string
  avatarUrl: string | null
  profileBadge: string | null
  affiliations: string[]
  bio: string | null
  galleryUrls: string[]
  sharedProjects: { id: string; title: string; light: string; accent: string }[]
}

const RESULT_LIMIT = 20

/**
 * Find platform members for the dashboard people section.
 *
 * Without a query (or with fewer than 2 characters) only the viewer's project
 * peers are returned — there is no browsable list of all citizens. A real
 * query searches the whole platform by first/last name. Users who switched
 * off `settings.profileVisible` never appear, nor do admins or the viewer.
 * A projectId filter is honored only for projects the viewer is a member of.
 */
export async function findPeople(
  viewerId: string,
  opts: { query?: string; projectId?: string; affiliation?: string } = {},
): Promise<Person[]> {
  const payload = await getPayload({ config })

  // The viewer's own projects — basis for peer discovery and shared-project pills.
  const viewerMemberships = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: viewerId } }, { status: { equals: 'active' } }] },
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })
  const projectMeta = new Map<string, { title: string; colorScheme?: string | null }>()
  for (const m of viewerMemberships.docs) {
    const p = m.project as { id: string; title?: string; colorScheme?: string | null } | undefined
    if (p?.id && p.title) projectMeta.set(String(p.id), { title: p.title, colorScheme: p.colorScheme })
  }

  // Only filter by a project the viewer actually belongs to (no probing).
  const projectFilter = opts.projectId && projectMeta.has(opts.projectId) ? opts.projectId : undefined
  const scopeProjectIds = projectFilter ? [projectFilter] : [...projectMeta.keys()]

  // Peers: active members of the scoped projects, mapped userId → projectIds.
  const sharedByUser = new Map<string, Set<string>>()
  if (scopeProjectIds.length > 0) {
    const peerMemberships = await payload.find({
      collection: 'project-memberships',
      where: {
        and: [
          { project: { in: scopeProjectIds } },
          { status: { equals: 'active' } },
          { user: { not_equals: viewerId } },
        ],
      },
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    })
    for (const m of peerMemberships.docs) {
      const userId = m.user ? String(m.user) : null
      const projectId = m.project ? String(m.project) : null
      if (!userId || !projectId) continue
      if (!sharedByUser.has(userId)) sharedByUser.set(userId, new Set())
      sharedByUser.get(userId)!.add(projectId)
    }
  }

  const query = (opts.query ?? '').trim()
  const searchMode = query.length >= 2

  const conditions: Where[] = [
    { id: { not_equals: viewerId } },
    { role: { not_equals: 'admin' } },
    // Default true — undefined (older accounts) counts as visible.
    { 'settings.profileVisible': { not_equals: false } },
  ]
  if (opts.affiliation) conditions.push({ affiliations: { contains: opts.affiliation } })

  if (searchMode) {
    conditions.push({ or: [{ firstName: { like: query } }, { lastName: { like: query } }] })
    // A project filter narrows the search to that project's members.
    if (projectFilter) {
      const peerIds = [...sharedByUser.keys()]
      if (peerIds.length === 0) return []
      conditions.push({ id: { in: peerIds } })
    }
  } else {
    const peerIds = [...sharedByUser.keys()]
    if (peerIds.length === 0) return []
    conditions.push({ id: { in: peerIds } })
  }

  const usersRes = await payload.find({
    collection: 'users',
    where: { and: conditions },
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })

  const people: Person[] = usersRes.docs.map((u) => {
    const avatar = u.avatar as { url?: string | null } | string | null | undefined
    const galleryUrls = (Array.isArray(u.gallery) ? u.gallery : [])
      .map((g) => (typeof g.image === 'object' && g.image ? (g.image.url ?? null) : null))
      .filter((url): url is string => !!url)
    const sharedProjects = [...(sharedByUser.get(String(u.id)) ?? [])]
      .filter((pid) => projectMeta.has(pid))
      .map((pid) => {
        const meta = projectMeta.get(pid)!
        const scheme = resolveColorScheme(meta.colorScheme)
        return { id: pid, title: meta.title, light: scheme.light, accent: scheme.accent }
      })
    return {
      id: String(u.id),
      name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim(),
      avatarUrl: typeof avatar === 'object' && avatar ? (avatar.url ?? null) : null,
      profileBadge: u.profileBadge ?? null,
      affiliations: (u.affiliations ?? []) as string[],
      bio: u.bio ?? null,
      galleryUrls,
      sharedProjects,
    }
  })

  return people
    .sort(
      (a, b) =>
        b.sharedProjects.length - a.sharedProjects.length ||
        a.name.localeCompare(b.name, 'de'),
    )
    .slice(0, RESULT_LIMIT)
}
