// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/getUser'

/**
 * Read-only demo accounts (users.isDemo) for the public prototype. Hard rule:
 * EVERY mutating server action starts with `if (await isDemoSession()) return
 * { error: DEMO_WRITE_ERROR }`, every mutating API route checks `isDemoUser`
 * — Payload hooks can't do it because actions write with overrideAccess and
 * no request user. Reads stay unrestricted; the Urban Agent is deliberately
 * allowed (rate-limited showcase).
 */
export const DEMO_WRITE_ERROR = 'Prototyp-Modus: Im Testzugang werden Änderungen nicht gespeichert.'

export const isDemoUser = (user: unknown): boolean =>
  Boolean((user as { isDemo?: boolean | null } | null | undefined)?.isDemo)

/** True when the current request's session belongs to a read-only demo account. */
export async function isDemoSession(): Promise<boolean> {
  return isDemoUser(await getUser())
}

/** 403 for API routes — the client shows `message` like any other route error. */
export function demoDeniedResponse(): NextResponse {
  return NextResponse.json({ error: 'demo_readonly', message: DEMO_WRITE_ERROR }, { status: 403 })
}
