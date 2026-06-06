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
  redirect(`/${locale}/platform/dashboard`)
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
    redirect(`/${locale}/platform/login`)
  }

  if (token) {
    await setTokenCookie(token)
  }

  const locale = await getLocale()
  redirect(`/${locale}/platform/dashboard`)
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')
  const locale = await getLocale()
  redirect(`/${locale}/platform/login`)
}
