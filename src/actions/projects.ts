'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function saveModuleOrderAction(membershipId: string, order: string[]): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return

  const payload = await getPayload({ config })
  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({
    collection: 'project-memberships',
    id: membershipId,
    data: { moduleOrder: order } as any,
    overrideAccess: true,
  })
}
