import type { Plugin } from 'payload'
import { ForumThreads } from './collections/forum-threads'
import { ForumComments } from './collections/forum-comments'
import { forumManifest } from './manifest'
import { moduleRegistry } from '../registry'

const forumPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), ForumThreads, ForumComments],
})

moduleRegistry.register(forumManifest, forumPlugin)

export { forumPlugin }
