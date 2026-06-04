import type { Plugin } from 'payload'
import { urbanAgentManifest } from './manifest'
import { moduleRegistry } from '../registry'

// Urban Agent has no collections — custom API routes + Vercel AI SDK
const urbanAgentPlugin: Plugin = (incomingConfig) => incomingConfig

moduleRegistry.register(urbanAgentManifest, urbanAgentPlugin)

export { urbanAgentPlugin }
