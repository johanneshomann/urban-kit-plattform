import type { AccessArgs } from 'payload'

export function isAdmin({ req: { user } }: AccessArgs): boolean {
  return user?.role === 'admin'
}

export function isAuthenticated({ req: { user } }: AccessArgs): boolean {
  return Boolean(user)
}
