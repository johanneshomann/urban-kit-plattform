import type { CollectionConfig } from 'payload'

export const PollVotes: CollectionConfig = {
  slug: 'poll-votes',
  labels: {
    singular: { en: 'Poll vote', de: 'Umfragestimme' },
    plural: { en: 'Poll votes', de: 'Umfragestimmen' },
  },
  access: {
    // Votes are write-once; only admins can read raw votes (results are aggregated)
    read: ({ req }) => Boolean(req.user),
    create: () => true, // anonymous + authenticated — rate limiting enforced in route handler
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'poll', type: 'relationship', relationTo: 'polls', required: true, label: { en: 'Poll', de: 'Umfrage' } },
    { name: 'question', type: 'relationship', relationTo: 'poll-questions', required: true, label: { en: 'Question', de: 'Frage' } },
    { name: 'option', type: 'relationship', relationTo: 'poll-options', label: { en: 'Option', de: 'Antwortoption' } },
    { name: 'textAnswer', type: 'text', label: { en: 'Text answer', de: 'Textantwort' } },
    { name: 'scaleAnswer', type: 'number', label: { en: 'Scale answer', de: 'Skalenantwort' } },
    // Authenticated votes: user ID. Anonymous: null (session token checked separately)
    { name: 'user', type: 'relationship', relationTo: 'users', label: { en: 'User', de: 'Benutzer:in' } },
    // Signed session token for anonymous duplicate prevention (not stored in plain text in prod)
    { name: 'sessionToken', type: 'text', admin: { hidden: true } },
  ],
  timestamps: true,
}
