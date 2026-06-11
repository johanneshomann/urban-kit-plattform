import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'app.urbankit.de'
  const pathname = request.nextUrl.pathname

  // Payload admin and API routes — skip middleware entirely
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // app.urbankit.de: workspace routes — no rewrite needed, (platform) is a route group with no URL segment
  if (host === appDomain) {
    // intentionally left empty; routes are directly at /[locale]/dashboard, /[locale]/login etc.
  }

  // Public portal routes: set CDN cache headers
  const response = intlMiddleware(request)
  if (response) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  }
  return response
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
