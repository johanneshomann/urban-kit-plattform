'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { createNewsPost, deleteNewsPost } from '@/modules/news/actions'
import { uniqueSlug } from '@/lib/slugify'

export type NewsActionState = { error?: string; ok?: boolean }

function revalidateNews(locale: string, slug: string) {
  const manage = `/${locale}/dashboard/projekte/${slug}/manage/inhalte/news`
  revalidatePath(manage)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
}

export async function createProjectNewsPost(
  slug: string,
  locale: string,
  input: { title: string; visibility?: string },
): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  const postSlug = uniqueSlug(title, 'news')
  try {
    await createNewsPost(ctx.user, {
      title,
      slug: postSlug,
      projectId: ctx.project.id,
      visibility: input.visibility,
    })
  } catch {
    return { error: 'Beitrag konnte nicht erstellt werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function deleteProjectNewsPost(
  slug: string,
  locale: string,
  postId: string,
): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  // Verify the post belongs to this project before deleting (the collection's
  // delete access is only `isAuthenticated`, so we enforce ownership here).
  const payload = await getPayload({ config })
  const post = await payload.findByID({ collection: 'news-posts', id: postId, depth: 0, overrideAccess: true }).catch(() => null)
  const postProjectId = post && typeof post.project === 'object' ? post.project?.id : post?.project
  if (!post || String(postProjectId) !== String(ctx.project.id)) {
    return { error: 'Beitrag nicht gefunden.' }
  }

  try {
    await deleteNewsPost(ctx.user, postId)
  } catch {
    return { error: 'Beitrag konnte nicht gelöscht werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}
