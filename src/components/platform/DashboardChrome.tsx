// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { usePathname } from 'next/navigation'

/**
 * Shows the dashboard's persistent chrome (sticky top bar + footer) on every
 * dashboard page EXCEPT the project workspaces, which bring their own shell
 * (ProjectSidebar / ProjectTabBar). Receives the server-rendered bar/footer as
 * props so they keep their server data (user name, city settings).
 */
export function DashboardChrome({
  topBar,
  footer,
  children,
}: {
  topBar: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const stripped = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
  const inWorkspace = stripped.startsWith('/dashboard/projekte')

  return (
    <>
      {!inWorkspace && topBar}
      {children}
      {!inWorkspace && footer}
    </>
  )
}
