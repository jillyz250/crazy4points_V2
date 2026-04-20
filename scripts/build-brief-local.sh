#!/usr/bin/env bash
# Run the daily brief against the local Next.js dev server.
# Bypasses Vercel's 60s Hobby function-duration cap.
#
# Usage:
#   1. In one terminal: npm run dev
#   2. In another:      ./scripts/build-brief-local.sh
#
# Env: loads INTEL_API_SECRET from .env.local automatically.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local not found in $(pwd)" >&2
  exit 1
fi

# Extract INTEL_API_SECRET only — avoids sourcing the whole file, which breaks
# on dotenv values containing bash metacharacters (e.g. 'Name <email>').
INTEL_API_SECRET=$(grep -E '^INTEL_API_SECRET=' .env.local | head -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")

if [[ -z "${INTEL_API_SECRET:-}" ]]; then
  echo "ERROR: INTEL_API_SECRET not set in .env.local" >&2
  exit 1
fi

URL="${BRIEF_LOCAL_URL:-http://localhost:3000}"

if ! curl -sSf -o /dev/null "$URL" 2>/dev/null; then
  echo "ERROR: dev server not responding at $URL" >&2
  echo "Start it first with: npm run dev" >&2
  exit 1
fi

echo "→ Triggering build-brief at $URL (this can take 2-5 minutes)"
echo

# --max-time 600 = 10 minute curl timeout. Server-side has no cap in dev mode.
curl -sS -X GET "$URL/api/build-brief" \
  -H "x-intel-secret: $INTEL_API_SECRET" \
  --max-time 600 \
  -w "\n\n→ HTTP %{http_code} in %{time_total}s\n"
