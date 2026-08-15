// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type React from 'react'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'

/**
 * Manage area — PM-only. This guard is the security boundary for the whole
 * subtree; the sidebar/tab-bar chrome lives in the parent `[slug]/layout.tsx`
 * and is presentation only.
 */
export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  return (
    <div className="card-in flex-1 p-6 md:p-10 min-w-0" style={{ background: 'var(--project-white)' }}>
      {children}
    </div>
  )
}
