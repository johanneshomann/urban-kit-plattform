// ADR-1: Authorizes WebSocket connections by calling Payload's internal endpoint.
// ADR-2: Board canvases persist Yjs binary updates via the database extension.

import { Server } from '@hocuspocus/server'

const PAYLOAD_INTERNAL_URL = process.env.PAYLOAD_INTERNAL_URL ?? 'http://localhost:3000'
const HOCUSPOCUS_SECRET = process.env.HOCUSPOCUS_SECRET ?? 'dev-hocuspocus-secret'
const PORT = parseInt(process.env.PORT ?? '1234', 10)

const server = Server.configure({
  port: PORT,

  async onAuthenticate({ token, documentName }) {
    const res = await fetch(`${PAYLOAD_INTERNAL_URL}/api/internal/authorize-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hocuspocus-secret': HOCUSPOCUS_SECRET,
      },
      body: JSON.stringify({ token, roomName: documentName }),
    })

    const data = await res.json()

    if (!data.authorized) {
      throw new Error('Unauthorized')
    }

    return { userId: data.userId }
  },

  // Phase 12: board canvases persist via the database extension
  // extensions: [new Database({ ... })]
})

server.listen()
console.log(`Hocuspocus running on port ${PORT}`)
