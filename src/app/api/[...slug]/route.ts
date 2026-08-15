// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import config from '@payload-config'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
