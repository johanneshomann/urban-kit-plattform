import { getPayload } from 'payload'
import config from '@payload-config'

export interface ActivityEvent {
  type: string
  userId?: string
  projectId?: string
  reference?: { collection: string; id: string }
}

export interface NotificationEvent {
  type: 'invited' | 'task_assigned' | 'poll_closed' | 'join_request' | 'new_content'
  userId: string
  reference?: { collection: string; id: string }
}

export async function emitActivity(event: ActivityEvent): Promise<void> {
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'activity',
      data: {
        type: event.type,
        user: event.userId ?? undefined,
        project: event.projectId ?? undefined,
        reference: event.reference,
      },
      overrideAccess: true,
    })
  } catch {
    // Non-fatal: activity logging should never break the main flow
  }
}

export async function emitNotification(event: NotificationEvent): Promise<void> {
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'notifications',
      data: {
        type: event.type,
        user: event.userId,
        read: false,
        reference: event.reference,
      },
      overrideAccess: true,
    })
  } catch {
    // Non-fatal: notification creation should never break the main flow
  }
}
