// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import config from '@payload-config'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, importMap, params, searchParams })

export default NotFound
