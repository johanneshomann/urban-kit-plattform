// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
})
