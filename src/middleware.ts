import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Workspace routes live on the app domain; auth routes are reachable on both
// (login happens on the public portal, the workspace then opens on the app domain).
const PLATFORM_PREFIXES = ['/dashboard']
const AUTH_PREFIXES = ['/login', '/register']

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1)
  }
  return pathname
}

const matchesPrefix = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`))

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0]
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'app.urbankit.de'
  const publicDomain = appDomain.replace(/^app\./, '')
  const pathname = request.nextUrl.pathname

  // Payload admin and API routes — skip middleware entirely
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Domain separation only applies to the production hosts; localhost etc. serve everything.
  const isAppHost = host === appDomain
  const isPublicHost = host === publicDomain || host === `www.${publicDomain}`
  const path = stripLocale(pathname)

  // Public domain: workspace routes belong on the app domain
  if (isPublicHost && matchesPrefix(path, PLATFORM_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = appDomain
    url.port = ''
    return NextResponse.redirect(url)
  }

  if (isAppHost) {
    // Root of the app domain → straight to the dashboard (locale-aware)
    if (path === '/') {
      const url = request.nextUrl.clone()
      url.pathname = `${pathname === '/' ? '' : pathname}/dashboard`
      return NextResponse.redirect(url)
    }
    // Everything that is neither workspace nor auth belongs on the public portal
    if (!matchesPrefix(path, [...PLATFORM_PREFIXES, ...AUTH_PREFIXES])) {
      const url = request.nextUrl.clone()
      url.protocol = 'https:'
      url.host = publicDomain
      url.port = ''
      return NextResponse.redirect(url)
    }
  }

  const response = intlMiddleware(request)
  if (response && !isAppHost) {
    // CDN cache headers for the public portal only — never for the logged-in workspace
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  }
  return response
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
