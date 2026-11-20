#!/usr/bin/env bash
# Run a command against a fresh dev server on 127.0.0.1:5173, then stop the server.
# usage: scripts/with-server.sh node scripts/flow.mjs out 960 540
set -u
cd "$(dirname "$0")/.."
npx vite --host 127.0.0.1 --port 5173 --strictPort > "${TMPDIR:-/tmp}/vite-test.log" 2>&1 &
VITE=$!
trap 'kill $VITE 2>/dev/null' EXIT
for i in $(seq 1 60); do
  curl -s -o /dev/null http://127.0.0.1:5173/ && break
  sleep 0.5
done
"$@"
