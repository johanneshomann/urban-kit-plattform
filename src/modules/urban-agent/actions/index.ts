// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// NOT a 'use server' module on purpose: assembleProjectContext takes its
// acting user as an argument (payloadAs), so exposing it as a callable
// server-action endpoint would let clients forge the identity. Its only
// caller is the authenticated /api/urban-agent route handler.

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import type { User } from '@/payload-types'

// Assembles project context for the AI — only surfaces content the user can see (ADR-3)
export async function assembleProjectContext(user: User, projectId: string) {
  const payload = await getPayload({ config })

  const [project, news, events, polls] = await Promise.all([
    payload.findByID({ collection: 'projects', id: projectId, ...payloadAs(user) }).catch(() => null),
    payload.find({ collection: 'news-posts', where: { 'project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'calendar-events', where: { 'project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'polls', where: { 'project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
  ])

  return { project, news: news.docs, events: events.docs, polls: polls.docs }
}
