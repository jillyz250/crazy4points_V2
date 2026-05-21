-- Phase 3 Wave 1 — dual-write trigger: every alerts insert/update auto-syncs
-- a matching topics + content_variants row. Apply AFTER the backfill script
-- has run successfully, otherwise pending_review/draft/published rows that
-- get edited will trigger inserts before the backfill has indexed them.
--
-- Guard rails:
--   • pg_trigger_depth() = 0 — prevents cascades during bulk SQL cleanup.
--     If something inside the trigger updates another table that triggers
--     back into alerts, we bail out cleanly.
--   • SECURITY DEFINER owner postgres — works regardless of which role
--     issues the alert write.
--   • Idempotent on (slug for topics, topic_id+format for variants) so
--     re-running is safe and the trigger doesn't duplicate rows.
--   • Skips rejected/soft_rejected on insert; archives existing variant on
--     transition into those statuses (preserves audit trail).
--
-- Rollback:
--   • Debug:  ALTER TABLE alerts DISABLE TRIGGER alerts_dual_write_topics_variants;
--   • Remove: DROP TRIGGER alerts_dual_write_topics_variants ON alerts;
--             DROP FUNCTION alerts_sync_to_topics_variants();

CREATE OR REPLACE FUNCTION alerts_sync_to_topics_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_id uuid;
  v_topic_status text;
  v_variant_status text;
  v_program_slugs text[];
  v_topic_type text;
  v_editorial_scores jsonb;
  v_topic_metadata jsonb;
  v_variant_metadata jsonb;
