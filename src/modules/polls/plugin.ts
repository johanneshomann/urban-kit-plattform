import type { Plugin } from 'payload'
import { Polls } from './collections/polls'
import { PollQuestions } from './collections/poll-questions'
import { PollOptions } from './collections/poll-options'
import { PollVotes } from './collections/poll-votes'
import { pollsManifest } from './manifest'
import { moduleRegistry } from '../registry'

const pollsPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), Polls, PollQuestions, PollOptions, PollVotes],
})

moduleRegistry.register(pollsManifest, pollsPlugin)

export { pollsPlugin }
