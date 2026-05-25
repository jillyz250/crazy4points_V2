-- Admin-only editorial value-add log per alert.
--
-- Captures the writer's claim of what it ADDED to the alert beyond the
-- raw_text source. Pairs with the NO PLAGIARISM rule in
-- utils/ai/writeAlertDraft.ts — gives Jill a 3-second self-audit per
-- draft: "did the writer earn its keep, or just paraphrase the press
-- release?"
--
-- Never shown on the public alert page. Visible only in
-- /admin/alerts/[id]/edit so the editor can decide to publish or
-- regenerate.
--
-- Shape: jsonb array of { label: string, evidence: string }.
-- - label    = 1-line description of the value-add ("Sweet spot framing — 787-9 lie-flat Suites as best long-haul Atmos redemption")
-- - evidence = why this is beyond the source ("Source mentions the Suites product but never frames it as a points sweet spot")
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS editorial_value_add jsonb;

COMMENT ON COLUMN alerts.editorial_value_add IS
  'Admin-only QC log: writer-emitted list of editorial value-add items (label + evidence). Never shown publicly. See utils/ai/writeAlertDraft.ts NO PLAGIARISM section.';

-- Update the Phase 3 Wave 3a dual-write trigger so writes to
-- content_variants.metadata.editorial_value_add mirror into the alerts
-- column. Pattern matches how gaps + revision_log are mirrored (see
-- migration 324). Field is per-variant editorial metadata, stashed in
-- v_meta (variant metadata).
CREATE OR REPLACE FUNCTION mirror_variant_to_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_alert_id      uuid;
  v_alert_type    alert_type;
  v_alert_status  alert_status;
  v_topic         topics%ROWTYPE;
  v_topic_meta    jsonb;
  v_meta          jsonb;
  v_editorial     jsonb;
  v_primary_program_id uuid;
BEGIN
  -- Only mirror alert-format variants
  IF NEW.format <> 'alert' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_topic FROM topics WHERE id = NEW.topic_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_topic_meta := COALESCE(v_topic.metadata, '{}'::jsonb);
  v_meta       := COALESCE(NEW.metadata, '{}'::jsonb);
  v_editorial  := COALESCE(v_topic_meta->'editorial_scores', '{}'::jsonb);

  -- Resolve alert id from topic metadata
  v_alert_id := NULLIF(v_topic_meta->>'original_alert_id', '')::uuid;
  IF v_alert_id IS NULL THEN
    v_alert_id := gen_random_uuid();
    UPDATE topics
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('original_alert_id', v_alert_id)
     WHERE id = NEW.topic_id;
  END IF;

  v_alert_type   := COALESCE(NULLIF(v_meta->>'original_alert_type', ''), 'industry_news')::alert_type;
  v_alert_status := CASE NEW.status
    WHEN 'draft'        THEN 'pending_review'::alert_status
    WHEN 'needs_review' THEN 'pending_review'::alert_status
    WHEN 'approved'     THEN 'approved'::alert_status
    WHEN 'published'    THEN 'published'::alert_status
    WHEN 'archived'     THEN 'rejected'::alert_status
    ELSE 'pending_review'::alert_status
  END;

  v_primary_program_id := NULLIF(v_topic_meta->>'primary_program_id', '')::uuid;

  -- Allow the alerts write through the G6 guard for this trigger only
  PERFORM set_config('app.alerts_allow_direct_writes', 'on', true);

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
    editorial_value_add
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
    NULL,
    v_meta->'editorial_value_add'
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
    editorial_value_add = EXCLUDED.editorial_value_add,
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
