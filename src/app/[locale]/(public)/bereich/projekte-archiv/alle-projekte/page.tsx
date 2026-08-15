// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { redirect } from 'next/navigation'

// The project library now lives as a chapter on the Bereich page itself —
// this legacy URL deep-links to its anchor.
export default async function AlleProjekteRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/bereich/projekte-archiv#alle-projekte`)
}
