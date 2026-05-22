-- Phase 3 Wave 3a — invert the dual-write direction.
--
-- Before this migration, the dual-write trigger flows alerts → variants
-- (admin writes alerts; trigger projects to variants). After this migration,
-- the direction is variants → alerts (admin writes variants directly via
-- the writeAlertVariant() helper; trigger projects to alerts as a
-- read-redundant mirror).
--
-- See plans/phase3-domain-model.md for the canonical invariants this
-- migration must hold to — especially I5 (trigger direction is
-- deterministic; only one runs at a time).
--
-- This migration does THREE things atomically (single transaction):
--   1. Schema parity check (invariant I1) — every alerts column must map
--      to a variant column, topic column, or metadata key. If any
--      unmapped column exists, the migration RAISES EXCEPTION and rolls
--      back before touching any trigger.
--   2. Drops the old alerts → variants trigger function (from migration 322).
--   3. Creates the new variants → alerts trigger function.
--
-- Atomicity: if step 1 fails, no trigger is dropped. If step 2 succeeds
-- but step 3 fails, the whole transaction rolls back (step 2 is undone
-- and the old trigger stays active).
--
-- Rollback after success: apply a migration that reverses the direction
-- (DROP TRIGGER variants_dual_write_to_alerts; recreate the alerts→variants
-- trigger from migration 322 verbatim).

-- ============================================================================
-- 1. Schema parity check (I1)
-- ============================================================================
DO $parity$
DECLARE
  expected_cols text[] := ARRAY[
    -- core identity
    'id', 'slug', 'short_slug', 'title', 'summary', 'description', 'type', 'status',
    'primary_program_id', 'action_type',
    -- dates
    'start_date', 'end_date', 'published_at', 'decided_at', 'last_verified',
    'revisit_after', 'created_at', 'updated_at', 'approved_at', 'fact_check_at',
    'voice_checked_at', 'context_loaded_at', 'originality_checked_at',
    'score_last_computed_at',
    -- editorial scoring + sources
    'source', 'source_url', 'source_intel_id', 'confidence_level',
    'impact_score', 'value_score', 'rarity_score', 'computed_score',
    'impact_justification', 'history_note', 'why_this_matters',
    -- editorial flags + audit
    'gaps', 'verified_terms', 'registration_required', 'created_by', 'approved_by',
    'is_hot', 'rejected_reason', 'override_reason',
    -- voice + originality + fact-check
    'fact_check_claims', 'revision_log',
    'voice_pass', 'voice_notes', 'voice_score', 'voice_lead_mode',
    'terms_waived_reason',
    'originality_pass', 'originality_notes'
  ];
  actual_cols text[];
  unexpected_cols text[];
  missing_cols text[];
BEGIN
  SELECT array_agg(column_name::text ORDER BY column_name)
  INTO actual_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'alerts';

  -- Columns on alerts that we don't have a mapping for
  SELECT array_agg(c ORDER BY c)
  INTO unexpected_cols
  FROM unnest(actual_cols) AS c
  WHERE c <> ALL(expected_cols);

  -- Columns we expected that don't exist (renamed/dropped)
  SELECT array_agg(c ORDER BY c)
  INTO missing_cols
  FROM unnest(expected_cols) AS c
  WHERE c <> ALL(actual_cols);

  IF unexpected_cols IS NOT NULL AND array_length(unexpected_cols, 1) > 0 THEN
    RAISE EXCEPTION 'Schema parity check failed (I1): alerts has unmapped columns %. Update plans/phase3-domain-model.md AND this migration before proceeding.', unexpected_cols;
  END IF;

  IF missing_cols IS NOT NULL AND array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION 'Schema parity check failed: expected alerts columns are missing %. Likely an upstream migration renamed/dropped them; reconcile before flipping triggers.', missing_cols;
  END IF;

  RAISE NOTICE 'Schema parity check passed (% alerts columns, all mapped)', array_length(actual_cols, 1);
END
$parity$;

-- ============================================================================
-- 2. Drop the old direction (alerts → variants)
-- ============================================================================
DROP TRIGGER IF EXISTS alerts_dual_write_topics_variants ON alerts;
DROP FUNCTION IF EXISTS alerts_sync_to_topics_variants();

