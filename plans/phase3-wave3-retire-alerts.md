# Phase 3 — Wave 3: retire the alerts table

**Status:** Draft for Jill's review
**Date:** 2026-05-22
**Estimated effort:** 4–7 days, split into 3 sub-waves
**Reversible:** Yes, at every sub-wave boundary

---

## Where we are

Wave 1 + Wave 2 are live. Every public-facing read on https://crazy4points.com sources from `content_variants + topics` via the AlertView adapter. The legacy `alerts` table is now a **write-only mirror** kept in sync by a dual-write trigger.

This wave inverts that: stop writing to alerts directly, write to variants instead, then drop the alerts table.

---

## What still writes to `alerts`

From the Wave 3 recon agent (see `plans/phase3-wave2-flip-read-path.md` for the read-path inventory):

### Admin UI (15+ server-action functions across 6 files)
- `app/admin/(protected)/alerts/actions.ts` — publish, approve, reject, regenerate, fact-check, voice-check, originality-check, quick-fix
- `app/admin/(protected)/alerts/new/actions.ts` — manual create
- `app/admin/(protected)/alerts/[id]/edit/actions.ts` — admin edit form
- `app/admin/(protected)/intel/actions.ts` — promote intel → alert (this page is already redirected to /triage, so its actions may be dead)
- `app/admin/(protected)/fact-checks/actions.ts` — reverify, revise
- `app/admin/(protected)/triage/actions.ts` — `writeAlertFromCandidate`

### Cron-triggered (2 API routes)
- `app/api/run-scout/route.ts` — nightly Scout findings → new alert rows
- `app/api/ingest-intel/route.ts` — manual intel POST → new alert rows

### Junction (still needed)
- `alert_programs(alert_id, program_id, role)` — primary/secondary tagging. Topics already store `programs[]` as slugs but with no role distinction. The junction stays in some form — see Open Questions.

---

## Three viable Wave 3 shapes

### Option A — "Just invert the writes" (narrow, recommended)
Stop writing to alerts; start writing to topics+variants. Reverse the dual-write trigger so it now flows variants→alerts (keeps the alerts table populated as a read-redundant safety mirror). Admin UI stays at `/admin/alerts` — same screens, same buttons, just different underlying table.

- **Scope:** ~2 days
- **Risk:** Medium — every admin action must be re-tested
- **Reversibility:** Flip the trigger back; alerts is still the source

### Option B — "Invert writes + drop table" (medium)
Option A, then after a bake period (1–2 weeks of clean prod), drop the alerts table outright. Stops the trigger. Admin UI still at `/admin/alerts`.

- **Scope:** ~3 days + 1–2 week bake
- **Risk:** Higher — once alerts is dropped, no fallback
- **Reversibility:** Pre-drop: full. Post-drop: only via DB snapshot restore

### Option C — "Invert + drop + rebrand admin to /admin/drafts" (wide)
Option B, plus rename and restructure the admin pages to be variant-first (sets up Phase 4 — Unified Drafts hub).

- **Scope:** ~5–7 days
- **Risk:** Higher — bigger UI surface to retest
- **Reversibility:** Pre-rebrand: full. Post-rebrand: rollback is a bigger PR

**My recommendation: Option A first.** It's the irreversible-bit (the write inversion) with the smallest blast radius. Bake on Option A for a week, then decide whether B and C are worth doing or whether the alerts table can just sit there forever as harmless redundancy.

---

## Wave 3a (Option A) — write-path inversion

### Strategy

The current dual-write trigger fires on every `alerts` INSERT/UPDATE and upserts a matching topic+variant. **We invert it.** A new trigger fires on every `content_variants` INSERT/UPDATE and upserts a matching alerts row.

Then we update every admin action to write to `content_variants + topics + alert_programs` directly. The trigger maintains the alerts row as a downstream mirror.

### Steps

**Step 1 — Inverse trigger (migration 323)**
Drops `alerts_dual_write_topics_variants` (the current alerts→variants trigger) and creates `variants_dual_write_to_alerts` (the new variants→alerts trigger). Both directions can't run simultaneously without infinite loops; this migration is the atomic switch.

- Fires AFTER INSERT OR UPDATE on `content_variants` (only `format='alert'` rows).
- For matching topic.slug, UPSERT the alerts row.
- pg_trigger_depth() = 0 guard prevents cascades.
- SECURITY DEFINER owned by postgres.

**Step 2 — Helper: `writeAlertVariant(supabase, draft)`**
New file: `utils/content/writeAlertVariant.ts`. Single function that takes the same fields the legacy alerts INSERT/UPDATE took, and instead writes them to topics + content_variants + alert_programs.

Every admin action that currently calls `createAlert()` or `updateAlert()` gets replaced with a call to this helper.

**Step 3 — Rewrite each admin action (one file at a time, one PR each)**
Migration order, lowest-risk first:

1. `app/admin/(protected)/intel/actions.ts` (dead path — redirect lives at /admin/intel; actions never fire). Confirm + delete.
2. `app/admin/(protected)/fact-checks/actions.ts` — reverify + revise (only edits existing rows)
3. `app/admin/(protected)/alerts/actions.ts` — split into mini-PRs by function group:
   - reject/soft-reject (status only)
   - voice/originality check (metadata only)
   - publish/approve (status + published_at + short_slug)
   - regenerate (the big one — writer + fact-check + multiple field updates)
