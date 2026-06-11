import path from 'path'
import type { Payload } from 'payload'

/**
 * Default project images, materialised as real Media documents so they can be
 * used as actual field `defaultValue`s on the Projects collection (upload
 * fields store a Media id, not a path). The source files live in
 * `public/defaults/` and are uploaded into Media once, then reused.
 *
 * Idempotent: each default is keyed by a sentinel `alt` marker, so repeated
 * calls find the existing doc instead of creating duplicates.
 */

const DEFAULTS_DIR = 'public/defaults'

const SENTINEL_PREFIX = '__urbankit_default__:'

interface DefaultMediaSpec {
  key: string
  file: string
}

const DEFAULT_MEDIA: DefaultMediaSpec[] = [
  { key: 'cover', file: 'project-cover.jpg' },
  { key: 'gallery-1', file: 'default-1.jpg' },
  { key: 'gallery-2', file: 'default-2.jpg' },
  { key: 'gallery-3', file: 'default-3.jpg' },
  { key: 'gallery-4', file: 'default-4.jpg' },
  { key: 'gallery-5', file: 'default-5.jpg' },
]

export const DEFAULT_GALLERY_KEYS = ['gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5']

let cache: Promise<Record<string, string>> | null = null

async function build(payload: Payload): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}

  for (const { key, file } of DEFAULT_MEDIA) {
    const alt = `${SENTINEL_PREFIX}${key}`

    const existing = await payload.find({
      collection: 'media',
      where: { alt: { equals: alt } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      ids[key] = String(existing.docs[0].id)
      continue
    }

    const created = await payload.create({
      collection: 'media',
      data: { alt, visibility: 'PUBLIC' },
      filePath: path.join(process.cwd(), DEFAULTS_DIR, file),
      overrideAccess: true,
    })
    ids[key] = String(created.id)
  }

  return ids
}

/**
 * Returns a map of default-media key → Media document id, creating the docs on
 * first call. The resolved promise is cached so concurrent field `defaultValue`
 * resolutions (cover + gallery on the same create form) share one build and
 * never race to create duplicates. The cache resets on server restart.
 */
export function ensureDefaultMedia(payload: Payload): Promise<Record<string, string>> {
  if (!cache) {
    cache = build(payload).catch((err) => {
      cache = null // allow a retry on the next create
      throw err
    })
  }
  return cache
}
