'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export type AuthState = { error?: string } | null

async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('payload-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
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
      data: { firstName, lastName },
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
  cookieStore.delete('payload-token')
  const locale = await getLocale()
  redirect(`/${locale}/login`)
}
