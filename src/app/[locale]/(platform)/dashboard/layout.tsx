import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { getCitySettings } from '@/lib/instance'
import { PlatformHeader } from '@/components/platform/PlatformHeader'
import { DashboardShell } from '@/components/platform/DashboardShell'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveColorScheme } from '@/lib/colorScheme'
import type { NotificationItem } from '@/components/platform/NotificationBell'

type Project = { id: string; title: string; slug: string; colorScheme?: string | null }

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [user, { cityName }] = await Promise.all([getUser(), getCitySettings()])

  if (!user) redirect(`/${locale}/login`)

  const u = user as unknown as { firstName?: string; lastName?: string }
  const userName = [u.firstName, u.lastName].filter(Boolean).join(' ') || null

  // Fetch notification items for the bell
  let notificationItems: NotificationItem[] = []
  try {
    const payload = await getPayload({ config })

    const memberships = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
      depth: 2,
      limit: 50,
      overrideAccess: true,
    })

    const projects = memberships.docs.map((m) => m.project).filter(Boolean) as Project[]
    const projectIds = projects.map((p) => p.id)

    if (projectIds.length > 0) {
      const now = new Date().toISOString()
      const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [pollsResult, eventsResult, newsResult] = await Promise.all([
        payload.find({
          collection: 'polls',
          where: { and: [{ project: { in: projectIds } }, { status: { equals: 'active' } }] },
          limit: 20, depth: 1, overrideAccess: true,
        }),
        payload.find({
          collection: 'calendar-events',
          where: { and: [{ project: { in: projectIds } }, { startDate: { greater_than_equal: now } }, { startDate: { less_than_equal: in14days } }] },
          sort: 'startDate', limit: 20, depth: 1, overrideAccess: true,
        }),
        payload.find({
          collection: 'news-posts',
          where: { and: [{ project: { in: projectIds } }, { publishedAt: { greater_than_equal: last7days } }] },
          sort: '-publishedAt', limit: 20, depth: 1, overrideAccess: true,
        }),
      ])

      const schemeFor = (p: Project) => resolveColorScheme(p.colorScheme)

      const projectById = Object.fromEntries(projects.map((p) => [p.id, p]))

      const toItem = (
        type: NotificationItem['type'],
        title: string,
        projectRaw: unknown,
        date?: string,
      ): NotificationItem | null => {
        const p = projectById[(projectRaw as { id: string })?.id ?? String(projectRaw)]
        if (!p) return null
        const scheme = schemeFor(p)
        return { type, title, projectTitle: p.title, projectSlug: p.slug, date, schemeMid: scheme.mid, schemeAccent: scheme.accent, schemeLight: scheme.light, schemeDark: scheme.dark }
      }

      const items: (NotificationItem | null)[] = [
        ...pollsResult.docs.map((d) => toItem('poll', d.title as string, d.project)),
        ...eventsResult.docs.map((d) => toItem('event', d.title as string, d.project, d.startDate as string)),
        ...newsResult.docs.map((d) => toItem('news', d.title as string, d.project, d.publishedAt as string | undefined)),
      ]

      notificationItems = items.filter((i): i is NotificationItem => i !== null).slice(0, 30)
    }
  } catch {
    // Non-fatal — bell just shows empty
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PlatformHeader
        locale={locale}
        cityName={cityName}
        userName={userName}
        notificationItems={notificationItems}
      />
      <main className="flex-1">
        <DashboardShell>
          {children}
        </DashboardShell>
      </main>
    </div>
  )
}
