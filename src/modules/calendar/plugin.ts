// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Plugin } from 'payload'
import { CalendarEvents } from './collections/calendar-events'
import { EventAttendees } from './collections/event-attendees'
import { calendarManifest } from './manifest'
import { moduleRegistry } from '../registry'

const calendarPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), CalendarEvents, EventAttendees],
})

moduleRegistry.register(calendarManifest, calendarPlugin)

