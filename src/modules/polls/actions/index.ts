// NOT a 'use server' module on purpose: closePoll takes its acting user as an
// argument (payloadAs), so exposing it as a callable server-action endpoint
// would let clients forge the identity. Its only caller is the guarded
// closeProjectPoll action (src/actions/manage/polls.ts), server-side.

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity, emitNotification } from '@/lib/events'
import type { User } from '@/payload-types'

export async function closePoll(user: User, pollId: string, projectId: string) {
  const payload = await getPayload({ config })
  const poll = await payload.update({
    collection: 'polls',
    id: pollId,
    data: { status: 'closed' },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'poll.closed', userId: String(user.id), projectId, reference: { collectionSlug: 'polls', id: pollId } })
  await emitNotification({ type: 'poll_closed', userId: String(user.id), reference: { collectionSlug: 'polls', id: pollId } })
  return poll
}
