'use server'

import { getUser } from '@/lib/auth/getUser'
import { findPeople, type Person } from '@/lib/people-search'

const AFFILIATIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const

/**
 * People search for the dashboard section. Logged-in users only; all scoping
 * and privacy rules (profileVisible, peers-by-default, no admins) live in
 * {@link findPeople}.
 */
export async function searchPeople(params: {
  query?: string
  projectId?: string
  affiliation?: string
}): Promise<{ people: Person[] } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const affiliation = (AFFILIATIONS as readonly string[]).includes(params.affiliation ?? '')
    ? params.affiliation
    : undefined

  try {
    const people = await findPeople(String(user.id), {
      query: (params.query ?? '').slice(0, 100),
      projectId: params.projectId,
      affiliation,
    })
    return { people }
  } catch {
    return { error: 'Suche fehlgeschlagen.' }
  }
}
