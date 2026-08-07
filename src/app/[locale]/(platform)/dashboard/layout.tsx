import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { DashboardShell } from '@/components/platform/DashboardShell'
import { DashboardTransition } from '@/components/platform/DashboardTransition'
import { DashboardChrome } from '@/components/platform/DashboardChrome'
import { DashboardTopBar } from '@/components/platform/DashboardTopBar'
import { DashboardFooter } from '@/components/platform/DashboardFooter'
import { HideAccessibilityFab } from '@/components/accessibility/HideAccessibilityFab'
import { getPlatformColors } from '@/lib/theme'

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

  const platformColors = await getPlatformColors()
  const appVars: Record<string, string> = {
    '--app-black': platformColors.appBlack,
    '--app-ink': platformColors.appInk,
    '--app-ink-accent': platformColors.appInkAccent,
    '--app-white': platformColors.appWhite,
    '--app-light': platformColors.appLight,
    '--app-accent': platformColors.appAccent,
    // Override plattform tokens with app (neutral) values so every component
    // inside the workspace uses the neutral black/white scheme instead of the
    // green public-brand palette.
    '--plattform': platformColors.appAccent,
    '--plattform-light': platformColors.appLight,
    '--plattform-ink': platformColors.appInk,
    '--plattform-ink-accent': platformColors.appInkAccent,
    '--plattform-accent': platformColors.appAccent,
    '--plattform-white': platformColors.appWhite,
    '--plattform-white-transparent': 'rgba(255, 255, 255, 0.7)',
    '--plattform-black': platformColors.appBlack,
  }

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) ?? null
  const lastName = ((user as unknown as { lastName?: string | null }).lastName) ?? null
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName ?? null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-light)', ...appVars }}>
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
    </div>
  )
}