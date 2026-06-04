#!/bin/sh
set -e

echo "Running payload migrate..."
./node_modules/.bin/payload migrate

echo "Starting Next.js..."
exec ./node_modules/.bin/next start
