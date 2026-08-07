'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export type AuthState = { error?: string; appUrl?: string } | null

const appDomain = () => process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'app.urbankit.de'

// Session must be valid on both urbankit.de and app.urbankit.de, so the cookie
// is scoped to the parent domain in production (host-only on localhost).
function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  return `.${appDomain().replace(/^app\./, '')}`
}

async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('payload-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    domain: cookieDomain(),
  })
}

/** True when the request is served from the public portal domain (not the app domain, not dev). */
async function isPublicPortalHost(): Promise<boolean> {
  const host = ((await headers()).get('host') ?? '').split(':')[0]
  const publicDomain = appDomain().replace(/^app\./, '')
  return host === publicDomain || host === `www.${publicDomain}`
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const payload = await getPayload({ config })

  let token: string | undefined
  let isAdmin = false
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    token = result.token
    isAdmin = result.user?.role === 'admin'
  } catch {
    return { error: 'Ungültige Anmeldedaten' }
  }

  if (token) {
    await setTokenCookie(token)
  }

  // Admins belong in the CMS backend, not the citizen workspace. The admin UI
  // has no locale prefix and is exempt from the domain split (middleware skips
  // /admin), so the same relative redirect works on both hosts.
  if (isAdmin) {
    redirect('/admin')
  }

  const locale = await getLocale()

  // On the public portal the workspace opens on the app domain in a new tab
  // (cookie is parent-domain-scoped, so the new tab is already logged in).
  if (await isPublicPortalHost()) {
    return { appUrl: `https://${appDomain()}/${locale}/dashboard` }
  }

  redirect(`/${locale}/dashboard`)
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'users',
      data: { email, password },
      overrideAccess: true,
    })
  } catch {
    return { error: 'Registrierung fehlgeschlagen. E-Mail bereits vergeben?' }
  }

  // Auto-login after registration
  let token: string | undefined
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    token = result.token
  } catch {
    // If auto-login fails, send to login page
    const locale = await getLocale()
    redirect(`/${locale}/login`)
  }

  if (token) {
    await setTokenCookie(token)
  }

  const locale = await getLocale()
  redirect(`/${locale}/dashboard`)
}

export async function updateProfileAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const newPassword = formData.get('newPassword') as string
  const currentPassword = formData.get('currentPassword') as string

  const AFFILIATIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const
  type Affiliation = (typeof AFFILIATIONS)[number]
  const affiliations = formData
    .getAll('affiliations')
    .filter((v): v is Affiliation => AFFILIATIONS.includes(v as Affiliation))
  const cityInfo = affiliations.includes('cityEmployee')
    ? {
        organization: ((formData.get('cityOrganization') as string) || '').trim() || null,
        fachbereich: ((formData.get('cityFachbereich') as string) || '').trim() || null,
        position: ((formData.get('cityPosition') as string) || '').trim() || null,
      }
    : { organization: null, fachbereich: null, position: null }

  // Voluntary demographics — validate against the collection's option lists,
  // anything else (incl. empty) stores null.
  const GENDERS = ['female', 'male', 'diverse', 'noAnswer'] as const
  const STADTBEREICHE = ['innenstadt', 'norden', 'sueden', 'osten', 'westen'] as const
  const genderRaw = (formData.get('gender') as string) || ''
  const gender = (GENDERS as readonly string[]).includes(genderRaw) ? (genderRaw as (typeof GENDERS)[number]) : null
  const stadtbereichRaw = (formData.get('stadtbereich') as string) || ''
  const stadtbereich = (STADTBEREICHE as readonly string[]).includes(stadtbereichRaw)
    ? (stadtbereichRaw as (typeof STADTBEREICHE)[number])
    : null
  const BADGES = ['star', 'heart', 'sparkles', 'leaf', 'sun', 'flower', 'rocket', 'music', 'camera', 'book', 'bike', 'paw'] as const
  const badgeRaw = (formData.get('profileBadge') as string) || ''
  const profileBadge = (BADGES as readonly string[]).includes(badgeRaw) ? (badgeRaw as (typeof BADGES)[number]) : null
  const birthYearRaw = parseInt((formData.get('birthYear') as string) || '', 10)
  const birthYear =
    Number.isFinite(birthYearRaw) && birthYearRaw >= 1900 && birthYearRaw <= new Date().getFullYear()
      ? birthYearRaw
      : null

  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return { error: 'Nicht eingeloggt' }

  const payload = await getPayload({ config })

  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return { error: 'Nicht eingeloggt' }

  const bio = ((formData.get('bio') as string) || '').trim().slice(0, 1000) || null

  // Personal gallery: `galleryKeep` lists the media ids of existing images the
  // user kept, `galleryImages` carries newly picked files. Everything that was
  // in the gallery but not kept gets its media doc deleted afterwards.
  const galleryKeep = (formData.getAll('galleryKeep') as string[]).filter(Boolean)
  const galleryFiles = formData.getAll('galleryImages').filter((f): f is File => f instanceof File && f.size > 0)
  const previousGalleryIds = (Array.isArray(me.user.gallery) ? me.user.gallery : [])
    .map((g) => (typeof g.image === 'object' && g.image ? String(g.image.id) : g.image ? String(g.image) : null))
    .filter((id): id is string => id !== null)
  if (galleryKeep.length + galleryFiles.length > 12) return { error: 'Maximal 12 Bilder in der Galerie.' }
  for (const f of galleryFiles) {
    if (!f.type.startsWith('image/')) return { error: 'Nur Bilddateien sind erlaubt.' }
    if (f.size > 5 * 1024 * 1024) return { error: 'Bild ist zu groß (max. 5 MB).' }
  }

  // Profile picture: replace (upload new media doc) or remove. The previous
  // avatar media doc is deleted on both paths — it is only ever referenced by
  // this user.
  const avatarFile = formData.get('avatar')
  const removeAvatar = formData.get('removeAvatar') === '1'
  const previousAvatarId =
    typeof me.user.avatar === 'object' && me.user.avatar ? String(me.user.avatar.id) : me.user.avatar ? String(me.user.avatar) : null
  let avatarUpdate: { avatar?: string | null } = {}
  if (removeAvatar) {
    avatarUpdate = { avatar: null }
  } else if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith('image/')) return { error: 'Nur Bilddateien sind erlaubt.' }
    if (avatarFile.size > 5 * 1024 * 1024) return { error: 'Bild ist zu groß (max. 5 MB).' }
    try {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: [firstName, lastName].filter(Boolean).join(' ') || me.user.email,
          visibility: 'PUBLIC',
          uploadedBy: me.user.id,
        },
        file: {
          data: Buffer.from(await avatarFile.arrayBuffer()),
          mimetype: avatarFile.type,
          name: avatarFile.name,
          size: avatarFile.size,
        },
        overrideAccess: true,
      })
      avatarUpdate = { avatar: String(media.id) }
    } catch {
      return { error: 'Bild konnte nicht hochgeladen werden.' }
    }
  }

  // Upload new gallery images, then assemble kept + new (order: kept first).
  const newGalleryIds: string[] = []
  for (const f of galleryFiles) {
    try {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: [firstName, lastName].filter(Boolean).join(' ') || me.user.email,
          visibility: 'PUBLIC',
          uploadedBy: me.user.id,
        },
        file: { data: Buffer.from(await f.arrayBuffer()), mimetype: f.type, name: f.name, size: f.size },
        overrideAccess: true,
      })
      newGalleryIds.push(String(media.id))
    } catch {
      return { error: 'Bild konnte nicht hochgeladen werden.' }
    }
  }
  const keptIds = galleryKeep.filter((id) => previousGalleryIds.includes(id))
  const gallery = [...keptIds, ...newGalleryIds].map((id) => ({ image: id }))

  try {
    await payload.update({
      collection: 'users',
      id: me.user.id,
      data: { firstName, lastName, bio, affiliations, cityInfo, gender, birthYear, stadtbereich, profileBadge, gallery, ...avatarUpdate },
      overrideAccess: true,
    })
  } catch {
    return { error: 'Speichern fehlgeschlagen.' }
  }

  // Clean up replaced/removed media files (best effort).
  if (previousAvatarId && avatarUpdate.avatar !== undefined && avatarUpdate.avatar !== previousAvatarId) {
    await payload.delete({ collection: 'media', id: previousAvatarId, overrideAccess: true }).catch(() => {})
  }
  for (const removedId of previousGalleryIds.filter((id) => !keptIds.includes(id))) {
    await payload.delete({ collection: 'media', id: removedId, overrideAccess: true }).catch(() => {})
  }

  if (newPassword) {
    if (!currentPassword) return { error: 'Bitte aktuelles Passwort eingeben.' }
    try {
      await payload.login({ collection: 'users', data: { email: me.user.email, password: currentPassword } })
      await payload.update({ collection: 'users', id: me.user.id, data: { password: newPassword }, overrideAccess: true })
    } catch {
      return { error: 'Aktuelles Passwort falsch.' }
    }
  }

  return null
}

