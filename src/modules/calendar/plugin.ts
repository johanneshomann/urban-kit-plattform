import type { Plugin } from 'payload'
import { CalendarEvents } from './collections/calendar-events'
import { calendarManifest } from './manifest'
import { moduleRegistry } from '../registry'

const calendarPlugin: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: [...(incomingConfig.collections ?? []), CalendarEvents],
})

moduleRegistry.register(calendarManifest, calendarPlugin)

export { calendarPlugin }
