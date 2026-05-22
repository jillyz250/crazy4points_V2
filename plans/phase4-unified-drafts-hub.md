# Phase 4 — Unified Drafts hub

**Status**: draft (2026-05-22)
**Prereqs**: Phase 3 Wave 3a shipped (`content_variants + topics` is the source of truth; `alerts` is a downstream mirror gated by the G6 block trigger).
**Goal**: rebrand `/admin/alerts` as `/admin/drafts`, promote hot editorial fields out of `variant.metadata` jsonb into real columns, and lay the groundwork for blog + social variants to live in the same hub.

**Strategic framing**: this is the phase where the system stops being an alerts app and becomes a content operations system. The architectural decisions here should anticipate multiple coexisting formats (alert, blog, social, newsletter) and their independent lifecycles — not optimize for the single-format world we're leaving behind.

---

## Why now

- Wave 3a inverted writes — every editorial action now flows through `content_variants`. The page title "Alerts" is a lie; we're editing variants whose `format='alert'` happens to be one of several upcoming formats.
- Hot fields like `voice_pass`, `confidence_level`, `action_type`, `start_date`, `original_alert_type` live in `variant.metadata` jsonb today. That's fine for read-on-load, but breaks every list view that wants to filter/sort by them (you can't index a jsonb scalar without a functional index per key — and we're adding more keys).
- Phase 4.5 (social variants) and the future blog editor both want the same chrome: gate banner, pills, fact-check accordion, override audit log. Unifying the hub now means we build that surface once and reuse it.

---

## Current state — what's where

**`content_variants` columns** (live):
`id, topic_id, format, status, title, body, generation_prompt_version, generated_by, edited_by, brand_voice_run, fact_check_run, fact_check_results, surface_locations, publish_target_url, archived_at, published_at, created_at, updated_at, metadata`

**`variant.metadata` keys** (sampled across 3 live alerts):
`_backfill_fields, action_type, alerts_source, confidence_level, gaps, last_verified, original_alert_type, registration_required, short_slug, source, source_hash, start_date, voice_pass, voice_score`

**`topic.metadata` keys** (live, hot ones):
`source_intel_id, primary_program_id, original_alert_id, archive_reason, verified_terms, terms_waived_reason, end_date, source_url, history_note, why_this_matters`

The variants↔alerts trigger maps both sides into `alerts.*` columns; the trigger is the only thing tying alerts column names to where the data physically lives now.

---

## Step 1 — Promote hot fields to real columns

### Preflight (run before authoring the migration)

`scripts/phase4-preflight.mjs` must pass before PR #1 is opened:

```sql
-- 1. short_slug uniqueness
SELECT short_slug, COUNT(*)
  FROM content_variants
  WHERE format='alert' AND short_slug IS NOT NULL
  GROUP BY short_slug HAVING COUNT(*) > 1;
-- Expected: 0 rows. If >0, generate/fix duplicates manually before migration.

-- 2. short_slug null count (informational; column will be NULLABLE UNIQUE)
SELECT COUNT(*) FROM content_variants WHERE format='alert' AND short_slug IS NULL;

-- 3. Required-but-currently-missing fields (will block NOT NULL columns)
SELECT id FROM content_variants
  WHERE format='alert' AND (metadata->>'action_type') IS NULL;
-- Expected: 0. If >0, backfill action_type from intel before migration.
```

### Migration `supabase/migrations/327_phase4_promote_variant_fields.sql`

Promoted columns + **nullability contract (Invariant V2)**:

**Important — all promoted columns ship NULLABLE in migration 327.** NOT NULL flips happen in a follow-up migration (`329_phase4_tighten_nullability.sql`) only after the bake reveals real null rates. Hidden edge cases (imported junk rows, abandoned drafts, ancient test fixtures, partial failed writes, manual SQL edits) make day-one NOT NULL a needless rollback hazard. The "Target nullable?" column below documents the *future* shape, not the migration-327 shape.

| Column | Type | Migration 327 | Target (post-bake) | Reason |
|---|---|---|---|---|
| `voice_pass` | `boolean` | nullable (default false) | NOT NULL DEFAULT false | Always computed by voice run |
| `voice_score` | `numeric(3,2)` | nullable | nullable | Only exists after voice run |
| `confidence_level` | `text` (CHECK NOT VALID) | nullable | nullable | Not all alerts have it |
| `action_type` | `text` (CHECK NOT VALID) | nullable | NOT NULL | Always set on alerts (verify post-bake) |
| `original_alert_type` | `text` | nullable | nullable | Legacy-only |
| `start_date` | `date` | nullable | nullable | Many alerts have no start |
| `short_slug` | `text` | nullable, scoped-unique | nullable, scoped-unique | `UNIQUE(format, short_slug) WHERE short_slug IS NOT NULL` — see scoping subsection |
| `variant_schema_version` | `int` | NOT NULL DEFAULT 1 | NOT NULL DEFAULT 1 | Safe to land NOT NULL day-one because the migration's own backfill sets it for every row |

