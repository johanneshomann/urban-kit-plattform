#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 Johannes Homann
#
# SPDX-License-Identifier: EUPL-1.2

#
# Restore a database archive produced by scripts/backup.sh.
# WARNING: --drop replaces the current urban_kit DB with the archive's contents.
#
#   scripts/restore.sh /path/to/db_2026-08-20_0330.archive.gz
#
# To also restore media, untar the matching media_<stamp>.tar.gz into the
# media_data / uploads_data volumes.
set -euo pipefail

ARCHIVE="${1:?usage: restore.sh <db_*.archive.gz>}"
[ -f "$ARCHIVE" ] || { echo "ERROR: no such file: $ARCHIVE" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$(basename "$ROOT")"
USER_="$(grep '^MONGO_ROOT_USER=' "$ROOT/.env" | cut -d= -f2-)"
PW="$(grep '^MONGO_ROOT_PASSWORD=' "$ROOT/.env" | cut -d= -f2-)"
[ -n "$USER_" ] || { echo "ERROR: MONGO_ROOT_USER not found in $ROOT/.env" >&2; exit 1; }
[ -n "$PW" ] || { echo "ERROR: MONGO_ROOT_PASSWORD not found in $ROOT/.env" >&2; exit 1; }

gunzip -c "$ARCHIVE" | docker exec -i -e U="$USER_" -e PW="$PW" "${PROJECT}-mongo-1" \
  sh -c 'mongorestore --username "$U" --password "$PW" --authenticationDatabase admin \
         --archive --gzip --drop'

echo "restore complete from $ARCHIVE"
