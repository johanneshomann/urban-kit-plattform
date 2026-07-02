// ADR-1: Authorizes WebSocket connections by calling Payload's internal endpoint.
// ADR-2: Board canvases persist Yjs binary updates via the database extension.

import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'

const PAYLOAD_INTERNAL_URL = process.env.PAYLOAD_INTERNAL_URL ?? 'http://localhost:3000'
const HOCUSPOCUS_SECRET = process.env.HOCUSPOCUS_SECRET ?? 'dev-hocuspocus-secret'
const PORT = parseInt(process.env.PORT ?? '1234', 10)

const internalHeaders = {
  'Content-Type': 'application/json',
  'x-hocuspocus-secret': HOCUSPOCUS_SECRET,
}

const server = Server.configure({
  port: PORT,

  async onAuthenticate({ token, documentName }) {
    const res = await fetch(`${PAYLOAD_INTERNAL_URL}/api/internal/authorize-room`, {
      method: 'POST',
      headers: internalHeaders,
      body: JSON.stringify({ token, roomName: documentName }),
    })

    const data = await res.json()

    if (!data.authorized) {
      throw new Error('Unauthorized')
    }

    return { userId: data.userId }
  },

  // ADR-2 (Mongo addendum): persist the Yjs document state through Payload.
  extensions: [
    new Database({
      // Load the stored Yjs state (base64 → Uint8Array), or null for a fresh doc.
      fetch: async ({ documentName }) => {
        const res = await fetch(
          `${PAYLOAD_INTERNAL_URL}/api/internal/board-doc?room=${encodeURIComponent(documentName)}`,
          { headers: internalHeaders },
        )
        if (!res.ok) return null
        const { state } = await res.json()
        return state ? new Uint8Array(Buffer.from(state, 'base64')) : null
      },
      // Store the full Yjs state (debounced by the extension) as base64.
      store: async ({ documentName, state }) => {
        await fetch(`${PAYLOAD_INTERNAL_URL}/api/internal/board-doc`, {
          method: 'POST',
          headers: internalHeaders,
          body: JSON.stringify({ room: documentName, state: Buffer.from(state).toString('base64') }),
        })
      },
    }),
  ],
})

server.listen()
console.log(`Hocuspocus running on port ${PORT}`)
