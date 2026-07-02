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
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    token = result.token
  } catch {
    return { error: 'Ungültige Anmeldedaten' }
  }

  if (token) {
    await setTokenCookie(token)
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

  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return { error: 'Nicht eingeloggt' }

  const payload = await getPayload({ config })

  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return { error: 'Nicht eingeloggt' }

  try {
    await payload.update({
      collection: 'users',
      id: me.user.id,
      data: { firstName, lastName, affiliations, cityInfo },
      overrideAccess: true,
    })
  } catch {
    return { error: 'Speichern fehlgeschlagen.' }
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

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  // Clear both the parent-domain cookie and any legacy host-only cookie
  cookieStore.delete({ name: 'payload-token', domain: cookieDomain(), path: '/' })
  cookieStore.delete('payload-token')
  const locale = await getLocale()
  redirect(`/${locale}/login`)
}
