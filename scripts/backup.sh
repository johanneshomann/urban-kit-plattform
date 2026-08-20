#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 Johannes Homann
#
# SPDX-License-Identifier: EUPL-1.2

#
# Database + uploaded-media backup for the urban-kit-plattform stack.
# Same pattern as the urban-kit-methodensammlung backup.
#
# Ships with the repo and is deployed via `git pull`. Run it from cron on the
# server (the only host-level step — cron config can't live in git):
#
#   30 3 * * * /root/projects/urban-kit-plattform/urban-kit-plattform/scripts/backup.sh \
#              >> /root/projects/urban-kit-plattform/backups/backup.log 2>&1
#
# Produces two files per run in the backup dir:
#   db_<stamp>.archive.gz    — mongodump --archive --gzip of the urban_kit DB
#   media_<stamp>.tar.gz     — the media_data + uploads_data volumes
#
# Overridable via env: BACKUP_DIR, BACKUP_KEEP_DAYS, MONGO_DB
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$(basename "$ROOT")"                    # = docker compose project name
DEST="${BACKUP_DIR:-$ROOT/../backups}"           # default: sibling of the repo (outside git)
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
DB="${MONGO_DB:-urban_kit}"
STAMP="$(date +%Y-%m-%d_%H%M)"

mkdir -p "$DEST"

USER_="$(grep '^MONGO_ROOT_USER=' "$ROOT/.env" | cut -d= -f2-)"
PW="$(grep '^MONGO_ROOT_PASSWORD=' "$ROOT/.env" | cut -d= -f2-)"
[ -n "$USER_" ] || { echo "ERROR: MONGO_ROOT_USER not found in $ROOT/.env" >&2; exit 1; }
[ -n "$PW" ] || { echo "ERROR: MONGO_ROOT_PASSWORD not found in $ROOT/.env" >&2; exit 1; }

# 1) Database — credentials passed via env so they never show up in `docker inspect`/ps
docker exec -e U="$USER_" -e PW="$PW" "${PROJECT}-mongo-1" \
  sh -c "mongodump --username \"\$U\" --password \"\$PW\" --authenticationDatabase admin \
         --db $DB --archive --gzip" > "$DEST/db_$STAMP.archive.gz"

# 2) Uploaded media (lives in volumes, not in Mongo)
docker run --rm \
  -v "${PROJECT}_media_data:/media:ro" \
  -v "${PROJECT}_uploads_data:/uploads:ro" \
  -v "$DEST:/backup" alpine \
  tar czf "/backup/media_$STAMP.tar.gz" -C / media uploads

# 3) Rotate — drop archives older than KEEP_DAYS
find "$DEST" -name 'db_*.archive.gz' -mtime "+$KEEP_DAYS" -delete
find "$DEST" -name 'media_*.tar.gz'  -mtime "+$KEEP_DAYS" -delete

echo "[$(date '+%F %T')] backup ok -> $DEST (db_$STAMP, media_$STAMP)"
