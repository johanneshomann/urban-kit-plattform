import 'server-only'
import type { Payload } from 'payload'

/** Shared image-upload helpers for manage actions (cover, gallery, news image, …). */

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

export interface PayloadFile {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

/** Read + validate an uploaded image from FormData into Payload's file shape. */
export async function readImageFile(
  formData: FormData,
  key = 'file',
): Promise<{ file: PayloadFile } | { error: string }> {
  const f = formData.get(key)
  if (!(f instanceof File) || f.size === 0) return { error: 'Keine Datei ausgewählt.' }
  if (!f.type.startsWith('image/')) return { error: 'Nur Bilddateien sind erlaubt.' }
  if (f.size > MAX_IMAGE_BYTES) return { error: 'Bild ist zu groß (max. 12 MB).' }
  const data = Buffer.from(await f.arrayBuffer())
  return { file: { data, mimetype: f.type, name: f.name, size: f.size } }
}

/** Create a Media doc for a project upload, returning its id. */
export async function uploadProjectMedia(
  payload: Payload,
  opts: { projectId: string; userId: string; alt: string; visibility?: 'PUBLIC' | 'INTERNAL' | 'TEAM' },
  file: PayloadFile,
): Promise<string> {
  const media = await payload.create({
    collection: 'media',
    data: { alt: opts.alt, visibility: opts.visibility ?? 'PUBLIC', project: opts.projectId, uploadedBy: opts.userId },
    file,
    overrideAccess: true,
  })
  return String(media.id)
}
