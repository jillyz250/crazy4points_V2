-- Phase 4 PR #1 — Promote hot editorial fields from variant.metadata jsonb
-- to first-class columns on content_variants. Lays the schema foundation for
-- the unified Drafts hub (formats: alert / blog / social / newsletter) and
-- unblocks indexed filtering + sorting in the new admin list view.
--
-- See plans/phase4-unified-drafts-hub.md for the full design + invariants.
--
-- This migration:
--   1. Adds 9 nullable columns + 1 NOT NULL DEFAULT 1 (variant_schema_version)
--   2. Backfills them from variant.metadata for every existing alert variant
--   3. Adds 5 indexes (composite, partial unique, partial filter)
--   4. Rewrites the variants→alerts trigger to read columns first via
--      COALESCE, falling back to metadata (A1 — trigger rewrite AFTER backfill)
--
-- All in one transaction so we never see NEW.column = NULL on a row whose
-- metadata had the value (which would make COALESCE incorrectly fall through).
--
-- NOT in this migration (deferred to follow-ups):
--   • NOT NULL flips on action_type / voice_pass — wait for bake to reveal
--     real null rates. Migration 329 does this after observation.
--   • Dropping the metadata keys — migration 328 after 7d bake + G7b gate.
--   • verified_terms / terms_waived_reason / end_date promotion to TOPICS
--     columns — the plan called for this but the data lives on
--     variant.metadata today (end_date is already a topics column). Promoted
--     to variant columns instead.
--
-- Reviewer notes (Copilot + ChatGPT) folded in:
--   • Defer NOT NULL → migration 329
--   • Avoid index hoarding: skipped standalone confidence_level / action_type
--   • short_slug uniqueness is partial composite, NOT global
--   • variant_schema_version with COMMENT explaining purpose
--   • CHECK constraints would be NOT VALID — not used here because we
--     promote to existing Postgres enums (confidence_level, action_type,
--     alert_type) which already enforce the taxonomy server-side

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Add columns (all nullable except variant_schema_version)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE content_variants
  ADD COLUMN voice_pass              boolean,
  ADD COLUMN voice_score             int,
  ADD COLUMN confidence_level        confidence_level,
  ADD COLUMN action_type             action_type,
  ADD COLUMN original_alert_type     alert_type,
  ADD COLUMN start_date              timestamptz,
  ADD COLUMN short_slug              text,
  ADD COLUMN verified_terms          text,
  ADD COLUMN terms_waived_reason     text,
  ADD COLUMN variant_schema_version  int NOT NULL DEFAULT 1;

COMMENT ON COLUMN content_variants.variant_schema_version IS
  'Tracks structural/editorial schema generation for format-aware variant evolution. Bumped when a format diverges from v1 shape (e.g. social v2 adds required image_url). Always set explicitly by writeAlertVariant — see invariant VSV1 in plans/phase4-unified-drafts-hub.md.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Backfill from metadata (alert format only — other formats don't exist yet)
-- ─────────────────────────────────────────────────────────────────────────

UPDATE content_variants
   SET voice_pass           = (metadata->>'voice_pass')::boolean,
       voice_score          = (metadata->>'voice_score')::int,
       confidence_level     = (NULLIF(metadata->>'confidence_level',''))::confidence_level,
       action_type          = (NULLIF(metadata->>'action_type',''))::action_type,
       original_alert_type  = (NULLIF(metadata->>'original_alert_type',''))::alert_type,
       start_date           = NULLIF(metadata->>'start_date','')::timestamptz,
       short_slug           = NULLIF(metadata->>'short_slug',''),
       verified_terms       = NULLIF(metadata->>'verified_terms',''),
       terms_waived_reason  = NULLIF(metadata->>'terms_waived_reason','')
 WHERE format = 'alert';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Indexes (operational — drafts hub list view + lifecycle queries)
-- ─────────────────────────────────────────────────────────────────────────

-- Drafts hub list view: filter by (format, status) + sort by updated_at.
-- Also covers prefix queries (format, status, anything) for chip combinations.
CREATE INDEX idx_variants_format_status_updated
  ON content_variants(format, status, updated_at DESC);

-- "Show me drafts that failed voice" — small set; partial index keeps it tiny.
CREATE INDEX idx_variants_voice_failures
  ON content_variants(format, voice_pass)
  WHERE voice_pass = false;

-- Sort/filter by quality score in drafts hub.
CREATE INDEX idx_variants_voice_score
  ON content_variants(format, voice_score DESC NULLS LAST)
  WHERE voice_score IS NOT NULL;

-- Date-window queries (Phase 5 lifecycle).
CREATE INDEX idx_variants_start_date
  ON content_variants(start_date)
  WHERE start_date IS NOT NULL;

