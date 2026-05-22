-- Phase 3 Wave 3a — fix enum casts in variants_sync_to_alerts.
--
-- Migration 324 dropped the explicit enum casts thinking Postgres would
-- implicit-coerce text → enum. It doesn't — every INSERT into alerts fails
-- with "column X is of type Y but expression is of type text".
--
-- This migration re-adds the casts with the CORRECT enum type names:
--   • alert_type        (correct)
--   • alert_status      (correct, confirmed in migration 035)
--   • action_type       (correct, confirmed in migration 045 — NOT 'alert_action_type')
--   • confidence_level  (correct)
--
-- Everything else from migration 324 stays. CREATE OR REPLACE preserves
-- the trigger binding.

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
    COALESCE(NULLIF(v_meta->>'action_type', ''), 'monitor')::action_type,
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
