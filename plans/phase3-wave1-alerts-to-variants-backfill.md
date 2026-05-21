# Phase 3 — Wave 1: Alerts → Variants backfill + dual-write

**Status:** Draft for Jill's review
**Date:** 2026-05-21
**Estimated effort:** 1–2 days
**Reversible:** Yes, at every step

---

## Goal

Make `content_variants` hold a faithful copy of every alert that matters (published, expired, in-flight), and keep it in sync as new alerts are created or edited. **No public-facing change.** The site keeps reading from `alerts` exactly like today.

Wave 1 is the safety net that makes Wave 2 (flipping the public read path) low-risk.

---

## Scope

### In scope (Wave 1)
1. Backfill **62 alert rows** → matching `topics` + `content_variants` rows
2. Dual-write trigger: any new or edited alert auto-syncs to topics/variants
3. Verification script that confirms backfill is complete
4. Spot-check sample variants in `/admin/topics` look right
5. Run integration test against real production DB

### Out of scope (deferred to Wave 2 / 3)
- Changing what the public site reads (Wave 2)
- Moving editorial UI from `/admin/alerts` to a Drafts hub (Wave 3)
- Dropping the `alerts` table (Wave 3+)
- Building social variants from these topics (Phase 4.5)

---

## What gets backfilled, what gets skipped

| Status | Count | Backfill? |
|---|---|---|
| `published` | 19 | Yes |
| `expired` | 17 | Yes |
| `pending_review` | 25 | Yes |
| `draft` | 1 | Yes |
| `rejected` | 29 | **No** |
| `soft_rejected` | 17 | **No** |

**Total: 62 rows in, 46 rows skipped.**

Skipped rows can be backfilled later if anyone changes their mind — there's no irreversible step.

---

## Column mapping (alerts → topics + variants)

Today an alert has ~45 columns. In the new world, each alert becomes **one topic row + one variant row** with `format='alert'`.

### Fields that go on the **topic** (facts about the story)
- `title` → `topics.title`
- `summary` → `topics.summary`
- `slug` → `topics.slug` *(copied verbatim — SEO contract)*
- `type` → `topics.topic_type`
- `source_url` → `topics.source_urls[0]`
- `programs` (via `alert_programs` junction) → `topics.programs[]`
- `end_date` → `topics.end_date`
- `fact_check_claims` → `topics.fact_ledger`
- `fact_check_at` → `topics.verified_at`
- `confidence_level`, `impact_score`, `value_score`, `rarity_score`, `computed_score`, `impact_justification`, `is_hot`, `why_this_matters` → `topics.metadata.editorial_scores` (jsonb)

### Fields that go on the **variant** (one specific format of the story)
- `title` → `content_variants.title` *(same as topic for the alert variant)*
- `description` → `content_variants.body`
- `status` → `content_variants.status` *(direct map; both use draft/needs_review/approved/published/archived — need to map `pending_review` → `needs_review`, `rejected` → `archived`)*
- `published_at` → `content_variants.published_at`
- `voice_pass`, `voice_score`, `voice_notes`, `voice_checked_at` → `content_variants.brand_voice_run` + `content_variants.metadata.voice` (jsonb)
- `format` → hardcoded `'alert'`
- `surface_locations` → computed by existing trigger
- Everything else (registration_required, action_type, terms_waived_reason, revision_log, history_note, etc.) → `content_variants.metadata` (jsonb catch-all)

### Status mapping
| alerts.status | variants.status |
|---|---|
| `draft` | `draft` |
| `pending_review` | `needs_review` |
| `published` | `published` |
| `expired` | `published` *(URL still live + Google-indexed; `topics.end_date` indicates staleness)* |
| `rejected` | (skipped) |
| `soft_rejected` | (skipped) |

---

## Implementation steps

### Step 1 — Backfill script (paste-only, no code change)
File: `scripts/phase3-backfill-alerts-to-variants.mjs`

For each alert with status in (`published`, `expired`, `pending_review`, `draft`):
1. Idempotent check: does a topic with this slug already exist? If yes, skip (re-runs safe).
   - **Slug collision warning:** if topic exists with same slug but different `topic_type`, print `⚠️  <slug>: topic exists with topic_type=X, alert wants topic_type=Y` and skip.
2. Insert topic row with mapped columns above.
   - `topics.metadata.editorial_scores.source = 'alerts_backfill'` marker so future debugging can distinguish backfilled vs native rows.
