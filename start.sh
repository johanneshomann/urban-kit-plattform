#!/bin/sh

# SPDX-FileCopyrightText: 2026 Johannes Homann
#
# SPDX-License-Identifier: EUPL-1.2

set -e

echo "Running payload migrate..."
./node_modules/.bin/payload migrate

echo "Starting Next.js..."
exec ./node_modules/.bin/next start
