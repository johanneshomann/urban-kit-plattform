// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Plugin } from 'payload'
import { Folders } from './collections/folders'
import { FileUploads } from './collections/file-uploads'
import { filesManifest } from './manifest'
import { moduleRegistry } from '../registry'

const filesPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), Folders, FileUploads],
})

moduleRegistry.register(filesManifest, filesPlugin)

