// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// NOT a 'use server' module on purpose: closePoll takes its acting user as an
// argument (payloadAs), so exposing it as a callable server-action endpoint
// would let clients forge the identity. Its only caller is the guarded
// closeProjectPoll action (src/actions/manage/polls.ts), server-side.

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity, emitNotifications } from '@/lib/events'
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

  // Notify the poll's registered voters (distinct, excluding the closer) —
  // they are the ones waiting for results, not the PM who closed it.
  const votes = await payload.find({
    collection: 'poll-votes',
    where: { poll: { equals: pollId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const voterIds = [
    ...new Set(
      votes.docs
        .map((v) => {
          const u = (v as { user?: unknown }).user
          return u == null ? null : String(typeof u === 'object' ? (u as { id: unknown }).id : u)
        })
        .filter((id): id is string => !!id && id !== String(user.id)),
    ),
  ]
  await emitNotifications(voterIds.map((userId) => ({ type: 'poll_closed' as const, userId, reference: { collectionSlug: 'polls', id: pollId } })))
  return poll
}
