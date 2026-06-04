import type { Plugin } from 'payload'
import { Folders } from './collections/folders'
import { filesManifest } from './manifest'
import { moduleRegistry } from '../registry'

const filesPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), Folders],
})

moduleRegistry.register(filesManifest, filesPlugin)

export { filesPlugin }
