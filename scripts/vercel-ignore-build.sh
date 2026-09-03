#!/usr/bin/env bash
# Vercel "Ignored Build Step" script.
#
# Vercel runs this before every build. Exit codes (Vercel's convention):
#   1  → BUILD  (proceed with the deployment)
#   0  → SKIP   (cancel the build — no build-CPU minutes charged)
#
# WHY THIS MATTERS: ~97% of the Vercel bill is "Build CPU Minutes" — every push
# rebuilds the whole Next.js app, including pushes that only touch scripts, skill
# files, planning docs, or DB migrations (none of which change the deployed site).
# This guard SKIPS those. Real app changes still deploy normally.
#
# HISTORY (2026-09-03): the original version of this script did `always build main`
# and only skipped PREVIEW branches. But we commit straight to main, so the guard
# never actually skipped anything for our workflow — every push rebuilt. That
# main-exemption is removed below: we now decide purely by WHICH PATHS changed,
# on any branch. (Skipping a doc/script-only commit on main is safe — nothing it
# changed is part of the deployed output, so production correctly stays put.)
#
# Wire-up (already set): Vercel → Project → Settings → Git → Ignored Build Step →
#   Behavior: "Run my Bash script"   Command: bash scripts/vercel-ignore-build.sh
#
# SAFETY: this DEFAULTS TO BUILD. It skips only when EVERY changed file matches the
# known-non-deployed list. Anything unexpected (a new top-level dir, a config file,
# no git history) falls through to a build — we never risk skipping a real change.

set -uo pipefail

# No parent commit (first deploy / shallow clone) -> build.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "-> no parent commit available: BUILD"
  exit 1
fi

CHANGED="$(git diff --name-only HEAD^ HEAD 2>/dev/null)"
if [ -z "$CHANGED" ]; then
  echo "-> no file changes detected: BUILD (safe default)"
  exit 1
fi

# Paths that can NEVER affect the deployed Next.js output. A commit touching only
# these is safe to skip. Deployed dirs (app/ components/ lib/ utils/ styles/
# public/ data/ sanity/) and root config files are deliberately absent, so any
# change to them triggers a build.
SKIP_RE='^(scripts/|\.claude/|plans/|docs/|tools/|design-assets/|secrets/|supabase/migrations/|\.github/|\.firecrawl/|scratch[-_]|README|LICENSE|\.gitignore$|\.gitattributes$)|\.md$'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if ! [[ "$f" =~ $SKIP_RE ]]; then
    echo "-> deployed path changed ($f): BUILD"
    exit 1
  fi
done <<< "$CHANGED"

echo "-> only non-deployed paths changed: SKIP (saving build-CPU minutes)"
echo "$CHANGED" | sed 's/^/   skipped: /'
exit 0
