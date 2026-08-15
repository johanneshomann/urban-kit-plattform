// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { redirect } from 'next/navigation'

// This chapter now lives on the Bereich Grundlagen page itself — this legacy
// URL deep-links to its anchor.
export default async function ProjektplanungRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/bereich/grundlagen#projektplanung`)
}
