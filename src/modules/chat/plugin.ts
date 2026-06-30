import type { Plugin } from 'payload'
import { ChatRooms } from './collections/chat-rooms'
import { ChatRoomMembers } from './collections/chat-room-members'
import { ChatMessages } from './collections/chat-messages'
import { chatManifest } from './manifest'
import { moduleRegistry } from '../registry'

const chatPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), ChatRooms, ChatRoomMembers, ChatMessages],
})

moduleRegistry.register(chatManifest, chatPlugin)

export { chatPlugin }
