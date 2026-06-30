import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { isPMOfAnyProject } from '@/lib/chat/access'
import { ChatLayout } from '@/components/platform/chat/ChatLayout'

export default async function NachrichtenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await getUser()
  if (!user) redirect(`/${locale}/login`)

  const payload = await getPayload({ config })
  const canCreateGroups = await isPMOfAnyProject(payload, String(user.id))

  return (
    <div className="p-6 md:p-8 h-[calc(100svh-3.5rem)]">
      <h1 className="text-display font-bold mb-4" style={{ color: 'var(--plattform-ink)' }}>Nachrichten</h1>
      <div className="h-[calc(100%-3rem)]">
        <ChatLayout canCreateGroups={canCreateGroups} />
      </div>
    </div>
  )
}