/**
 * Permanently delete the own account: all project memberships (any status),
 * avatar/gallery media, then the user doc itself. Refused while the user still
 * manages a project — the project would be left without a PM. Ends the session
 * and redirects to the login page on success.
 */
export async function deleteAccountAction(): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return { error: 'Nicht eingeloggt' }

  const payload = await getPayload({ config })
  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return { error: 'Nicht eingeloggt' }

  const pmMemberships = await payload.find({
    collection: 'project-memberships',
    where: {
      and: [{ user: { equals: me.user.id } }, { role: { equals: 'PM' } }, { status: { equals: 'active' } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (pmMemberships.totalDocs > 0) {
    return { error: 'Als Projektmanager:in können Sie Ihr Konto nicht löschen. Übergeben Sie zuerst die Projektleitung.' }
  }

  // Collect the user's own media (avatar + gallery) for cleanup after deletion.
  const avatarId =
    typeof me.user.avatar === 'object' && me.user.avatar ? String(me.user.avatar.id) : me.user.avatar ? String(me.user.avatar) : null
  const galleryIds = (Array.isArray(me.user.gallery) ? me.user.gallery : [])
    .map((g) => (typeof g.image === 'object' && g.image ? String(g.image.id) : g.image ? String(g.image) : null))
    .filter((id): id is string => id !== null)

  try {
    await payload.delete({
      collection: 'project-memberships',
      where: { user: { equals: me.user.id } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'users', id: me.user.id, overrideAccess: true })
  } catch {
    return { error: 'Konto konnte nicht gelöscht werden.' }
  }

  // Media cleanup is best effort — the account itself is already gone.
  for (const mediaId of [avatarId, ...galleryIds].filter((id): id is string => id !== null)) {
    await payload.delete({ collection: 'media', id: mediaId, overrideAccess: true }).catch(() => {})
  }

  cookieStore.delete({ name: 'payload-token', domain: cookieDomain(), path: '/' })
  cookieStore.delete('payload-token')
  const locale = await getLocale()
  redirect(`/${locale}/login`)
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  // Clear both the parent-domain cookie and any legacy host-only cookie
  cookieStore.delete({ name: 'payload-token', domain: cookieDomain(), path: '/' })
  cookieStore.delete('payload-token')
  const locale = await getLocale()
  redirect(`/${locale}/login`)
}
