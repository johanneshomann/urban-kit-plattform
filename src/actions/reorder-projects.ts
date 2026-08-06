'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'

/**
 * Persist the user's custom order for their dashboard project pills.
 * The `order` field on each active membership is a 0-based index;
 * after reordering, membership ids are written back in order.
 */
export async function reorderProjects(
  orderedMembershipIds: string[],
): Promise<{ ok?: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  try {
    const payload = await getPayload({ config })

    // Load the user's active memberships once, then map id → doc.
    const res = await payload.find({
      collection: 'project-memberships',
      where: {
        and: [
          { user: { equals: user.id } },
          { status: { equals: 'active' } },
        ],
      },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })

    const byId = new Map(res.docs.map((d) => [String(d.id), d]))

    // Write each membership's new order index in sequence.
    // Only touch memberships that were actually reordered.
    for (let i = 0; i < orderedMembershipIds.length; i++) {
      const id = orderedMembershipIds[i]
      const doc = byId.get(id)
      if (!doc) continue
      if (Number(doc.order ?? 0) === i) continue
      await payload.update({
        collection: 'project-memberships',
        id,
        data: { order: i },
        overrideAccess: true,
      })
    }
  } catch {
    return { error: 'Reihenfolge konnte nicht gespeichert werden.' }
  }

  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath('/dashboard', 'page')
  return { ok: true }
}