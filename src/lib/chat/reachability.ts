// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import type { Payload } from 'payload'

/**
 * DM policy ("anyone findable"): any existing, non-admin user whose profile is
 * not hidden may be messaged. Mirrors the people-search visibility rules so
 * the picker (/api/chat/users → findPeople) and POST /api/chat/dm can never
 * disagree about who is reachable.
 */
export async function canDirectMessage(payload: Payload, viewerId: string, targetId: string): Promise<boolean> {
  if (!targetId || targetId === viewerId) return false
  const target = await payload.findByID({ collection: 'users', id: targetId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!target) return false
  if (target.role === 'admin') return false
  if (target.settings?.profileVisible === false) return false
  return true
}
