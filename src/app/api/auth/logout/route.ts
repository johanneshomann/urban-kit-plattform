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

  const res = NextResponse.redirect(new URL(target, req.nextUrl.origin), 303)
  for (const header of clearSessionCookieHeaders()) res.headers.append('Set-Cookie', header)
  return res
}
