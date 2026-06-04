import Link from 'next/link'

interface NewsPost {
  id: string
  title: string
  slug: string
  publishedAt?: string
  visibility?: string
}

interface NewsListProps {
  posts: NewsPost[]
  basePath: string
}

export function NewsList({ posts, basePath }: NewsListProps) {
  if (posts.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">Noch keine Beiträge.</p>
  }

  return (
    <ul className="divide-y">
      {posts.map((post) => (
        <li key={post.id} className="py-4">
          <Link href={`${basePath}/${post.slug}`} className="hover:underline font-medium">
            {post.title}
          </Link>
          {post.publishedAt && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(post.publishedAt).toLocaleDateString('de-DE')}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
