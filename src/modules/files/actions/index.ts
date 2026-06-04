'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity } from '@/lib/events'
import type { User } from '@/payload-types'

export async function createFolder(user: User, data: {
  name: string
  parentId?: string
  projectId: string
  visibility?: 'PUBLIC' | 'INTERNAL' | 'TEAM'
}) {
  const payload = await getPayload({ config })
  const folder = await payload.create({
    collection: 'folders',
    data: {
      name: data.name,
      parent: data.parentId,
      project: data.projectId,
      visibility: data.visibility ?? 'INTERNAL',
    },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'files.folder_created', userId: String(user.id), projectId: data.projectId, reference: { collection: 'folders', id: String(folder.id) } })
  return folder
}
