#!/usr/bin/env bash
# vercel-should-build.sh — Vercel "Ignored Build Step" guard.
#
# WHY THIS EXISTS: 97% of the Vercel bill is "Build CPU Minutes" ($82 in Sep 2026)
# — every git push rebuilds the entire app, even pushes that only touch scripts,
# skills, docs, or migrations (none of which are part of the deployed site). This
# guard SKIPS the build when a push changed ONLY non-deployed paths, so those free
# up build minutes. Any change to real app code still deploys normally.
#
# VERCEL CONVENTION (do not "fix" this — it is intentional and inverted):
#   exit 1  -> BUILD  (proceed with deployment)
#   exit 0  -> SKIP   (cancel the build, no build minutes charged)
#
# HOW TO ENABLE (one-time, in the Vercel dashboard — Claude can't set this for you):
#   Project -> Settings -> Git -> "Ignored Build Step" -> "Run my Bash script"
#   Command:  bash scripts/vercel-should-build.sh
#
# SAFETY: this DEFAULTS TO BUILD. It only skips when EVERY changed file matches the
# known-safe list below. Anything unexpected (a new top-level dir, a config change,
# no git history) falls through to a build — we never risk skipping a real change.

set -uo pipefail

# No parent commit (first deploy, shallow clone with depth 1, etc.) -> build.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "vercel-should-build: no parent commit available -> BUILD"
  exit 1
fi

CHANGED="$(git diff --name-only HEAD^ HEAD)"
if [ -z "$CHANGED" ]; then
  echo "vercel-should-build: no file changes detected -> BUILD (safe default)"
  exit 1
fi

# Paths that NEVER affect the deployed Next.js site. A push touching only these is
# safe to skip. Keep this list conservative: when in doubt, leave a path OFF the
# list so it triggers a build. (Deployed dirs like app/ components/ lib/ utils/
# styles/ public/ data/ sanity/ and root config files are deliberately absent.)
SKIP_RE='^(scripts/|\.claude/|plans/|docs/|tools/|design-assets/|secrets/|supabase/migrations/|\.firecrawl/|scratch[-_]|[^/]*\.md$)'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if ! [[ "$f" =~ $SKIP_RE ]]; then
    echo "vercel-should-build: deployed path changed ($f) -> BUILD"
    exit 1
  fi
done <<< "$CHANGED"

echo "vercel-should-build: only non-deployed paths changed -> SKIP (saving build minutes)"
echo "$CHANGED" | sed 's/^/  skipped: /'
exit 0
