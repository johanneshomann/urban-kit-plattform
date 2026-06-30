import type { CollectionConfig, AccessArgs } from 'payload'

// DM access control: standalone function — NOT the project chain.
// Only the two participants of a direct-conversation can read/write.
function isDMParticipant({ req, id }: AccessArgs) {
  if (!req.user) return false
  if (!id) return { participants: { contains: req.user.id } }
  return { participants: { contains: req.user.id } }
}

export const DirectConversations: CollectionConfig = {
  slug: 'direct-conversations',
  access: {
    read: isDMParticipant,
    create: ({ req }) => Boolean(req.user),
    // Only participants can update or delete their own conversation
    update: isDMParticipant,
    delete: isDMParticipant,
  },
  fields: [
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 2,
    },
    { name: 'lastMessage', type: 'relationship', relationTo: 'chat-messages' },
  ],
  timestamps: true,
}
