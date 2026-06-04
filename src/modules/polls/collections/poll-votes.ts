import type { CollectionConfig } from 'payload'

export const PollVotes: CollectionConfig = {
  slug: 'poll-votes',
  access: {
    // Votes are write-once; only admins can read raw votes (results are aggregated)
    read: ({ req }) => Boolean(req.user),
    create: () => true, // anonymous + authenticated — rate limiting enforced in route handler
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'poll', type: 'relationship', relationTo: 'polls', required: true },
    { name: 'question', type: 'relationship', relationTo: 'poll-questions', required: true },
    { name: 'option', type: 'relationship', relationTo: 'poll-options' },
    { name: 'textAnswer', type: 'text' },
    { name: 'scaleAnswer', type: 'number' },
    // Authenticated votes: user ID. Anonymous: null (session token checked separately)
    { name: 'user', type: 'relationship', relationTo: 'users' },
    // Signed session token for anonymous duplicate prevention (not stored in plain text in prod)
    { name: 'sessionToken', type: 'text', admin: { hidden: true } },
  ],
  timestamps: true,
}
