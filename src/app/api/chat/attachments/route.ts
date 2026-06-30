import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/chat/route-auth'
import { readImageFile } from '@/lib/upload-media'

// POST (multipart) — upload a chat image attachment → media doc. Returns its id + url.
export async function POST(req: NextRequest) {
  const a = await authUser(req)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const read = await readImageFile(formData)
  if ('error' in read) return NextResponse.json({ error: read.error }, { status: 400 })

  const media = await payload.create({
    collection: 'media',
    data: { alt: read.file.name, visibility: 'INTERNAL', uploadedBy: userId },
    file: read.file,
    overrideAccess: true,
  })
  return NextResponse.json({ id: String(media.id), url: media.url ?? null })
}