BEGIN
  -- Cascade guard. If anything below triggers a recursive alerts update,
  -- bail out so we don't fire the same logic twice.
  IF pg_trigger_depth() <> 1 THEN
    RETURN NEW;
  END IF;

  -- Status mapping
  IF NEW.status = 'draft' THEN
    v_topic_status := 'draft';
    v_variant_status := 'draft';
  ELSIF NEW.status = 'pending_review' THEN
    v_topic_status := 'active';
    v_variant_status := 'needs_review';
  ELSIF NEW.status = 'published' THEN
    v_topic_status := 'active';
    v_variant_status := 'published';
  ELSIF NEW.status = 'expired' THEN
    v_topic_status := 'active';
    v_variant_status := 'published';
  ELSIF NEW.status IN ('rejected', 'soft_rejected') THEN
    -- Archive the existing variant (if any) but leave the topic alone.
    UPDATE content_variants v
    SET status = 'archived',
        archived_at = COALESCE(v.archived_at, now())
    FROM topics t
    WHERE v.topic_id = t.id
      AND t.slug = NEW.slug
      AND v.format = 'alert';
    RETURN NEW;
  ELSE
    -- Unknown status — do nothing, don't block the alert write.
    RETURN NEW;
  END IF;

  -- Topic type mapping (alert.type → topics.topic_type; fallback 'other')
  v_topic_type := CASE NEW.type
    WHEN 'transfer_bonus' THEN 'transfer_bonus'
    WHEN 'signup_bonus' THEN 'signup_bonus'
    WHEN 'referral_bonus' THEN 'referral_bonus'
    WHEN 'retention_offer' THEN 'retention_offer'
    WHEN 'limited_time_offer' THEN 'limited_time_offer'
    WHEN 'status_promo' THEN 'status_promo'
    WHEN 'award_availability' THEN 'award_availability'
    WHEN 'sweet_spot' THEN 'sweet_spot'
    WHEN 'glitch' THEN 'glitch'
    WHEN 'devaluation' THEN 'devaluation'
    WHEN 'earn_rate_change' THEN 'earn_rate_change'
    WHEN 'category_change' THEN 'category_change'
    WHEN 'partner_change' THEN 'partner_change'
    WHEN 'program_change' THEN 'program_change'
    WHEN 'status_change' THEN 'status_change'
    WHEN 'policy_change' THEN 'policy_change'
    WHEN 'industry_news' THEN 'industry_news'
    WHEN 'shopping_portal_bonus' THEN 'shopping_portal_bonus'
    WHEN 'award_sale' THEN 'award_sale'
    WHEN 'companion_pass' THEN 'companion_pass'
    WHEN 'dining_bonus' THEN 'dining_bonus'
    WHEN 'fee_change' THEN 'fee_change'
    WHEN 'card_refresh' THEN 'card_refresh'
    WHEN 'milestone_bonus' THEN 'milestone_bonus'
    WHEN 'card_credit' THEN 'card_credit'
    ELSE 'other'
  END;

  -- Build program_slugs from junction
  SELECT COALESCE(array_agg(p.slug ORDER BY p.slug), '{}')
  INTO v_program_slugs
  FROM alert_programs ap
  JOIN programs p ON p.id = ap.program_id
  WHERE ap.alert_id = NEW.id;

  v_editorial_scores := jsonb_build_object(
    'source', 'alerts_dual_write',
    'impact_score', NEW.impact_score,
    'value_score', NEW.value_score,
    'rarity_score', NEW.rarity_score,
    'computed_score', NEW.computed_score,
    'impact_justification', NEW.impact_justification,
    'is_hot', COALESCE(NEW.is_hot, false),
    'why_this_matters', NEW.why_this_matters
  );

  v_topic_metadata := jsonb_build_object(
    'source', 'alerts_dual_write',
    'editorial_scores', v_editorial_scores,
    'original_alert_id', NEW.id
  );

  -- Upsert topic (idempotent on slug)
  INSERT INTO topics (
    slug, title, summary, topic_type, source_urls, fact_ledger,
    fact_check_status, verified_at, programs, cards, end_date, status,
    created_by, metadata
  )
  VALUES (
    NEW.slug, NEW.title, NEW.summary, v_topic_type,
    CASE WHEN NEW.source_url IS NOT NULL THEN ARRAY[NEW.source_url] ELSE '{}'::text[] END,
    COALESCE(NEW.fact_check_claims, '[]'::jsonb),
    CASE WHEN NEW.fact_check_at IS NOT NULL THEN 'verified' ELSE 'pending' END,
    NEW.fact_check_at,
    v_program_slugs, '{}'::text[], NEW.end_date, v_topic_status,
    COALESCE(NEW.created_by, 'alerts_dual_write'), v_topic_metadata
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    topic_type = EXCLUDED.topic_type,
    source_urls = EXCLUDED.source_urls,
    fact_ledger = EXCLUDED.fact_ledger,
    fact_check_status = EXCLUDED.fact_check_status,
    verified_at = EXCLUDED.verified_at,
    programs = EXCLUDED.programs,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    metadata = topics.metadata || EXCLUDED.metadata
  RETURNING id INTO v_topic_id;

  -- Variant metadata (catch-all for fields without dedicated columns)
  v_variant_metadata := jsonb_build_object(
    'source', 'alerts_dual_write',
    'action_type', NEW.action_type,
    'registration_required', NEW.registration_required,
    'override_reason', NEW.override_reason,
    'terms_waived_reason', NEW.terms_waived_reason,
    'voice_pass', NEW.voice_pass,
    'voice_score', NEW.voice_score,
    'voice_notes', NEW.voice_notes,
    'voice_checked_at', NEW.voice_checked_at,
    'history_note', NEW.history_note,
    'confidence_level', NEW.confidence_level,
    'alerts_source', NEW.source,
    'last_verified', NEW.last_verified
  );

  -- Upsert variant (idempotent on topic_id + format='alert')
  INSERT INTO content_variants (
    topic_id, format, title, body, metadata,
    brand_voice_run, fact_check_run, status, published_at,
    publish_target_url, generated_by, archived_at
  )
  VALUES (
    v_topic_id, 'alert', NEW.title, NEW.description, v_variant_metadata,
    (NEW.voice_checked_at IS NOT NULL),
    (NEW.fact_check_at IS NOT NULL),
    v_variant_status,
    NEW.published_at,
    '/alerts/' || NEW.slug,
    'editor',
    NULL  -- if variant was archived from a prior soft-reject, the unarchive happens here
  )
  ON CONFLICT (topic_id, format) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    metadata = content_variants.metadata || EXCLUDED.metadata,
    brand_voice_run = EXCLUDED.brand_voice_run,
    fact_check_run = EXCLUDED.fact_check_run,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at,
    publish_target_url = EXCLUDED.publish_target_url,
    archived_at = CASE WHEN EXCLUDED.status = 'archived' THEN COALESCE(content_variants.archived_at, now()) ELSE NULL END;

  RETURN NEW;
END;
$$;

ALTER FUNCTION alerts_sync_to_topics_variants() OWNER TO postgres;

DROP TRIGGER IF EXISTS alerts_dual_write_topics_variants ON alerts;
CREATE TRIGGER alerts_dual_write_topics_variants
  AFTER INSERT OR UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION alerts_sync_to_topics_variants();

COMMENT ON FUNCTION alerts_sync_to_topics_variants IS
  'Phase 3 Wave 1 dual-write. Every alerts insert/update upserts a matching topic + content_variant (format=alert). pg_trigger_depth() guard prevents cascades. Status mapping: draft→draft, pending_review→needs_review, published/expired→published, rejected/soft_rejected→archive variant.';
