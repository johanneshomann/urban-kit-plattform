# ADR-3: Payload Local API overrideAccess Policy

**Status:** Accepted  
**Date:** 2026-05-31

## Context

The Payload Local API defaults `overrideAccess: true`, silently bypassing all access-control functions. In a civic platform with enforced role boundaries, any server action that omits the user context silently leaks or overwrites data beyond what the user is allowed to see.

## Decision

**All server actions and internal helpers that act on behalf of a user must use `payloadAs(user)` from `src/lib/payload-client.ts`.**

```ts
export function payloadAs(user: User) {
  return { overrideAccess: false as const, user }
}

// Every server action:
await payload.find({ collection: 'news-posts', ...payloadAs(user) })
```

`overrideAccess: true` is only permitted in:
1. Seed scripts (`scripts/seed.ts`)
2. Platform-manager-only admin operations where no user context is available

Any use of `overrideAccess: true` outside these cases must have an explanatory comment and be flagged in code review.

## Consequences

- Access-control functions are always enforced on behalf of users
- Security bugs from silent permission bypass are eliminated
- All server actions require an authenticated user — unauthenticated paths must handle the null user case explicitly
- A future ESLint rule can enforce this mechanically
