import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { DashboardShell } from '@/components/platform/DashboardShell'
import { DashboardTransition } from '@/components/platform/DashboardTransition'
import { DashboardChrome } from '@/components/platform/DashboardChrome'
import { DashboardTopBar } from '@/components/platform/DashboardTopBar'
import { DashboardFooter } from '@/components/platform/DashboardFooter'
import { HideAccessibilityFab } from '@/components/accessibility/HideAccessibilityFab'
import { ChatLauncher } from '@/components/platform/chat/ChatLauncher'
import { getAppVars } from '@/lib/app-theme'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getUser()

  if (!user) redirect(`/${locale}/login`)

  const appVars = await getAppVars()

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) ?? null
  const lastName = ((user as unknown as { lastName?: string | null }).lastName) ?? null
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName ?? null

  return (
    <div data-app-theme className="min-h-screen flex flex-col" style={{ background: 'var(--app-light)', ...appVars }}>
      <HideAccessibilityFab />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        {/* Top bar + footer live OUTSIDE the transition wrapper: the bar stays
            sticky (no overflow-hidden ancestor) and neither slides with the page. */}
        <DashboardChrome
          topBar={<DashboardTopBar userName={userName} />}
          footer={<DashboardFooter locale={locale} />}
        >
          <DashboardShell>
            <DashboardTransition>
              {children}
            </DashboardTransition>
          </DashboardShell>
        </DashboardChrome>
      </main>
      {/* Floating chat — mounted ONCE in this ancestor layout so popup state
          survives dashboard ⇄ workspace navigation; inherits the chameleon
          via var(--project-*, var(--app-*)). Outside <main> (not page content). */}
      <ChatLauncher />
    </div>
  )
}