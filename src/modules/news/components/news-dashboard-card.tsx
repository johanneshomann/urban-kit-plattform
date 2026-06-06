import Link from 'next/link'

interface NewsPost { id: string; title: string; slug: string; publishedAt?: string }

export function NewsDashboardCard({ posts, projectSlug, locale }: {
  posts: NewsPost[]
  projectSlug: string
  locale: string
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">News</h3>
        <Link href={`/${locale}/platform/dashboard/projekte/${projectSlug}/m/news`} className="text-xs text-blue-600 hover:underline">
          Alle →
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-xs text-gray-400">Keine Beiträge</p>
      ) : (
        <ul className="space-y-1">
          {posts.slice(0, 5).map((p) => (
            <li key={p.id} className="text-sm truncate">{p.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
