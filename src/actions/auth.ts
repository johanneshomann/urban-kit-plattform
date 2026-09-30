// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload, UnverifiedEmail } from 'payload'
import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { emailVerificationEnabled } from '@/lib/email'
import { getDemoAccounts, isRegistrationEnabled } from '@/lib/prototype-notice'
import { SESSION_COOKIE, appDomain, sessionCookieDomain } from '@/lib/auth/session-cookie'
import { isDemoSession } from '@/lib/auth/demo'
import { actionError } from '@/lib/action-errors'

export type AuthState = { error?: string; appUrl?: string; verifySent?: boolean } | null

// Session must be valid on both urbankit.de and app.urbankit.de, so the cookie
// is scoped to the parent domain in production (host-only on localhost).
// Clearing lives in /api/auth/logout — see src/lib/auth/session-cookie.ts.
async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    domain: sessionCookieDomain(),
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
  } catch (err) {
    // Correct credentials on a not-yet-activated account — say so instead of
    // pretending the password is wrong.
    if (err instanceof UnverifiedEmail) {
      return actionError('emailUnverified')
    }
    return actionError('invalidCredentials')
  }

  return finishLogin(token, isAdmin)
}

/** Shared tail of every login flow: set the session cookie, then route to admin / workspace. */
async function finishLogin(token: string | undefined, isAdmin: boolean): Promise<AuthState> {
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

/**
 * One-click login into a public prototype demo account. Only accounts listed
 * in platform-settings AND flagged isDemo are eligible (getDemoAccounts
 * validates both), so this can never log anyone into a real account.
 */
export async function demoLoginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').toLowerCase()
  const locale = await getLocale()
  const account = (await getDemoAccounts(locale)).find((a) => a.email.toLowerCase() === email)
  if (!account) return actionError('demoUnavailable')

  const payload = await getPayload({ config })
  let token: string | undefined
  try {
    const result = await payload.login({ collection: 'users', data: { email: account.email, password: account.password } })
    token = result.token
  } catch {
    return actionError('demoLoginFailed')
  }
  return finishLogin(token, false)
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await isRegistrationEnabled())) return actionError('registrationDisabled')
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  if (!firstName || !lastName) return actionError('nameFieldsRequired')
  if (password !== passwordConfirm) return actionError('passwordMismatch')

  const payload = await getPayload({ config })
  const data = { email, password, firstName, lastName }

  // Find an existing account for this address that was never verified.
  // `_verified` is a hidden auth field — it only appears with showHiddenFields.
  const findUnverified = async (): Promise<string | null> => {
    try {
      const res = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true })
      const doc = res.docs[0] as { id: string | number; _verified?: boolean | null } | undefined
      return doc && doc._verified === false ? String(doc.id) : null
    } catch {
      return null
    }
  }

  try {
    await payload.create({ collection: 'users', data, overrideAccess: true })
  } catch (err) {
    // Payload rejects duplicate/invalid emails with a ValidationError. Any
    // OTHER failure is typically the activation mail refusing to send AFTER
    // the account was written — that must not masquerade as "email taken".
    if ((err as Error)?.name !== 'ValidationError') {
      // Roll back the half-created account so a retry starts clean.
      const half = await findUnverified()
      if (half) await payload.delete({ collection: 'users', id: half, overrideAccess: true }).catch(() => {})
      return actionError('verificationMailFailed')
    }
    // A never-activated leftover doesn't block the address (its mail may
    // simply never have arrived) — replace it and send a fresh activation.
    const stale = await findUnverified()
    if (!stale) return actionError('emailTakenOrInvalid')
    try {
      await payload.delete({ collection: 'users', id: stale, overrideAccess: true })
      await payload.create({ collection: 'users', data, overrideAccess: true })
    } catch {
      return actionError('registrationFailed')
    }
  }

  // With verification on, the account can't log in until the activation
  // mail is clicked — show the "check your inbox" state instead.
  if (emailVerificationEnabled) return { verifySent: true }

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
  if (await isDemoSession()) return actionError('demoReadOnly')
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
  if (!token) return actionError('notLoggedIn')

  const payload = await getPayload({ config })

  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return actionError('notLoggedIn')

  const bio = ((formData.get('bio') as string) || '').trim().slice(0, 1000) || null

  // Personal gallery: `galleryKeep` lists the media ids of existing images the
  // user kept, `galleryImages` carries newly picked files. Everything that was
  // in the gallery but not kept gets its media doc deleted afterwards.
  const galleryKeep = (formData.getAll('galleryKeep') as string[]).filter(Boolean)
  const galleryFiles = formData.getAll('galleryImages').filter((f): f is File => f instanceof File && f.size > 0)
  const previousGalleryIds = (Array.isArray(me.user.gallery) ? me.user.gallery : [])
    .map((g) => (typeof g.image === 'object' && g.image ? String(g.image.id) : g.image ? String(g.image) : null))
    .filter((id): id is string => id !== null)
  if (galleryKeep.length + galleryFiles.length > 12) return actionError('galleryMax')
  for (const f of galleryFiles) {
    if (!f.type.startsWith('image/')) return actionError('imagesOnly')
    if (f.size > 5 * 1024 * 1024) return actionError('imageTooLarge5')
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
    if (!avatarFile.type.startsWith('image/')) return actionError('imagesOnly')
    if (avatarFile.size > 5 * 1024 * 1024) return actionError('imageTooLarge5')
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
      return actionError('imageUploadFailed')
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
      return actionError('imageUploadFailed')
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
    return actionError('saveFailed')
  }

  // Clean up replaced/removed media files (best effort).
  if (previousAvatarId && avatarUpdate.avatar !== undefined && avatarUpdate.avatar !== previousAvatarId) {
    await payload.delete({ collection: 'media', id: previousAvatarId, overrideAccess: true }).catch(() => {})
  }
  for (const removedId of previousGalleryIds.filter((id) => !keptIds.includes(id))) {
    await payload.delete({ collection: 'media', id: removedId, overrideAccess: true }).catch(() => {})
  }

  if (newPassword) {
    if (!currentPassword) return actionError('currentPasswordRequired')
    try {
      await payload.login({ collection: 'users', data: { email: me.user.email, password: currentPassword } })
      await payload.update({ collection: 'users', id: me.user.id, data: { password: newPassword }, overrideAccess: true })
    } catch {
      return actionError('currentPasswordWrong')
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
  if (await isDemoSession()) return actionError('demoReadOnly')
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return actionError('notLoggedIn')

  const payload = await getPayload({ config })
  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return actionError('notLoggedIn')

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
    return actionError('pmCannotDeleteAccount')
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
    return actionError('accountDeleteFailed')
  }

  // Media cleanup is best effort — the account itself is already gone.
  for (const mediaId of [avatarId, ...galleryIds].filter((id): id is string => id !== null)) {
    await payload.delete({ collection: 'media', id: mediaId, overrideAccess: true }).catch(() => {})
  }

  // The user doc is gone, so any remaining cookie is a dead token; clear the
  // primary (domain) variant here, the login page copes with stale ones.
  cookieStore.delete({ name: SESSION_COOKIE, domain: sessionCookieDomain(), path: '/' })
  const locale = await getLocale()
  redirect(`/${locale}/login`)
}
