'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import type { User } from '@/payload-types'

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) return null

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    return (user as User) ?? null
  } catch {
    return null
  }
}
