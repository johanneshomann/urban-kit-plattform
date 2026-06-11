import type React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveColorScheme, schemeToCssVars } from '@/lib/colorScheme'

/**
 * Scopes the project's colour scheme to the whole `[slug]` subtree — the
 * project dashboard AND its module subpages (`m/[moduleType]`) — by setting
 * the `--project-*` CSS variables on a wrapper. Children theme themselves via
 * `var(--project-*)`. The page itself still does `notFound()` handling.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params

  let colorScheme: string | null = null
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    colorScheme = (result.docs[0] as { colorScheme?: string | null } | undefined)?.colorScheme ?? null
  } catch {
    // fall through to default scheme
  }

  const cssVars = schemeToCssVars(resolveColorScheme(colorScheme))

  return <div style={cssVars as React.CSSProperties}>{children}</div>
}
