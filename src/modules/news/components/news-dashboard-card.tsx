'use client'

import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'
import { relativeDay } from '@/lib/format-date'

export interface NewsCardPost {
  id: string
  title: string
  slug: string
  publishedAt?: string | null
  thumbUrl?: string | null
}

export function NewsDashboardCard({ posts, newCount, projectSlug, locale }: {
  posts: NewsCardPost[]
  newCount: number
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/news`

  return (
    <ModuleCardShell
      icon={Newspaper}
      title="News"
      badge={newCount > 0 ? { label: t('badgeNew', { count: newCount }) } : null}
      href={base}
      ctaLabel={t('ctaAllNews')}
    >
      {posts.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('emptyNews')}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`${base}/${post.slug}`} className="flex items-center gap-2.5 transition-opacity opacity-80 hover:opacity-100">
                {post.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbUrl} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-md shrink-0" style={{ background: 'var(--project-light)' }} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-small font-medium leading-snug line-clamp-1" style={{ color: 'var(--project-dark)' }}>{post.title}</span>
                  {post.publishedAt && <span className="block text-small" style={{ color: 'var(--project-mid)' }}>{relativeDay(post.publishedAt, locale)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleCardShell>
  )
}
