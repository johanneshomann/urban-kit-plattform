import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const entries: MetadataRoute.Sitemap = []

  for (const locale of ['de', 'en']) {
    entries.push(
      { url: `${base}/${locale}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
      { url: `${base}/${locale}/projekte`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${base}/${locale}/grundlagen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/${locale}/zusammenarbeit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/${locale}/mitmachen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/${locale}/impressum`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    )
  }

  try {
    const payload = await getPayload({ config })

    const projects = await payload.find({
      collection: 'projects',
      where: { isPublic: { equals: true } },
      limit: 200,
      overrideAccess: true,
    })

    for (const project of projects.docs) {
      const p = project as unknown as { slug: string; updatedAt: string }
      for (const locale of ['de', 'en']) {
        entries.push({
          url: `${base}/${locale}/projekte/${p.slug}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    const newsPosts = await payload.find({
      collection: 'news-posts',
      where: { and: [{ visibility: { equals: 'PUBLIC' } }, { publishedAt: { exists: true } }] },
      limit: 1000,
      overrideAccess: true,
    })

    for (const post of newsPosts.docs) {
      const p = post as unknown as { slug: string; updatedAt: string; projectModule?: { project?: { slug?: string } } }
      const projectSlug = p.projectModule?.project?.slug
      if (!projectSlug) continue
      for (const locale of ['de', 'en']) {
        entries.push({
          url: `${base}/${locale}/projekte/${projectSlug}/news/${p.slug}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  } catch {
    // DB unavailable during static build
  }

  return entries
}
