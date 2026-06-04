'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity, emitNotification } from '@/lib/events'
import { cookies } from 'next/headers'
import { createHmac, randomUUID } from 'crypto'
import type { User } from '@/payload-types'

function signSessionToken(token: string): string {
  const secret = process.env.PAYLOAD_SECRET ?? 'dev-secret'
  return createHmac('sha256', secret).update(token).digest('hex')
}

export async function castVote(data: {
  pollId: string
  questionId: string
  optionId?: string
  textAnswer?: string
  scaleAnswer?: number
  userId?: string
}) {
  const payload = await getPayload({ config })

  // Duplicate prevention for anonymous votes
  if (!data.userId) {
    const cookieStore = await cookies()
    const existingToken = cookieStore.get(`poll-vote-${data.pollId}-${data.questionId}`)?.value
    if (existingToken) {
      return { error: 'Bereits abgestimmt' }
    }
    const token = randomUUID()
    const signed = signSessionToken(token)
    cookieStore.set(`poll-vote-${data.pollId}-${data.questionId}`, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365,
    })
    await payload.create({
      collection: 'poll-votes',
      data: {
        poll: data.pollId,
        question: data.questionId,
        option: data.optionId,
        textAnswer: data.textAnswer,
        scaleAnswer: data.scaleAnswer,
        sessionToken: signed,
      },
      overrideAccess: true,
    })
    return { ok: true }
  }

  // Authenticated duplicate check
  const existing = await payload.find({
    collection: 'poll-votes',
    where: { and: [{ poll: { equals: data.pollId } }, { question: { equals: data.questionId } }, { user: { equals: data.userId } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) return { error: 'Bereits abgestimmt' }

  await payload.create({
    collection: 'poll-votes',
    data: {
      poll: data.pollId,
      question: data.questionId,
      option: data.optionId,
      textAnswer: data.textAnswer,
      scaleAnswer: data.scaleAnswer,
      user: data.userId,
    },
    overrideAccess: true,
  })
  return { ok: true }
}

export async function closePoll(user: User, pollId: string, projectId: string) {
  const payload = await getPayload({ config })
  const poll = await payload.update({
    collection: 'polls',
    id: pollId,
    data: { status: 'closed' },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'poll.closed', userId: String(user.id), projectId, reference: { collection: 'polls', id: pollId } })
  await emitNotification({ type: 'poll_closed', userId: String(user.id), reference: { collection: 'polls', id: pollId } })
  return poll
}
