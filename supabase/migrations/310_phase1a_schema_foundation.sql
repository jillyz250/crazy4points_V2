-- Phase 1a — Schema foundation for content-pipeline overhaul.
-- See plans/content-pipeline-overhaul-2026-05-20.md (v9).
--
-- Pure additive schema. No data loss. Idempotent (all guards on IF NOT EXISTS
-- + INSERT/UPDATE patterns are safe to re-run).
--
-- Lays the foundation that Phases 1b (ingestItem helper), 1c (chips library +
-- Provenance Panel + glossary), and 1d (Triage page overhaul) will build on.

-- ============================================================================
-- 1. intel_items — new columns for snooze, dup tracking, fuzzy dedup,
--    fact-origin (anti-hallucination), and archive lifecycle.
-- ============================================================================

ALTER TABLE intel_items
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS dup_of_intel_id uuid REFERENCES intel_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmation_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirming_sources text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS headline_normalized text,
  ADD COLUMN IF NOT EXISTS fact_origin text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- fact_origin allowed values (anti-hallucination chip distinct from confidence).
ALTER TABLE intel_items
  DROP CONSTRAINT IF EXISTS intel_items_fact_origin_check;
ALTER TABLE intel_items
  ADD CONSTRAINT intel_items_fact_origin_check
  CHECK (fact_origin IS NULL OR fact_origin IN (
    'official',          -- issuer press release, official policy page
    'secondary',         -- credible blog (TPG, OMAAT, Frequent Miler, Prince of Travel)
    'social-rumor',      -- Reddit / X social claim, not yet corroborated
    'inferred',          -- analyst inference (Grok summarizing) from indirect signals
    'ai-discovered-only' -- AI surfaced this without a human-verifiable upstream source
  ));

COMMENT ON COLUMN intel_items.snoozed_until IS
  'Hide this item from the default Triage view until this timestamp. NULL = not snoozed. Picker presets: 1d / 3d / 1w / custom. Cleared on unsnooze. Item still appears in the Snoozed tab while waiting to wake.';

COMMENT ON COLUMN intel_items.dup_of_intel_id IS
  'When this row was suppressed as a duplicate of an earlier intel item, points to the original. Powers the +N confirmations chip on the original. NULL for non-duplicates. Set by ingestItem (Phase 1b) when Layer 2 / Layer 3 dedup catches a match.';

COMMENT ON COLUMN intel_items.confirmation_count IS
  'Number of OTHER sources that later confirmed this intel item via the dedup path. Surfaced as a chip on the original. Incremented atomically by ingestItem when a dup_of_intel_id is set.';

COMMENT ON COLUMN intel_items.confirming_sources IS
  'Source names of the intel items that confirmed this one as a dup. Surfaced in the Provenance Panel ("Also confirmed by: TPG email, Reddit r/awardtravel").';

COMMENT ON COLUMN intel_items.headline_normalized IS
  'Lowercase, punctuation-stripped headline for Layer 3 fuzzy similarity dedup via pg_trgm. Populated by ingestItem on insert. Indexed via gin_trgm_ops below.';

COMMENT ON COLUMN intel_items.fact_origin IS
  'Provenance of the underlying CLAIM (distinct from source confidence). official > secondary > social-rumor > inferred > ai-discovered-only. Hedge against hallucination laundering — AI-discovered items should never display as authoritative as a verified issuer announcement.';

COMMENT ON COLUMN intel_items.archived_at IS
  'When the auto-archive cron moved this item out of foreground views. NULL = active. Set by Phase 5 retention cron.';

-- ============================================================================
-- 2. intel_items — backfill headline_normalized for existing rows so Layer 3
--    fuzzy dedup works on day one (not just for rows ingested after Phase 1b).
-- ============================================================================

UPDATE intel_items
   SET headline_normalized = lower(regexp_replace(headline, '[^a-z0-9 ]+', ' ', 'gi'))
 WHERE headline_normalized IS NULL
   AND headline IS NOT NULL;

-- ============================================================================
-- 3. intel_items — Layer 3 dedup infrastructure (pg_trgm + UNIQUE constraint).
-- ============================================================================

-- GIN trigram index — powers similarity() lookups in ingestItem Layer 3.
CREATE INDEX IF NOT EXISTS intel_items_headline_normalized_trgm_idx
  ON intel_items USING gin (headline_normalized gin_trgm_ops);

