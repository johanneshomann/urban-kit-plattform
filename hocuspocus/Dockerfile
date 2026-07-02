# Realtime sidecar for Board (Hocuspocus + Yjs). See ADR-1 / ADR-2.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./

EXPOSE 1234
CMD ["node", "server.js"]
