// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Plugin } from 'payload'
import { TaskColumns } from './collections/task-columns'
import { Tasks } from './collections/tasks'
import { TaskAssignees } from './collections/task-assignees'
import { tasksManifest } from './manifest'
import { moduleRegistry } from '../registry'

const tasksPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), TaskColumns, Tasks, TaskAssignees],
})

moduleRegistry.register(tasksManifest, tasksPlugin)

