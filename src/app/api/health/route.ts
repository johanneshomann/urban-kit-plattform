// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true })
}
