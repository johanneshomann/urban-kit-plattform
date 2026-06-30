import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ChevronRight, Newspaper } from 'lucide-react'
import { visibilityWhere, type ViewerTier } from '@/lib/visibility'

/** Citizen-facing list of visible, published news posts for a project. */
export async function NewsFeed({ slug, locale, projectId, tier }: { slug: string; locale: string; projectId: string; tier: ViewerTier }) {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const res = await payload.find({
    collection: 'news-posts',
    where: { and: [{ project: { equals: projectId } }, { publishedAt: { less_than_equal: now } }, visibilityWhere(tier)] },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  return (
    <div>
      <h1 className="text-title font-bold leading-tight mb-6" style={{ color: 'var(--project-dark)' }}>News</h1>
      {res.docs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
          <Newspaper className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.5 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Noch keine Beiträge.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {res.docs.map((doc) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = doc as any
            const img = p.featuredImage && typeof p.featuredImage === 'object' ? p.featuredImage.url : null
            return (
              <Link key={p.id} href={`/${locale}/dashboard/projekte/${slug}/m/news/${p.slug}`}
                className="flex items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
                style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
                {img && <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-display font-semibold leading-snug truncate" style={{ color: 'var(--project-dark)' }}>{p.title}</p>
                  {p.publishedAt && <p className="text-small mt-1" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{new Date(p.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                </div>
                <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--project-mid)' }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
