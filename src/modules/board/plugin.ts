import type { Plugin } from 'payload'
import { BoardCanvases } from './collections/board-canvases'
import { boardManifest } from './manifest'
import { moduleRegistry } from '../registry'

const boardPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), BoardCanvases],
})

moduleRegistry.register(boardManifest, boardPlugin)

export { boardPlugin }
