'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { emitNotification } from '@/lib/events'

export type JoinRequestState = { success?: boolean; error?: string } | null

export async function submitJoinRequest(
  _prev: JoinRequestState,
  formData: FormData,
): Promise<JoinRequestState> {
  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  if (!projectId || !name || !email) return { error: 'Bitte alle Pflichtfelder ausfüllen.' }

  try {
    const payload = await getPayload({ config })

    // Find project managers to notify
    const pms = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: projectId } }, { role: { equals: 'PM' } }] },
      overrideAccess: true,
    })

    for (const pm of pms.docs) {
      const pmData = pm as unknown as { user?: string | { id: string } }
      const userId = typeof pmData.user === 'string' ? pmData.user : pmData.user?.id
      if (userId) {
        await emitNotification({
          type: 'join_request',
          userId,
          reference: { collection: 'projects', id: projectId },
        })
      }
    }

    return { success: true }
  } catch {
    return { error: 'Fehler beim Senden der Anfrage. Bitte versuche es erneut.' }
  }
}
