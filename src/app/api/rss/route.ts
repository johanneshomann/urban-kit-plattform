import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const { searchParams } = req.nextUrl
  const projectSlug = searchParams.get('project')

  const instanceName = 'UrbanKIT'
  let posts: { title: string; slug: string; publishedAt: string; projectModule?: { project?: { slug?: string; title?: string } } }[] = []

  try {
    const payload = await getPayload({ config })

    const andClauses: Where[] = [
      { visibility: { equals: 'PUBLIC' } },
      { publishedAt: { exists: true } },
    ]

    if (projectSlug) {
      andClauses.push({ 'projectModule.project.slug': { equals: projectSlug } })
    }

    const where: Where = { and: andClauses }

    const result = await payload.find({
      collection: 'news-posts',
      where,
      sort: '-publishedAt',
      limit: 50,
      overrideAccess: true,
    })
    posts = result.docs as unknown as typeof posts
  } catch {
    // Return empty feed if DB unavailable
  }

  const feedTitle = projectSlug ? `${instanceName} – ${projectSlug} News` : `${instanceName} – Neuigkeiten`
  const feedLink = projectSlug ? `${base}/de/projekte/${projectSlug}` : `${base}/de`

  const items = posts
    .map((p) => {
      const pSlug = p.projectModule?.project?.slug
      if (!pSlug) return ''
      const link = `${base}/de/projekte/${pSlug}/news/${p.slug}`
      return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${feedTitle}]]></title>
    <link>${feedLink}</link>
    <description><![CDATA[Öffentliche Neuigkeiten auf ${instanceName}]]></description>
    <language>de</language>
    <atom:link href="${base}/api/rss${projectSlug ? `?project=${projectSlug}` : ''}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
