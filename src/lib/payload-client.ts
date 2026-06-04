import type { User } from '@/payload-types'

/**
 * ADR-3: Always use this when calling the Payload Local API on behalf of a user.
 * Ensures overrideAccess: false so all access control functions are enforced.
 * Only omit (overrideAccess: true) in seed scripts and platform-manager admin ops.
 */
export function payloadAs(user: User) {
  return { overrideAccess: false as const, user }
}
