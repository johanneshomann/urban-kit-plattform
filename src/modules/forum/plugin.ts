import type { Plugin } from 'payload'
import { ForumThreads } from './collections/forum-threads'
import { ForumComments } from './collections/forum-comments'
import { ForumThreadVotes } from './collections/forum-thread-votes'
import { forumManifest } from './manifest'
import { moduleRegistry } from '../registry'

const forumPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), ForumThreads, ForumComments, ForumThreadVotes],
})

moduleRegistry.register(forumManifest, forumPlugin)

export { forumPlugin }
