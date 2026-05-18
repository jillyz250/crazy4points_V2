# Scout Cron Health Diagnosis — 2026-05-18

Cosmo's diagnostic report on why the Scout daily cron produces findings but `items_produced` never increments, with a 5-bug fix list. Felix implements these in one PR.

## Symptoms

- Scout cron runs daily at 10:00 UTC and inserts rows into `intel_items`.
- `sources.items_produced` counter stays at 0 for most sources even when their
  findings DO land in `intel_items`.
- Hostile domains (Delta, Marriott Brand) return empty markdown via Firecrawl
  and silently drop out of the run.
- All 201 sources are sent to Haiku in a single call — attention dilution makes
  some sources get ignored.

## Bugs (priority order)

### 1. Source attribution by name string (CRITICAL)

`app/api/run-scout/route.ts` ~L152 matches findings back to sources by
`finding.source_name === source.name`. Haiku paraphrases names
("Reddit r/awardtravel" → "r/awardtravel", "View From The Wing" →
"ViewFromTheWing"), so attribution silently fails. The `items_produced`
counter never increments even though the finding DID land in `intel_items`.

**Fix:** Haiku returns the source's `source_id` (UUID) for each finding;
matching uses `source_id === source.id`. Keep name-match as a logged fallback.

### 2. No telemetry for attribution failures

We have no visibility into how often Haiku returns a name that doesn't match a
known source. Add `console.warn` records when attribution fails so failures
show up in Vercel logs.

### 3. All sources in one Haiku call

201 sources × ~2K chars = ~400K input tokens. Haiku's effective attention
budget makes it skip whole sources. Chunk into batches of 20, run in parallel,
merge findings.

### 4. Firecrawl failure modes collapsed to empty string

`fetchFirecrawl` returns `''` for 6 different failure modes (no key, timeout,
bot wall, redirect trap, empty payload, generic error). Callers can't tell
"actually empty" from "bot-walled" — so they can't retry with stealth on
bot walls. Change return type to discriminated union.

### 5. No stealth retry for hostile domains

When Firecrawl hits a bot wall, retry once with `stealth: true`. Also
maintain a hostile-domain allowlist (delta.com, marriott.com) that ALWAYS
uses stealth on the first call.

## Verification

- `npx tsc --noEmit` passes
- Manual POST /api/run-scout shows batched Haiku calls in logs
- `items_produced` increments on next intel item
- Marriott News Center attempts stealth retry on bot wall
