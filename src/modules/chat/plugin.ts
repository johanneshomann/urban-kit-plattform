import type { Plugin } from 'payload'
import { ChatChannels } from './collections/chat-channels'
import { ChatMessages } from './collections/chat-messages'
import { DirectConversations } from './collections/direct-conversations'
import { chatManifest } from './manifest'
import { moduleRegistry } from '../registry'

const chatPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), ChatChannels, ChatMessages, DirectConversations],
})

moduleRegistry.register(chatManifest, chatPlugin)

export { chatPlugin }
