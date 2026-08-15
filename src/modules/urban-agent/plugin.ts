// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Plugin } from 'payload'
import { urbanAgentManifest } from './manifest'
import { moduleRegistry } from '../registry'

// Urban Agent has no collections — custom API routes + Vercel AI SDK
const urbanAgentPlugin: Plugin = (incomingConfig) => incomingConfig

moduleRegistry.register(urbanAgentManifest, urbanAgentPlugin)

