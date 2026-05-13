#!/usr/bin/env bash
# Vercel "Ignored Build Step" script.
#
# Vercel runs this before every build. Exit codes:
#   0  → skip the build (no deploy)
#   1  → proceed with the build
#
# We skip the build when the commit ONLY touches paths that can't affect
# the deployed Next.js output:
#   - *.md files anywhere (docs)
#   - plans/**           (editorial planning notes)
#   - .claude/**         (Claude skills/agents)
#   - supabase/migrations/**  (applied manually to Supabase, not by deploy)
#   - .github/**         (GH Actions configs)
#   - README*, LICENSE*, .gitignore, .gitattributes
#
# Wire-up: Vercel Dashboard → Project → Settings → Git → Ignored Build Step:
#   bash scripts/vercel-ignore-build.sh
#
# Always build the production branch (main) to be safe — preview deploys
# are where we save the most spend anyway.

set -euo pipefail

# Always build production. Preview deploys are where the spend lives.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "main" ]]; then
  echo "→ main branch, always build"
  exit 1
fi

# git diff returns 0 when there are NO changes matching the path filter.
# We invert: if the only diffs are in the excluded paths, exit 0 (skip).
#
# Strategy: ask git "are there any changes OUTSIDE the ignored paths?"
# If yes → build. If no → skip.

# shellcheck disable=SC2016
CHANGED_RUNTIME_FILES=$(
  git diff --name-only HEAD^ HEAD 2>/dev/null \
    | grep -v -E '\.md$' \
    | grep -v -E '^plans/' \
    | grep -v -E '^\.claude/' \
    | grep -v -E '^supabase/migrations/' \
    | grep -v -E '^\.github/' \
    | grep -v -E '^README' \
    | grep -v -E '^LICENSE' \
    | grep -v -E '^\.gitignore$' \
    | grep -v -E '^\.gitattributes$' \
    || true
)

if [[ -z "$CHANGED_RUNTIME_FILES" ]]; then
  echo "→ only docs/plans/migrations changed, skipping build"
  exit 0
fi

echo "→ runtime files changed, proceeding with build:"
echo "$CHANGED_RUNTIME_FILES"
exit 1