`COMMENT ON COLUMN content_variants.variant_schema_version IS 'Tracks structural/editorial schema generation for format-aware variant evolution. Bumped when a format diverges from v1 shape (e.g. social v2 adds image_url required). Always set explicitly by writeAlertVariant — see VSV1.';`

CHECK constraints use `NOT VALID` initially; a separate `VALIDATE CONSTRAINT` step in migration 329 finalizes them. Even at our current row count this is the right hygiene — validation scans can lock longer than expected once the table grows.

### `short_slug` scoping (do NOT make globally unique)

A global `UNIQUE(short_slug)` would prevent the editorial team from authoring an `alert` and a `blog` that share the slug `amex-transfer-bonus` — which is exactly what they will reasonably want once blog + social variants exist. Same applies to localization and A/B headlines if those ever land.

Use a **partial composite index** instead:

```sql
CREATE UNIQUE INDEX idx_variant_short_slug_scoped
  ON content_variants(format, short_slug)
  WHERE short_slug IS NOT NULL;
```

Properties:
- Multiple `NULL` slugs allowed (formats that don't use short URLs).
- One slug per format — alert + blog can share `amex-transfer-bonus`.
- No global uniqueness invariant frozen in too early — the "right" scope (per-format vs per-topic vs per-locale) is still being learned.

### `confidence_level` / `action_type` — transitional typing

CHECK constraint with the current value set is fine for Phase 4. Be explicit that this is **transitional** typing, not final: once multiple pipelines write variants (alert pipeline, blog generator, social rewrites, human editorial, partner imports), stringly-typed taxonomies drift (`medium` / `med` / `moderate`). Eventual move to Postgres enums or a lookup table is a Phase 5/6 cleanup, not blocking now.

Promoted off `topic.metadata` → `topics` columns:
| Column | Type | Nullable? | Reason |
|---|---|---|---|
| `verified_terms` | `text` | nullable | Editor-pasted, optional |
| `terms_waived_reason` | `text` | nullable | Mutually exclusive with verified_terms |
| `end_date` | `date` | nullable | Many topics open-ended |

### Migration ordering (critical — Invariant A1 protection)

Migration 327 **must** execute in this exact order inside one transaction:

1. `ALTER TABLE content_variants ADD COLUMN ...` — all nullable; `variant_schema_version` gets `NOT NULL DEFAULT 1` (safe because the default populates every row immediately)
2. Backfill: `UPDATE content_variants SET col = (metadata->>'key')::type WHERE format='alert'`
3. Add CHECK constraints as `NOT VALID` (no scan, no lock escalation)
4. Add indexes (concurrent isn't possible inside a transaction; small table so this is fine for us — will revisit if row count crosses ~50k)
5. **Then** `CREATE OR REPLACE FUNCTION` to update the trigger to read columns first via COALESCE
6. `COMMENT ON COLUMN ...` for `variant_schema_version`

**Why this order (Invariant A1)**: if step 5 runs before step 2, the trigger sees `NEW.voice_pass = NULL` on an existing-row UPDATE before backfill, and COALESCE falls through to metadata. New INSERTs landing during the migration window would skip the backfill and write `NULL` columns. Keeping all of it in one transaction sidesteps that entirely.

NOT NULL flips + `VALIDATE CONSTRAINT` happen in migration 329 *after* the bake — never in 327.

### Dual-write invariants

**V1 — symmetric dual-write**: while metadata keys are still being written, the invariant is:
> If column is non-null, `metadata->>key` must equal the column. Metadata may lag only when column is null.

`writeAlertVariant.ts` writes both column and metadata key in a single object literal — no conditional branches. This guarantees same-transaction symmetry.

**V2 — nullability per table above**. Migration enforces via NOT NULL + CHECK constraints.

### Helper updates — `utils/content/writeAlertVariant.ts`

- `writeAlertVariant()` writes both column AND metadata key in a single object literal — no conditional branches (Invariant V1 protection)
- **Invariant VSV1** — `writeAlertVariant()` must always set `variant_schema_version` explicitly (default `1` for alert format). No silent drift on the version field
- **Invariant A3** — dual-write metadata only when `variant_schema_version === 1`. Schema v2+ writes columns only. Gives us a clean escape hatch when blog/social diverge
- Read paths (the trigger, `selectAlertViewFromVariants`, parity harness) prefer the column with COALESCE fallback to metadata
- `findVariantByAlertId` selects the new columns

### Parity harness — `scripts/phase3-wave3-parity-harness.mjs`

Three new gates — note **G8** is behavioral, not field-level:

- **G7** — promoted columns equal `metadata->>key` for keys still being dual-written. Fails parity if either side drifts.
- **G7a** — strict symmetry: `column IS NULL OR column::text = metadata->>key`. Catches the case where someone wrote the column but forgot the metadata key.
- **G8 — behavioral parity** (new category). Field equality isn't enough; the dangerous bugs are *write-path asymmetries*: one path trimming whitespace, one path coercing booleans differently, one path omitting nulls, one path overwriting metadata accidentally. Tests run as a CI gate (not on every prod row) against fixed fixtures:

  | Scenario | What it catches |
  |---|---|
  | old path → new path edit | overwrite asymmetry (does the new-path edit clobber metadata the old path set?) |
  | new path → old path edit | metadata-drift detection (does the old-path edit re-introduce stale jsonb keys?) |
  | null → value → null transitions | missing cleanup logic (do columns get nulled when metadata gets removed?) |
  | partial update (only `voice_pass`) | accidental field resets (do other columns stay intact?) |
  | concurrent-ish update (two updates back-to-back on different fields) | stale-merge behavior in the helper |
  | clean insert via helper | baseline — no normalization differences |

  Field-level diff: every column + every metadata key. Any trim/casing/null-vs-missing difference fails the gate. Real bugs appear in mixed-deploy windows, stale admin tabs, and partial form submissions — not in clean inserts.

G7+G7a+G8 all must pass for 7 consecutive days before Step 4 cleanup is allowed.

### Operational indexes (ship in migration 327, not later)

Index the queries we know the drafts hub will hammer — but avoid index-hoarding. Skip standalone low-cardinality columns (`confidence_level`, `action_type`) — they're rarely selective enough alone; the composite list-view index already covers the common filter combinations:

```sql
-- Drafts hub list view: filter by format + status, sort by updated_at
-- Also covers (format, status, confidence_level) chip combinations via prefix
CREATE INDEX idx_variants_format_status_updated
  ON content_variants(format, status, updated_at DESC);

-- "Show me drafts that failed voice"
CREATE INDEX idx_variants_voice_failures
  ON content_variants(format, voice_pass)
  WHERE voice_pass = false;

-- Sort/filter by quality score
CREATE INDEX idx_variants_voice_score
  ON content_variants(format, voice_score DESC NULLS LAST)
  WHERE voice_score IS NOT NULL;

-- Date-window queries (Phase 5 lifecycle)
CREATE INDEX idx_variants_start_date
  ON content_variants(start_date)
  WHERE start_date IS NOT NULL;

-- short_slug partial unique (also serves as the lookup index)
CREATE UNIQUE INDEX idx_variant_short_slug_scoped
  ON content_variants(format, short_slug)
  WHERE short_slug IS NOT NULL;

-- topic-side lifecycle queries
CREATE INDEX idx_topics_end_date
  ON topics(end_date)
  WHERE end_date IS NOT NULL;
```

**Deliberately not added** (revisit with EXPLAIN ANALYZE in 30 days):
- standalone `(confidence_level)` — low cardinality, planner usually skips
- standalone `(action_type)` — same. If filtering proves slow, add `(format, status, confidence_level, updated_at DESC)` as a tuned composite instead of two separate indexes.

Six indexes total. Every index is write amplification + vacuum overhead + planner complexity — these six are the proven-hot ones, no more.

**Output**: 1 migration + preflight script + helper update + harness gates. ~40-50 min.

---

## Step 2 — `/admin/drafts` route + URL alias

**New route** `app/admin/(protected)/drafts/page.tsx`:
- Identical to current `/admin/alerts` list visually, but reads variants directly + filters by `format` query param (default = all)
- Format chip: Alert | Blog | Newsletter | Social (greyed out until those variants exist)
- Status chip: Draft | Needs review | Published | Rejected | Archived
- Sort: updated_at desc | voice_score desc | start_date asc
- Filter: confidence_level, action_type, voice_pass=false-only ("show me failures"), program

**Compatibility**:
- `/admin/alerts` → stays live as alias; `redirect('/admin/drafts?format=alert')` in `app/admin/(protected)/alerts/page.tsx`. Old bookmarks keep working.
- `/admin/alerts/[id]/edit` stays live as-is (it's already variant-shaped after Wave 3a)
- Nav swap: "Alerts" → "Drafts" in `components/admin/AdminNav.tsx`

**UX invariant D1** — `/admin/drafts` (no query param) shows **all formats** by default. The legacy alias `/admin/alerts` is the only path that lands on `?format=alert`. This prevents future editors from accidentally filtering to alerts-only and missing blog/social drafts.

**Output**: 1 PR. New page + nav swap + redirect. ~1 hr.

---

## Step 3 — Format-aware editor surface (deferred to Phase 4.5)

The editor pane today is `app/admin/(protected)/alerts/[id]/edit/EditAlertForm.tsx`. It's already variant-shaped. Phase 4.5 will introduce blog + social formats; each gets its own editor that reuses:
- `PublishGatesBanner` (already format-agnostic)
- `FactCheckWarnings` (already variant-driven)
- `PipelineActionsPanel` (needs a small refactor to drop alert-specific copy)
- Pills row (move out of EditAlertForm into `components/admin/drafts/DraftPills.tsx`)

**Not in Phase 4** — flagged for Phase 4.5.

---

## Step 4 — Drop the `metadata` keys (cleanup)

After Step 1 has been live for ~7 days and parity gates G7+G7a are clean.

### Gate G7b — no recent metadata-key writes (preflight before cleanup)

Before running the cleanup migration, verify no code path is still writing the metadata keys. The parity harness ensures *equality*, not *absence-of-writes*. Run:

```sql
SELECT COUNT(*) FROM content_variants
  WHERE updated_at > now() - interval '48 hours'
    AND (metadata ? 'voice_pass'
         OR metadata ? 'voice_score'
         OR metadata ? 'confidence_level'
         OR metadata ? 'action_type'
         OR metadata ? 'original_alert_type'
         OR metadata ? 'start_date'
         OR metadata ? 'short_slug');
```

Expected: 0. If >0, search the codebase for the remaining writer (look for `metadata: { ...prev, voice_pass:` patterns) and rip it out before cleanup. **Don't run the cleanup migration if G7b fails** — you'd silently kill data on the very next write from the lagging code path.

### Migration `328_phase4_cleanup_metadata.sql`

- `UPDATE content_variants SET metadata = metadata - 'voice_pass' - 'voice_score' - ...`
- `CREATE OR REPLACE FUNCTION` for the trigger to read only the columns (drop COALESCE fallback)
- Drop the dual-write from `writeAlertVariant.ts`
- Remove G7+G7a gates from the parity harness (no longer applicable)

**Output**: 1 PR. Cleanup migration + trigger simplification + helper diff. ~20 min.

---

## Rollout

| PR | Touches | Risk | Test |
|---|---|---|---|
| #1 — promote fields (all nullable) | migration 327, writeAlertVariant.ts, harness G7/G7a/G8, preflight script | Medium (schema + trigger, all nullable + NOT VALID checks) | preflight returns 0 rows; parity harness G7+G7a+G8 clean post-migration |
| #2 — `/admin/drafts` route | new page, AdminNav, redirect on /admin/alerts | Low (UI only) | manual: load `/admin/alerts` → land on `/admin/drafts?format=alert`; filter chips work; D1 invariant holds (bare `/admin/drafts` shows all formats) |
| #3 — metadata cleanup | migration 328, trigger, helper | Low (only after #1 baked 7 days) | G7b returns 0; parity harness stays clean post-drop |
| #4 — tighten nullability | migration 329 (NOT NULL flips + `VALIDATE CONSTRAINT`) | Low (only after #3 confirms zero nulls on target-NOT-NULL columns) | `SELECT COUNT(*) WHERE col IS NULL` returns 0 for each tightened column before the flip |

Total: 4 PRs over ~2 weeks, with a 7-day bake gap between #1 and #3, and a real-world data verification before #4.

### Rollback rule R1 — PR #1 revert

If PR #1 needs to be reverted:

- **If no writes touched the new columns yet** (check `updated_at` vs migration timestamp on `content_variants`): safe to drop the columns + revert trigger + revert helper.
- **If writes have landed on the new columns**: do **not** drop the columns — you'd lose any column-only data. Instead: revert the trigger to its pre-327 form (reads metadata only), revert the helper, and **leave the columns in place**. They become dead weight until you decide to re-attempt the promotion or finalize the rollback with an explicit second migration that nulls out + drops them.

This rule protects against the case where a single editor saves between merge and rollback — that single save would write `voice_pass` as a column-only value, and a naive `DROP COLUMN` would lose it.

---

## Forward-looking — Invariant F1 (Phase 4.5 setup)

Once columns exist per format, the natural next step is typing `content_variants` as a discriminated union by `format`. Add **Invariant F1** as a forward marker (not enforced in Phase 4, but called out so Phase 4.5 inherits it cleanly):

> Each `format` value declares its required-non-null fields. Enforce on write (helper layer) + in the parity harness + in the editor UI.

Initial table:

| Format | Required non-null fields |
|---|---|
| `alert` | `action_type`, `voice_pass`, `topic_id`, `title`, `body` |
| `blog` | `topic_id`, `title`, `body` (no `action_type`) |
| `facebook`/`instagram`/`linkedin`/`x`/`threads` | `topic_id`, `body`, `publish_target_url` (set post-publish) |

This is the missing layer that makes Phase 4.5's per-format editors validate cleanly. Not in Phase 4 scope; flagged here so the column-promotion work lands the foundation correctly.

---

## Out of scope (explicit)

- Blog editor surface → Phase 4.5
- Social variant generators → Phase 4.5
- Image generation → Phase 4.5
- Editor pane refactor → Phase 4.5 (after blog format exists to motivate it)
- Removing `alerts` table → Phase 6 / Wave 3b, after observation period

---

## Invariants summary (one-screen cheat sheet)

| ID | Invariant | Enforced in | Status |
|---|---|---|---|
| V1 | Column non-null ⇒ `metadata->>key` matches | `writeAlertVariant.ts` writes both, harness G7a verifies | New in Phase 4 |
| V2 | Per-table nullability contract (target post-bake; migration 327 ships all-nullable) | Migration 329 (NOT NULL flips, VALIDATE CONSTRAINT) | New in Phase 4 |
| A1 | Trigger rewrite must occur after backfill inside the same transaction | Migration 327 statement ordering | New in Phase 4 |
| A2 | Cleanup (drop metadata keys) must check 48h zero-writes first | Preflight before migration 328 (= G7b) | New in Phase 4 |
| A3 | Helper dual-writes metadata only when `variant_schema_version === 1` | `writeAlertVariant.ts` | New in Phase 4 |
| S1 | Variant with `short_slug` must have a `publish_target_url` incorporating it | `writeAlertVariant.ts` + publish action; harness G9 | New in Phase 4 |
| VSV1 | `writeAlertVariant` always sets `variant_schema_version` explicitly | `writeAlertVariant.ts` | New in Phase 4 |
| D1 | Bare `/admin/drafts` shows all formats | Route handler | New in Phase 4 |
| G7 | Promoted column = `metadata->>key` (or metadata is null) | Parity harness | New in Phase 4 |
| G7a | Strict: column non-null ⇒ metadata matches | Parity harness | New in Phase 4 |
| G7b | No metadata writes in last 48h before cleanup | Preflight before migration 328 | New in Phase 4 |
| G8 | Write-path behavioral parity (fixture diff, not field diff; 6 scenarios) | Parity harness, CI gate | New in Phase 4 |
| R1 | PR #1 rollback: drop columns only if no writes occurred | Manual gate at rollback time | New in Phase 4 |
| F1 | Per-format required-field table (forward) | Phase 4.5 (helper + editor + harness) | Marker only |
| I3 | Variant ↔ alert parity (existing) | `phase3-wave3-parity-harness.mjs` | Already enforced |
| I7 | `alerts.id` stable across topic rewrites (existing) | `topic.metadata.original_alert_id` | Already enforced |

---

## Open questions

1. **Hard rename vs alias** — alias is in this plan (recommended). Flip to hard rename if you decide bookmarks aren't load-bearing.
2. **`short_slug` scoping** — **NOT** globally unique. Partial composite index `UNIQUE(format, short_slug) WHERE short_slug IS NOT NULL` so alert + blog + social can share the same slug. Preflight verifies no duplicate `(format, short_slug)` pairs in current data before the index is added.
3. **`fact_check_claims` storage** — lives on `topic.fact_ledger` post Wave 3a. Stays there (it's per-topic, not per-variant). Promoted column is *not* needed; trigger already mirrors to `alerts.fact_check_claims` for the read path.
4. **`variant_schema_version` semantics** — initialized to 1 for all current rows. Phase 4.5 bumps it for new formats that diverge from the v1 shape. Not used by any read path yet; cheap insurance for the inevitable format evolution.
5. **What stays in metadata jsonb** — explicit non-goal to flatten everything. These keep their jsonb home: `gaps`, `_backfill_fields`, `source_hash`, `alerts_source`, `last_verified`, transient AI annotations, importer debris. The promotion list is short on purpose.
