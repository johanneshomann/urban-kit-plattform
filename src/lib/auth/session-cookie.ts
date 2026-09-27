// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * The `payload-token` session cookie is scoped to the parent domain in
 * production (`.urbankit.de`) so one login is valid on both hosts.
 *
 * Clearing it is the tricky part: Next's `cookies()` response store is keyed
 * by cookie NAME, so two `delete()` calls for the same name overwrite each
 * other and only the last one reaches the browser — that is how the logout
 * once "worked" but left the domain cookie alive. Clearing therefore happens
 * in a route handler (`/api/auth/logout`) that appends one Set-Cookie header
 * per variant via `clearSessionCookieHeaders()`.
 */
export const SESSION_COOKIE = 'payload-token'

export const appDomain = () => process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'app.urbankit.de'

/** Parent domain in production (`.urbankit.de`); host-only (undefined) elsewhere. */
export function sessionCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  return `.${appDomain().replace(/^app\./, '')}`
}

/**
 * One expiring Set-Cookie header per variant that may exist in the browser:
 * the parent-domain session cookie plus a legacy/Payload-admin host-only one.
 */
export function clearSessionCookieHeaders(): string[] {
  const base = `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  const domain = sessionCookieDomain()
  return domain ? [`${base}; Domain=${domain}`, base] : [base]
}
