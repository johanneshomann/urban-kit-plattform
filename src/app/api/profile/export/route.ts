// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'

/**
 * DSGVO self-service export: the logged-in user downloads their own profile
 * data plus memberships as a JSON file. Only whitelisted fields are included —
 * never the whole user doc (auth internals, role, …).
 */
export async function GET() {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 })

  const payload = await getPayload({ config })

  // Resolve avatar + gallery media to URLs (may arrive populated or as ids).
  const mediaIds: string[] = []
  const idOf = (img: unknown): string | null =>
    typeof img === 'object' && img !== null ? String((img as { id: string }).id) : img ? String(img) : null
  const avatarId = idOf(user.avatar)
  if (avatarId) mediaIds.push(avatarId)
  const galleryIds = (Array.isArray(user.gallery) ? user.gallery : [])
    .map((g) => idOf(g.image))
    .filter((id): id is string => id !== null)
  mediaIds.push(...galleryIds)

  const urlById: Record<string, string> = {}
  if (mediaIds.length > 0) {
    const mediaRes = await payload.find({
      collection: 'media',
      where: { id: { in: mediaIds } },
      limit: mediaIds.length,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of mediaRes.docs) {
      if (doc.url) urlById[String(doc.id)] = doc.url
    }
  }

  const membershipsRes = await payload.find({
    collection: 'project-memberships',
    where: { user: { equals: user.id } },
    depth: 1,
    limit: 100,
    overrideAccess: true,
  })
  const memberships = membershipsRes.docs.map((m) => ({
    project: (m.project as { title?: string } | undefined)?.title ?? null,
    role: m.role ?? null,
    status: m.status ?? null,
    starred: m.starred ?? false,
    since: m.createdAt,
  }))

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      bio: user.bio ?? null,
      gender: user.gender ?? null,
      birthYear: user.birthYear ?? null,
      stadtbereich: user.stadtbereich ?? null,
      affiliations: user.affiliations ?? [],
      cityInfo: user.cityInfo ?? null,
      profileBadge: user.profileBadge ?? null,
      settings: user.settings ?? null,
      avatarUrl: avatarId ? (urlById[avatarId] ?? null) : null,
      galleryUrls: galleryIds.map((id) => urlById[id]).filter(Boolean),
      registeredAt: user.createdAt,
    },
    memberships,
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="urbankit-profil-export.json"',
    },
  })
}