3. Insert variant row with `topic_id = new_topic.id`, `format = 'alert'`.
   - `metadata._backfill_fields = [...]` — array of which alert column names landed in `metadata` (drift detection).
   - `metadata.source_hash = sha256(title + '|' + description)` — cheap diff mechanism for later.
4. Print: `[backfill] <slug> → topic <topic_id>, variant <variant_id>`
5. For skipped rejected/soft_rejected rows, print `[skip] <slug> (status=<status>)`.
6. At end: print summary `Backfilled X of Y eligible alerts. Skipped Z.`

**Dry-run mode:** `--dry-run` flag prints what it would do without writing. Required for first run.

### Step 2 — Dual-write trigger (migration 317)
File: `supabase/migrations/317_phase3_wave1_alerts_dual_write.sql`

A Postgres trigger on `alerts` (after insert OR update). When fired:
- **Guard:** `IF pg_trigger_depth() <> 0 THEN RETURN NEW; END IF;` — prevents cascading updates during bulk SQL cleanup.
- If alert.status not in (`rejected`, `soft_rejected`), upsert matching topic + variant rows. Variant is uniquely identified by `(topic_id, format='alert')`.
- If alert.status changes TO `rejected` or `soft_rejected`, set `content_variants.status = 'archived'` AND `archived_at = now()` for audit.
- Trigger is `SECURITY DEFINER` owned by `postgres` (not `service_role`).

Why a trigger and not application code: trigger guarantees sync even when alerts are edited via SQL (which Jill does for ASCII-cleanup migrations). Application code can drift.

### Step 3 — Verification script
File: `scripts/phase3-verify-wave1.mjs`

Runs the following checks. All must pass:
1. Every alert with status in (`published`, `expired`, `pending_review`, `draft`) has a matching variant (`format='alert'`, same slug via topic).
2. Variant counts equal eligible alert counts (no orphans, no duplicates).
3. Sample 5 published alerts — variant.body matches alert.description, variant.title matches alert.title.
4. No topic has duplicate variants for `format='alert'`.
5. `topics.slug = alerts.slug` byte-for-byte (catches ASCII normalization drift).
6. `topics.programs[]` matches the `alert_programs` junction for that alert (set equality, order-independent).

Prints `✅ Wave 1 verified` or `❌ Wave 1 failed: <reason>`.

### Step 4 — Spot-check in admin
- Open `/admin/topics` — confirm the 62 new topic rows appear
- Open 3 random topics — confirm the alert-variant has correct title + body
- Confirm no public site changes (refresh `/alerts` — list should be identical)

### Step 5 — Integration test
Write `app/api/dev/test-phase3-wave1/route.ts` (dev-only, deletes itself when Wave 1 lands on main). It:
1. Creates a test alert via the normal admin code path
2. Confirms a topic + variant get auto-created by the trigger
3. Updates the alert title
4. Confirms the variant title updates too
5. Soft-rejects the alert
6. Confirms the variant flips to `archived` with `archived_at` set
7. Revives the alert (status → `pending_review`) and confirms variant returns to `needs_review`
8. Cleans up

---

## Rollback plan

If anything goes wrong:
- **Backfill bad data:** `DELETE FROM content_variants WHERE created_at >= '<backfill-start>' AND format='alert'; DELETE FROM topics WHERE created_at >= '<backfill-start>';`
- **Trigger misbehaves (debug):** `ALTER TABLE alerts DISABLE TRIGGER alerts_dual_write_topics_variants;` — safer than DROP; lets you re-enable after fixing.
- **Trigger fully broken:** `DROP TRIGGER alerts_dual_write_topics_variants ON alerts;`
- Public site is unaffected by either rollback (we haven't changed read paths).

---

## Acceptance criteria (must all hold before declaring Wave 1 done)

1. Backfill script ran successfully against prod; 62 variants created
2. Verification script returns ✅
3. Integration test passes end-to-end
4. Spot-check in /admin/topics looks right
5. Public `/alerts` and `/alerts/[slug]` render identically to before
6. New alerts created in /admin/alerts auto-sync to variants (verified manually with one test alert)

---

## Open questions — resolved per Copilot review

1. **Status mapping for `expired`** → map to `published`, rely on `topics.end_date` for staleness. ✅ Adopted in mapping table above.
2. **Soft-rejected revival** → no Wave 1 work; Wave 3 adds a "revive" action that flips variant back to `needs_review`. ✅
3. **Trigger chatty updates** → `pg_trigger_depth() = 0` guard added to the trigger definition above. ✅

---

## Your next step (for Jill)

Say **"ship wave 1"** and I'll execute the steps in order, testing each one before moving to the next.
