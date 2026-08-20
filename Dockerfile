FROM node:26-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time, so they must be available here (not just at runtime)
ARG NEXT_PUBLIC_HOCUSPOCUS_URL
ENV NEXT_PUBLIC_HOCUSPOCUS_URL=$NEXT_PUBLIC_HOCUSPOCUS_URL
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
RUN rm -f src/app/\(payload\)/admin/importMap.js && npm run generate:types && npm run generate:importmap && npm run build

# Runner — copies full node_modules for reliable Payload module resolution
FROM base AS runner
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
# One-off maintenance/seed scripts + seed content/assets, run via
# `docker compose exec web npm run seed:prototype` (same pattern as the
# methodensammlung image shipping its seed.ts/scripts).
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/seed ./seed

# Both volume mount points need to exist nextjs-owned BEFORE the named volumes
# are first mounted — otherwise Docker creates them root-owned and uploads
# fail with EACCES (media_data:/app/media, uploads_data:/app/uploads).
RUN mkdir -p /app/media /app/uploads/files && chown -R nextjs:nodejs /app/media /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# No start.sh / migrations (Mongo is schemaless) — same as the methodensammlung
CMD ["./node_modules/.bin/next", "start"]