-- short_slug uniqueness scoped per format — so alert + blog + social can
-- share the slug `amex-transfer-bonus`. NULLs allowed for formats with no slug.
CREATE UNIQUE INDEX idx_variant_short_slug_scoped
  ON content_variants(format, short_slug)
  WHERE short_slug IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Trigger rewrite — read columns first via COALESCE, fall back to metadata
--    Must run AFTER backfill (Invariant A1) — otherwise on an UPDATE the trigger
--    sees NEW.voice_pass = NULL on a row whose metadata had the value, and
--    COALESCE would incorrectly fall through to metadata for new writes too.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION variants_sync_to_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic topics%ROWTYPE;
  v_alert_id uuid;
  v_alert_status text;
  v_alert_type text;
  v_primary_program_id uuid;
  v_meta jsonb;
  v_topic_meta jsonb;
  v_editorial jsonb;
  v_archive_reason text;
  -- Resolved promoted fields (column → metadata fallback)
  v_short_slug text;
  v_action_type action_type;
  v_confidence_level confidence_level;
  v_start_date timestamptz;
  v_voice_pass boolean;
  v_voice_score int;
  v_verified_terms text;
  v_terms_waived_reason text;
BEGIN
  IF pg_trigger_depth() <> 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.format <> 'alert' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_topic FROM topics WHERE id = NEW.topic_id;
  IF v_topic.id IS NULL THEN
    RETURN NEW;
  END IF;

  v_meta := COALESCE(NEW.metadata, '{}'::jsonb);
  v_topic_meta := COALESCE(v_topic.metadata, '{}'::jsonb);
  v_editorial := COALESCE(v_topic_meta->'editorial_scores', '{}'::jsonb);
  v_archive_reason := NULLIF(v_meta->>'archive_reason', '');

  v_alert_id := NULLIF(v_topic_meta->>'original_alert_id', '')::uuid;

  -- Promoted fields: column wins; metadata is the fallback during bake window.
  v_short_slug          := COALESCE(NEW.short_slug, NULLIF(v_meta->>'short_slug', ''));
  v_action_type         := COALESCE(NEW.action_type, (NULLIF(v_meta->>'action_type',''))::action_type, 'monitor'::action_type);
  v_confidence_level    := COALESCE(NEW.confidence_level, (NULLIF(v_meta->>'confidence_level',''))::confidence_level, 'medium'::confidence_level);
  v_start_date          := COALESCE(NEW.start_date, NULLIF(v_meta->>'start_date','')::timestamptz);
  v_voice_pass          := COALESCE(NEW.voice_pass, (v_meta->>'voice_pass')::boolean);
  v_voice_score         := COALESCE(NEW.voice_score, (v_meta->>'voice_score')::int);
  v_verified_terms      := COALESCE(NEW.verified_terms, v_meta->>'verified_terms');
  v_terms_waived_reason := COALESCE(NEW.terms_waived_reason, v_meta->>'terms_waived_reason');

  v_alert_status := CASE NEW.status
    WHEN 'draft'         THEN 'draft'
    WHEN 'needs_review'  THEN 'pending_review'
    WHEN 'approved'      THEN 'pending_review'
    WHEN 'published'     THEN CASE
                                WHEN v_topic.end_date IS NOT NULL AND v_topic.end_date < now()
                                THEN 'expired'
                                ELSE 'published'
                              END
    WHEN 'archived'      THEN CASE v_archive_reason
                                WHEN 'rejected'      THEN 'rejected'
                                WHEN 'soft_rejected' THEN 'soft_rejected'
                                ELSE 'soft_rejected'
                              END
    ELSE 'draft'
  END;

  v_alert_type := COALESCE(NEW.original_alert_type::text, NULLIF(v_meta->>'original_alert_type', ''), v_topic.topic_type);
  v_primary_program_id := NULLIF(v_topic_meta->>'primary_program_id', '')::uuid;

  IF v_alert_id IS NULL THEN
    v_alert_id := gen_random_uuid();
    UPDATE topics
       SET metadata = topics.metadata || jsonb_build_object('original_alert_id', v_alert_id::text)
     WHERE id = v_topic.id;
  END IF;

  INSERT INTO alerts (
    id, slug, short_slug, title, summary, description, type, status,
    primary_program_id, action_type,
    start_date, end_date, published_at,
    source, source_url, source_intel_id, confidence_level,
    impact_score, value_score, rarity_score, computed_score,
    impact_justification, history_note, why_this_matters,
    registration_required, created_by, is_hot,
    voice_pass, voice_notes, voice_score, voice_lead_mode, voice_checked_at,
    terms_waived_reason,
    originality_pass, originality_notes, originality_checked_at,
    fact_check_claims, fact_check_at, revision_log, gaps, verified_terms,
    last_verified, override_reason, rejected_reason,
    decided_at, revisit_after
  ) VALUES (
    v_alert_id,
    v_topic.slug,
    v_short_slug,
    NEW.title,
    v_topic.summary,
    NEW.body,
    v_alert_type::alert_type,
    v_alert_status::alert_status,
    v_primary_program_id,
    v_action_type,
    v_start_date,
    v_topic.end_date,
    NEW.published_at,
    NULLIF(v_meta->>'alerts_source', ''),
    CASE WHEN array_length(v_topic.source_urls, 1) > 0 THEN v_topic.source_urls[1] ELSE NULL END,
    NULLIF(v_topic_meta->>'source_intel_id', '')::uuid,
    v_confidence_level,
    COALESCE((v_editorial->>'impact_score')::int, 5),
    COALESCE((v_editorial->>'value_score')::int, 5),
    COALESCE((v_editorial->>'rarity_score')::int, 5),
    (v_editorial->>'computed_score')::numeric,
    COALESCE(v_editorial->>'impact_justification', ''),
    v_meta->>'history_note',
    v_editorial->>'why_this_matters',
    COALESCE((v_meta->>'registration_required')::boolean, false),
    COALESCE(v_topic.created_by, 'variants_dual_write'),
    COALESCE((v_editorial->>'is_hot')::boolean, false),
    v_voice_pass,
    v_meta->>'voice_notes',
    v_voice_score,
    NULLIF(v_meta->>'voice_lead_mode', ''),
    NULLIF(v_meta->>'voice_checked_at', '')::timestamptz,
    v_terms_waived_reason,
    (v_meta->>'originality_pass')::boolean,
    v_meta->>'originality_notes',
    NULLIF(v_meta->>'originality_checked_at', '')::timestamptz,
    COALESCE(v_topic.fact_ledger, '[]'::jsonb),
    v_topic.verified_at,
    COALESCE(v_meta->'revision_log', '[]'::jsonb),
    v_meta->'gaps',
    v_verified_terms,
    NULLIF(v_meta->>'last_verified', '')::timestamptz,
    v_meta->>'override_reason',
    v_meta->>'rejected_reason',
    NULLIF(v_meta->>'decided_at', '')::timestamptz,
    NULLIF(v_meta->>'revisit_after', '')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    short_slug = EXCLUDED.short_slug,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    primary_program_id = EXCLUDED.primary_program_id,
    action_type = EXCLUDED.action_type,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    published_at = EXCLUDED.published_at,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url,
    confidence_level = EXCLUDED.confidence_level,
    impact_score = EXCLUDED.impact_score,
    value_score = EXCLUDED.value_score,
    rarity_score = EXCLUDED.rarity_score,
    computed_score = EXCLUDED.computed_score,
    impact_justification = EXCLUDED.impact_justification,
    history_note = EXCLUDED.history_note,
    why_this_matters = EXCLUDED.why_this_matters,
    registration_required = EXCLUDED.registration_required,
    is_hot = EXCLUDED.is_hot,
    voice_pass = EXCLUDED.voice_pass,
    voice_notes = EXCLUDED.voice_notes,
    voice_score = EXCLUDED.voice_score,
    voice_lead_mode = EXCLUDED.voice_lead_mode,
    voice_checked_at = EXCLUDED.voice_checked_at,
    terms_waived_reason = EXCLUDED.terms_waived_reason,
    originality_pass = EXCLUDED.originality_pass,
    originality_notes = EXCLUDED.originality_notes,
    originality_checked_at = EXCLUDED.originality_checked_at,
    fact_check_claims = EXCLUDED.fact_check_claims,
    fact_check_at = EXCLUDED.fact_check_at,
    revision_log = EXCLUDED.revision_log,
    gaps = EXCLUDED.gaps,
    verified_terms = EXCLUDED.verified_terms,
    last_verified = EXCLUDED.last_verified,
    override_reason = EXCLUDED.override_reason,
    rejected_reason = EXCLUDED.rejected_reason,
    decided_at = EXCLUDED.decided_at,
    revisit_after = EXCLUDED.revisit_after,
    updated_at = now();

  -- Junction reconciliation
  DELETE FROM alert_programs WHERE alert_id = v_alert_id;
  INSERT INTO alert_programs (alert_id, program_id, role)
  SELECT v_alert_id, p.id,
         CASE WHEN p.id = v_primary_program_id THEN 'primary' ELSE 'secondary' END
    FROM programs p
   WHERE p.slug = ANY(v_topic.programs);

  RETURN NEW;
END;
$$;

ALTER FUNCTION variants_sync_to_alerts() OWNER TO postgres;

COMMIT;
