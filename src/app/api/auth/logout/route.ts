// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { clearSessionCookieHeaders } from '@/lib/auth/session-cookie'

/**
 * Logout endpoint for the plain HTML forms in DashboardTopBar / PublicNav.
 * A route handler (not a server action) because it must send TWO Set-Cookie
 * headers — the parent-domain session cookie and a host-only variant — which
 * the name-keyed `cookies()` store of server actions cannot express.
 *
 *   POST /api/auth/logout?locale=de&to=portal|login
 */
export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const locale = (routing.locales as readonly string[]).includes(sp.get('locale') ?? '') ? sp.get('locale')! : routing.defaultLocale
  const target = sp.get('to') === 'login' ? `/${locale}/login` : `/${locale}`

  // Behind the reverse proxy req.nextUrl.origin is the container's internal
  // address (localhost:3000) — rebuild the public origin from the proxy headers
  // so the user lands on the host they logged out from (portal or app domain).
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : req.nextUrl.protocol.replace(':', ''))
  const res = NextResponse.redirect(`${proto}://${host}${target}`, 303)
  for (const header of clearSessionCookieHeaders()) res.headers.append('Set-Cookie', header)
  return res
}
