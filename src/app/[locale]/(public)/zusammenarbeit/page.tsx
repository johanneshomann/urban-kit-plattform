// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { redirect } from 'next/navigation'

export default async function ZusammenarbeitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/bereich/zusammenarbeit`)
}