-- ============================================================================
-- 3. Create the new direction (variants → alerts)
-- ============================================================================
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
  v_program_slugs text[];
BEGIN
  -- I5: cascade guard. If anything we update from this trigger fires back
  -- into content_variants, bail out so we don't loop.
  IF pg_trigger_depth() <> 1 THEN
    RETURN NEW;
  END IF;

  -- Only mirror alert-format variants. Other formats (blog, newsletter,
  -- social) have no alerts representation.
  IF NEW.format <> 'alert' THEN
    RETURN NEW;
  END IF;

  -- Pull the parent topic (we need slug, summary, programs, end_date, metadata).
  SELECT * INTO v_topic FROM topics WHERE id = NEW.topic_id;
  IF v_topic.id IS NULL THEN
    -- Orphan variant — shouldn't happen. Skip rather than error.
    RETURN NEW;
  END IF;

  v_meta := COALESCE(NEW.metadata, '{}'::jsonb);
  v_topic_meta := COALESCE(v_topic.metadata, '{}'::jsonb);
  v_editorial := COALESCE(v_topic_meta->'editorial_scores', '{}'::jsonb);

  -- I7: preserve alerts.id stability — original alert id is on topic.metadata.
  v_alert_id := NULLIF(v_topic_meta->>'original_alert_id', '')::uuid;

  -- G2: status mapping (inverse of Wave 1).
  v_alert_status := CASE NEW.status
    WHEN 'draft'         THEN 'draft'
    WHEN 'needs_review'  THEN 'pending_review'
    WHEN 'approved'      THEN 'pending_review'  -- approved variants haven't been published yet
    WHEN 'published'     THEN CASE
                                WHEN v_topic.end_date IS NOT NULL AND v_topic.end_date < now()
                                THEN 'expired'
                                ELSE 'published'
                              END
    WHEN 'archived'      THEN 'soft_rejected'
    ELSE 'draft'
  END;

  -- Type comes from variant.metadata.original_alert_type when present
  -- (Wave 2 preserved this); falls back to topic.topic_type.
  v_alert_type := COALESCE(NULLIF(v_meta->>'original_alert_type', ''), v_topic.topic_type);

  -- Primary program: during Wave 3a authority lives on topic.metadata.
  -- After migration 324 it moves to topics.primary_program_id column.
  v_primary_program_id := NULLIF(v_topic_meta->>'primary_program_id', '')::uuid;

  IF v_alert_id IS NULL THEN
    -- Brand new variant (no original alert id preserved). Generate a fresh
    -- alerts row id and persist it back to topic.metadata so future updates
    -- find this same row.
    v_alert_id := gen_random_uuid();
    UPDATE topics
       SET metadata = topics.metadata || jsonb_build_object('original_alert_id', v_alert_id::text)
     WHERE id = v_topic.id;
  END IF;

  -- Upsert the alerts mirror row.
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
    last_verified, override_reason, rejected_reason
  ) VALUES (
    v_alert_id,
    v_topic.slug,
    NULLIF(v_meta->>'short_slug', ''),
    NEW.title,
    v_topic.summary,
    NEW.body,
    v_alert_type::alert_type,
    v_alert_status::alert_status,
    v_primary_program_id,
    COALESCE(NULLIF(v_meta->>'action_type', ''), 'monitor')::alert_action_type,
    NULLIF(v_meta->>'start_date', '')::timestamptz,
    v_topic.end_date,
    NEW.published_at,
    NULLIF(v_meta->>'alerts_source', ''),
    CASE WHEN array_length(v_topic.source_urls, 1) > 0 THEN v_topic.source_urls[1] ELSE NULL END,
    NULLIF(v_topic_meta->>'source_intel_id', '')::uuid,
    COALESCE(NULLIF(v_meta->>'confidence_level', ''), 'medium')::confidence_level,
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
    (v_meta->>'voice_pass')::boolean,
    v_meta->>'voice_notes',
    (v_meta->>'voice_score')::int,
    NULLIF(v_meta->>'voice_lead_mode', ''),
    NULLIF(v_meta->>'voice_checked_at', '')::timestamptz,
    v_meta->>'terms_waived_reason',
    (v_meta->>'originality_pass')::boolean,
    v_meta->>'originality_notes',
    NULLIF(v_meta->>'originality_checked_at', '')::timestamptz,
    COALESCE(v_topic.fact_ledger, '[]'::jsonb),
    v_topic.verified_at,
    COALESCE(v_meta->'revision_log', '[]'::jsonb),
    v_meta->'gaps',
    v_meta->>'verified_terms',
    NULLIF(v_meta->>'last_verified', '')::timestamptz,
    v_meta->>'override_reason',
    NULL  -- rejected_reason; not tracked on variants today
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
    updated_at = now();

  -- G4: junction reconciliation. Build the expected (program_id, role) set
  -- from topic.programs[] + topic.metadata.primary_program_id, then sync.
  IF array_length(v_topic.programs, 1) > 0 THEN
    SELECT array_agg(p.id ORDER BY p.slug)
      INTO v_program_slugs  -- reusing var as program_ids placeholder
      FROM programs p
     WHERE p.slug = ANY(v_topic.programs);
    -- (handled below via delete+insert pattern matching setAlertPrograms)
  END IF;

  -- Wipe + recreate alert_programs rows for this alert.
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

DROP TRIGGER IF EXISTS variants_dual_write_to_alerts ON content_variants;
CREATE TRIGGER variants_dual_write_to_alerts
  AFTER INSERT OR UPDATE ON content_variants
  FOR EACH ROW
  EXECUTE FUNCTION variants_sync_to_alerts();

COMMENT ON FUNCTION variants_sync_to_alerts IS
  'Phase 3 Wave 3a — variants → alerts dual-write. Replaces the inverse direction trigger from migration 322. Admin code must write variants directly via writeAlertVariant(); the trigger maintains the alerts mirror. See plans/phase3-domain-model.md for invariants I1-I8.';

-- ============================================================================
-- 4. Invariant G6 / I2 enforcement: block direct writes to alerts
-- ============================================================================
-- A BEFORE INSERT/UPDATE trigger on alerts that raises EXCEPTION when the
-- write didn't originate from the variants_sync_to_alerts() trigger. The
-- variants trigger fires from content_variants, so when it INSERTs into
-- alerts, pg_trigger_depth() is 1. Any direct admin/SQL write has
-- pg_trigger_depth() = 0 and gets rejected.
--
-- This is the DB-layer enforcement of G6 — making the application-layer
-- discipline impossible to bypass. A future engineer running an ad-hoc
-- SQL UPDATE on alerts gets a clear error rather than silently corrupting
-- the variants/alerts parity.
--
-- Allowed exceptions (intentional bypass): set
-- alerts_allow_direct_writes = 'on' in session settings to disable the
-- block for the current session. Use this ONLY for emergency repair work
-- or schema migrations — never in normal code paths.

CREATE OR REPLACE FUNCTION alerts_block_direct_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Writes from inside the variants_sync_to_alerts trigger have
  -- pg_trigger_depth() >= 1. Direct writes have depth = 0.
  IF pg_trigger_depth() = 0 THEN
    -- Emergency bypass for repair work
    IF current_setting('app.alerts_allow_direct_writes', true) = 'on' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION
      'Direct writes to alerts are blocked (G6). Use writeAlertVariant() to write content_variants instead; the trigger will mirror to alerts. To bypass for emergency repair, run: SET app.alerts_allow_direct_writes = ''on''; in the same session.';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION alerts_block_direct_writes() OWNER TO postgres;

DROP TRIGGER IF EXISTS alerts_block_direct_writes ON alerts;
CREATE TRIGGER alerts_block_direct_writes
  BEFORE INSERT OR UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION alerts_block_direct_writes();

COMMENT ON FUNCTION alerts_block_direct_writes IS
  'Phase 3 Wave 3a — enforces G6/I2: direct writes to alerts are rejected. Only the variants_sync_to_alerts trigger may write. Emergency bypass: SET app.alerts_allow_direct_writes = ''on'' in the session.';
