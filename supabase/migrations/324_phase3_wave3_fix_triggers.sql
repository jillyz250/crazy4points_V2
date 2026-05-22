-- Phase 3 Wave 3a — fix two bugs in migration 323's triggers.
--
-- Bug 1: Wrong enum type names.
--   Migration 323 cast values to `alert_action_type` and `alert_type`, but
--   the actual Postgres enum is named `action_type` (per migration 045
--   comment). PL/pgSQL doesn't validate cast types at CREATE FUNCTION time
--   — only at first execution — so 323 created cleanly but every trigger
--   firing failed with "type 'alert_action_type' does not exist".
--
--   Fix: drop the explicit casts. The alerts columns implicit-coerce text
--   to enum on INSERT if the value is in the enum's allowed set, which
--   matches the behavior of every other code path that's been inserting
--   into alerts for the last year.
--
-- Bug 2: Block-trigger logic inverted.
--   Inside a trigger function, pg_trigger_depth() returns 1 for the
--   outermost firing (i.e. a direct INSERT). My check `= 0` never
--   matched, so the block was a no-op and direct writes leaked through.
--   Verified: a test INSERT created a row despite the block trigger
--   being installed.
--
--   Fix: check `= 1` for direct writes (block them) and allow `> 1` for
--   writes called from inside another trigger (i.e. the variants → alerts
--   trigger doing its job).
--
-- This is CREATE OR REPLACE on both functions — no DROP needed since the
-- trigger bindings stay valid across function replacements.

-- ============================================================================
-- Fix 1: variants_sync_to_alerts — drop the bad enum casts
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

  v_alert_id := NULLIF(v_topic_meta->>'original_alert_id', '')::uuid;

  v_alert_status := CASE NEW.status
    WHEN 'draft'         THEN 'draft'
    WHEN 'needs_review'  THEN 'pending_review'
    WHEN 'approved'      THEN 'pending_review'
    WHEN 'published'     THEN CASE
                                WHEN v_topic.end_date IS NOT NULL AND v_topic.end_date < now()
                                THEN 'expired'
                                ELSE 'published'
                              END
    WHEN 'archived'      THEN 'soft_rejected'
    ELSE 'draft'
  END;

  v_alert_type := COALESCE(NULLIF(v_meta->>'original_alert_type', ''), v_topic.topic_type);
  v_primary_program_id := NULLIF(v_topic_meta->>'primary_program_id', '')::uuid;

  IF v_alert_id IS NULL THEN
    v_alert_id := gen_random_uuid();
    UPDATE topics
       SET metadata = topics.metadata || jsonb_build_object('original_alert_id', v_alert_id::text)
     WHERE id = v_topic.id;
  END IF;

  -- Upsert the alerts mirror row. Enum casts dropped — alerts columns
  -- coerce text to their enum types implicitly on INSERT.
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
    v_alert_type,
    v_alert_status,
    v_primary_program_id,
    COALESCE(NULLIF(v_meta->>'action_type', ''), 'monitor'),
    NULLIF(v_meta->>'start_date', '')::timestamptz,
    v_topic.end_date,
    NEW.published_at,
    NULLIF(v_meta->>'alerts_source', ''),
    CASE WHEN array_length(v_topic.source_urls, 1) > 0 THEN v_topic.source_urls[1] ELSE NULL END,
    NULLIF(v_topic_meta->>'source_intel_id', '')::uuid,
    COALESCE(NULLIF(v_meta->>'confidence_level', ''), 'medium'),
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
    NULL
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

-- ============================================================================
-- Fix 2: alerts_block_direct_writes — correct the pg_trigger_depth() check
-- ============================================================================
-- The outermost trigger fires at depth = 1, not 0. Direct writes are
-- detected by depth = 1 (only this trigger in the stack). Writes from
-- another trigger calling INSERT/UPDATE on alerts have depth > 1.

CREATE OR REPLACE FUNCTION alerts_block_direct_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direct writes (no other trigger in the stack) have depth = 1.
  -- Writes from inside variants_sync_to_alerts have depth >= 2.
  IF pg_trigger_depth() = 1 THEN
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
