#!/bin/sh
set -e
cd /app

if [ ! -d node_modules/next ]; then
  pnpm install --frozen-lockfile
fi

exec pnpm exec next dev --hostname 0.0.0.0 --port 3000
