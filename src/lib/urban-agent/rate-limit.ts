// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'

/**
 * Cost guards for the Urban Agent endpoint: a per-user sliding window plus a
 * global daily ceiling. Ported from the methodensammlung assistant, keyed by
 * user id instead of IP — the endpoint is authenticated, and a user id can't
 * be rotated the way client IPs can.
 *
 * Both counters are in-memory and per-process (reset on redeploy, don't span
 * instances) — good enough for a single-container deployment; swap for a
 * shared store (Redis/Upstash) if the app is scaled horizontally.
 *
 * The per-user limit stops casual abuse; the daily ceiling is the backstop
 * against many accounts (registration is open). Exhausting it degrades the
 * agent to "temporarily unavailable", which is a designed-for state — the
 * project content itself stays fully browsable.
 */

const WINDOW_MS = 5 * 60 * 1000
const DEFAULT_MAX = 20
/** Requests per calendar day across ALL users. Override via env. Compose
 * passes the var as an empty string when unset — Number('') is 0, which would
 * mean "always exhausted", so anything non-positive falls back to the default. */
const envDailyMax = Number(process.env.URBAN_AGENT_DAILY_MAX)
const DAILY_MAX = Number.isFinite(envDailyMax) && envDailyMax > 0 ? envDailyMax : 600
/** Drop user buckets that fell out of the window; runs at most this often. */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000

const hits = new Map<string, number[]>()
let lastSweep = Date.now()

let dailyCount = 0
let dailyDay = new Date().toISOString().slice(0, 10)

/**
 * Drop entries whose timestamps have all aged out. Without this, every user
 * ever seen stays in the map for the process's lifetime.
 */
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
  }
}

/** True while the global daily budget is exhausted (checked before per-user). */
export function dailyLimitReached(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (today !== dailyDay) {
    dailyDay = today
    dailyCount = 0
  }
  return dailyCount >= DAILY_MAX
}

/** Count one accepted request against the global daily budget. */
export function countDailyRequest(): void {
  dailyCount++
}

export function rateLimit(key: string, max: number = DEFAULT_MAX): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  sweep(now)
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= max) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)
    return { ok: false, retryAfter }
  }
  recent.push(now)
  hits.set(key, recent)
  return { ok: true }
}