-- Race-guard UNIQUE — second parallel insert of same (normalized headline, same day)
-- raises 23505, which ingestItem catches and converts to a dup attachment.
-- See plan v9 "Race condition guard" — best-effort, not race-proof (midnight
-- boundary + normalization-edge cases handled by fuzzy layer at insert time).
--
-- Implementation note: date_trunc('day', timestamptz) is STABLE not IMMUTABLE
-- (timezone-dependent), so Postgres rejects it in an index expression. We cast
-- through UTC explicitly — (timestamptz AT TIME ZONE 'UTC') is timestamp, and
-- timestamp::date is IMMUTABLE. "Same day" is therefore UTC-day, not local-day,
-- which is the right semantic for a server-side dedup window anyway.
CREATE UNIQUE INDEX IF NOT EXISTS intel_items_headline_day_uniq
  ON intel_items (headline_normalized, ((created_at AT TIME ZONE 'UTC')::date))
  WHERE headline_normalized IS NOT NULL;

-- ============================================================================
-- 4. intel_items — supporting indexes for the new lifecycle columns.
-- ============================================================================

CREATE INDEX IF NOT EXISTS intel_items_snoozed_until_idx
  ON intel_items (snoozed_until)
  WHERE snoozed_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS intel_items_dup_of_intel_id_idx
  ON intel_items (dup_of_intel_id)
  WHERE dup_of_intel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS intel_items_fact_origin_idx
  ON intel_items (fact_origin)
  WHERE fact_origin IS NOT NULL;

-- ============================================================================
-- 5. content_variants — new columns for chip provenance (Phase 1c needs these
--    to render "Edited by Jill" / "Live on home banner" chips).
-- ============================================================================

ALTER TABLE content_variants
  ADD COLUMN IF NOT EXISTS edited_by text,
  ADD COLUMN IF NOT EXISTS surface_locations text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN content_variants.edited_by IS
  'Last human editor (usually "jill"). Distinct from generated_by (which records the AI/editor that produced the most recent draft).';

COMMENT ON COLUMN content_variants.surface_locations IS
  'Where this variant is currently rendered on the public site. Values: home_banner, live_bar:<program_slug>, program_page:<program_slug>. Populated by compute_surface_locations() function (Phase 1d) on publish/unpublish events + nightly cron backstop. Not computed on read.';

-- ============================================================================
-- 6. topics — canonical_id (human-readable structured identifier).
-- ============================================================================

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS canonical_id text;

CREATE UNIQUE INDEX IF NOT EXISTS topics_canonical_id_uniq
  ON topics (canonical_id)
  WHERE canonical_id IS NOT NULL;

COMMENT ON COLUMN topics.canonical_id IS
  'Human-readable structured identifier for analytics + clustering. Format: <primary_program>-<topic_type>-<year>-<quarter-or-month>. Example: marriott-transfer-bonus-2026-q2. Distinct from slug (which is free-form). NULL allowed during backfill; new topics should always set this.';

-- ============================================================================
-- 7. intel_ingest_errors — global ingestion error contract.
--    Every path that calls ingestItem (Scout, email, Grok, manual) routes
--    failures here so silent ingestion failures become impossible.
-- ============================================================================

CREATE TABLE IF NOT EXISTS intel_ingest_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('scout', 'email', 'grok', 'manual', 'x')),
  stage text NOT NULL CHECK (stage IN (
    'classify',
    'dedup',
    'haiku-diff',
    'insert',
    'surface',
    'security',
    'parse'
  )),
  payload jsonb NOT NULL,
  error_message text,
  error_stack text
);

CREATE INDEX IF NOT EXISTS intel_ingest_errors_created_at_idx
  ON intel_ingest_errors (created_at DESC);

CREATE INDEX IF NOT EXISTS intel_ingest_errors_source_stage_idx
  ON intel_ingest_errors (source, stage, created_at DESC);

COMMENT ON TABLE intel_ingest_errors IS
  'Global ingestion error log. Every path that calls ingestItem (Scout, email inbound, Grok poller, manual paste) writes here on any failure. Triage header surfaces a red "Ingest errors (N)" chip when count > 0 in last 24h. Phase 5 retention cron prunes rows older than 30 days.';

ALTER TABLE intel_ingest_errors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. pipeline_status_audit — append-only log of every status transition.
--    Promoted from Phase 5 to Phase 1 (per v8) for debuggability from day one.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  entity_type text NOT NULL CHECK (entity_type IN (
    'intel_items',
    'content_variants',
    'topics',
    'newsletters'
  )),
  entity_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  reason text,
  actor text
);

CREATE INDEX IF NOT EXISTS pipeline_status_audit_entity_idx
  ON pipeline_status_audit (entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS pipeline_status_audit_occurred_at_idx
  ON pipeline_status_audit (occurred_at DESC);

COMMENT ON TABLE pipeline_status_audit IS
  'Append-only log of every status transition across intel_items, content_variants, topics, newsletters. Powers the Provenance Panel full timeline. "Why did this publish?" / "When did Jill approve this?" — answer is always one query away. Phase 5 retention cron prunes rows older than 180 days.';

ALTER TABLE pipeline_status_audit ENABLE ROW LEVEL SECURITY;
