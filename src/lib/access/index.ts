import type { Access, AccessArgs, PayloadRequest, Where } from 'payload'

export function isAdmin({ req: { user } }: AccessArgs): boolean {
  return user?.role === 'admin'
}

export function isAuthenticated({ req: { user } }: AccessArgs): boolean {
  return Boolean(user)
}

/**
 * Project ids of the requester's active memberships — the basis for row-level
 * read scopes below. Cached on req.context so a request evaluating several
 * collections (admin list views, REST with depth) runs the query once.
 */
async function activeProjectIds(req: PayloadRequest): Promise<string[]> {
  if (!req.user) return []
  const ctx = req.context as Record<string, unknown>
  if (Array.isArray(ctx._memberProjectIds)) return ctx._memberProjectIds as string[]
  const res = await req.payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }] },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const ids = res.docs
    .map((d) => (d.project ? String(typeof d.project === 'object' ? d.project.id : d.project) : null))
    .filter((id): id is string => id !== null)
  ctx._memberProjectIds = ids
  return ids
}

/**
 * Row-level read scope for module content, closing the REST hole: server code
 * uses `overrideAccess: true` and is unaffected — these rules bind the mounted
 * `/api/<collection>` surface (and any `overrideAccess: false` query).
 *
 * `visibilityPath` (a `visibility` select on the doc or its parent) admits
 * PUBLIC rows to everyone; `projectPath` admits every row of projects the
 * requester is an ACTIVE member of; admins see all. Without a visibilityPath,
 * anonymous requests are denied outright. TEAM granularity intentionally
 * remains a per-document concern (`canViewContent`) — this scope guarantees
 * nothing leaves a project.
 */
export function scopedRead(opts: { visibilityPath?: string; projectPath: string }): Access {
  return async ({ req }) => {
    if (req.user?.role === 'admin') return true
    const publicClause: Where | null = opts.visibilityPath
      ? { [opts.visibilityPath]: { equals: 'PUBLIC' } }
      : null
    if (!req.user) return publicClause ?? false
    const ids = await activeProjectIds(req)
    const memberClause: Where | null = ids.length > 0 ? { [opts.projectPath]: { in: ids } } : null
    if (publicClause && memberClause) return { or: [publicClause, memberClause] }
    return memberClause ?? publicClause ?? false
  }
}

/** Access limited to one's own rows (`userPath` relationship) — admins see all. */
export function ownRowsOrAdmin(userPath = 'user'): Access {
  return ({ req }) => {
    if (req.user?.role === 'admin') return true
    if (!req.user) return false
    return { [userPath]: { equals: req.user.id } }
  }
}
