// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Urban Kit',
  description: 'Stadtbeteiligung einfach gemacht',
}

// Root layout — locale-specific layouts in [locale]/layout.tsx handle html/body/styles.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