4. `app/admin/(protected)/alerts/[id]/edit/actions.ts` — admin edit form
5. `app/admin/(protected)/alerts/new/actions.ts` — manual create
6. `app/admin/(protected)/triage/actions.ts` — `writeAlertFromCandidate`
7. `app/api/run-scout/route.ts` — Scout pipeline
8. `app/api/ingest-intel/route.ts` — manual intel POST

**Step 4 — Verification**
After all 8 ship and prod is clean:
- Run a comparison script: every variant published in last 24h has a matching alerts row with identical content. The inverse trigger should guarantee this.
- Compare random sample on `voice_pass`, `fact_check_claims`, `published_at` etc.

### What can break, and how we prevent it

| Risk | Prevention |
|---|---|
| Inverse trigger creates infinite loops with old trigger still active | Migration 323 drops the old trigger atomically before creating the new one |
| Admin action writes to alerts but we forgot to migrate it → silent drift | After 323 lands, alerts INSERT/UPDATE will FAIL via RLS or check constraint (TBD) to surface omissions immediately |
| Editorial metadata fields don't round-trip through the trigger correctly | Wave 2's existing variant.metadata.* preserves them; just need to mirror back to alerts columns on the inverse |
| `alert_programs` junction needs updating in parallel | Each action that writes programs goes through `setAlertPrograms()`; we update that helper to write the junction directly (it already does) |
| Public reads break because variants.published_at lags behind a publish click | Wave 2 reads from variants; publishing now writes variants directly, so reads update instantly |

### Rollback

- **Migration 323 breaks something:** apply migration 324 that swaps the trigger direction back to alerts→variants (mirror of 322).
- **An admin action PR breaks:** `git revert` the PR. The trigger continues operating on whichever direction was last set.
- Worst case: pause Wave 3a, restore prior state via `ALTER TABLE alerts ENABLE TRIGGER alerts_dual_write_topics_variants` and `DROP TRIGGER variants_dual_write_to_alerts`.

---

## Open questions for Jill

1. **Scope**: Option A, B, or C?
   - **My recommendation:** Option A (write inversion only) → bake → decide on B+C.
2. **`primary_program_id` durability**: today it's on alerts (and we preserve it on topic.metadata). After Wave 3a, do we promote it to a real column on `topics` for query simplicity? **Recommendation: yes, migration 324 adds `topics.primary_program_id uuid`.**
3. **Editorial metadata (voice_pass, fact_check_claims, etc.)**: keep them in `content_variants.metadata` jsonb forever, or promote the hottest fields to real columns?
   - **Recommendation:** Wave 3a keeps them in `metadata` (no schema churn). Phase 4 (Drafts hub) can promote them when we redesign the editorial UI.
4. **The 46 rejected/soft_rejected alerts NOT backfilled**: Wave 1 skipped them. Wave 3a doesn't change anything for them — they live on in the alerts table only and won't have variant equivalents. Bring them along now or leave as legacy-only?
   - **Recommendation:** Leave as legacy-only. They're already invisible to readers; no value in moving them.

---

## Refinements after Copilot + ChatGPT review (2026-05-22)

The plan above is the starting point. Five refinements integrated after review:

1. **Schema parity invariant** — migration 323 begins with a check: every `alerts` column maps to a variant column, topic column, or metadata key. If not, migration fails before flipping the trigger direction. See [phase3-domain-model.md](phase3-domain-model.md) invariant I1.
2. **Normalization in `writeAlertVariant()`** — arrays always `[]` (never `null`), booleans canonical, stable ordering on `fact_check_claims` + `programs`, canonical default shapes per metadata key.
3. **Program role enforcement** — helper is the only place that reconciles `topic.programs[]` ↔ `alert_programs(role)`. Primary derived from `topic.metadata.primary_program_id` during Wave 3a; after migration 324 authority transfers exclusively to the new `topics.primary_program_id` column with the metadata copy becoming compatibility-only.
4. **Parity harness is authoritative** — `scripts/phase3-wave3-parity-harness.mjs` gates every admin-action-rewrite PR. If the harness fails, the **rewrite is wrong** — never "fix" the harness to make a PR pass. See invariant I3.
5. **Alerts table reduction is the goal, not table elimination** — the long-term goal is to eliminate the semantic alerts schema. Whether the physical table is reduced to a thin compatibility projection (drop unused columns) or archived entirely depends on bake results. We do NOT carry both full schemas indefinitely.

Skipped per review:
- **Semantic checksum column** — brittle; parity harness gives field-level diff which is strictly stronger.
- **`alerts.last_migrated_at` timestamp** — tracks trigger execution, not correctness. Harness catches *correctness*; timestamp adds noise.

## Wave 3a definition of done

Wave 3a is **complete** when all four hold:

1. All 8 admin action files / cron routes write exclusively to `content_variants + topics + alert_programs` via `writeAlertVariant()` (zero direct alerts INSERT/UPDATE remaining).
2. Migration 323 has flipped trigger direction; the variants→alerts trigger is the only writer to alerts.
3. The parity harness shows **zero drift** for 24 continuous hours across every published row.
4. No `/admin/errors` entries reference the old write paths or the inverse trigger.

## Reading order

1. [phase3-domain-model.md](phase3-domain-model.md) — the canonical model + invariants (read first)
2. This plan
3. Migration 323 (paste-ready when you say go)

## Your next step (for Jill)

Read the domain model doc + this plan. Reply with:
- **"ship 323"** — I paste-ready migration 323 (schema parity check + trigger inversion) for you to apply
- **"questions:"** anything fuzzy
- **"narrower"** / **"wider"** — adjust scope
