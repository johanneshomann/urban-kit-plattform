'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'

const SETTING_KEYS = ['hideActivityFeed', 'hideAllProjects', 'hidePeopleSearch', 'profileVisible'] as const
export type ProfileSettingKey = (typeof SETTING_KEYS)[number]

/**
 * Toggle one of the self-service settings on the own user (dashboard section
 * visibility, profile visibility). Whitelisted keys only; the settings group
 * is written as a whole so untouched keys keep their values.
 */
export async function updateProfileSetting(
  key: ProfileSettingKey,
  value: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  if (!SETTING_KEYS.includes(key)) return { error: 'Ungültige Einstellung.' }

  try {
    const payload = await getPayload({ config })
    const current = user.settings ?? {}
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        settings: {
          hideActivityFeed: current.hideActivityFeed ?? false,
          hideAllProjects: current.hideAllProjects ?? false,
          hidePeopleSearch: current.hidePeopleSearch ?? false,
          profileVisible: current.profileVisible ?? true,
          [key]: value,
        },
      },
      overrideAccess: true,
    })
  } catch {
    return { error: 'Einstellung konnte nicht gespeichert werden.' }
  }

  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath('/[locale]/dashboard/profil', 'page')
  return { ok: true }
}

/**
 * Reset the custom drag-order of the dashboard project pills back to the
 * default (membership creation order).
 */
export async function resetProjectOrder(): Promise<{ ok?: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
      sort: 'createdAt',
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    for (let i = 0; i < res.docs.length; i++) {
      const doc = res.docs[i]
      if (Number(doc.order ?? 0) === i) continue
      await payload.update({
        collection: 'project-memberships',
        id: doc.id,
        data: { order: i },
        overrideAccess: true,
      })
    }
  } catch {
    return { error: 'Reihenfolge konnte nicht zurückgesetzt werden.' }
  }

  revalidatePath('/[locale]/dashboard', 'page')
  return { ok: true }
}
