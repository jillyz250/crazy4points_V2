-- Phase 1b — Schema additions for ingestItem's Haiku-diff "update existing alert" path.
-- See plans/content-pipeline-overhaul-2026-05-20.md (v9) — "Haiku diff" section.
--
-- When Layer 2 (getRecentDecisionFor) wants to block a new intel item AND the
-- Haiku diff says "has_new_facts: true" (deadline extended, rate changed, etc.),
-- the new intel_item is inserted normally and surfaces in Triage with a link to
-- the existing alert that should be amended.
--
-- These columns capture that linkage so the Triage UI can render:
--   "Updates: <existing alert title>"
--   "What changed: <Haiku diff summary>"
--
-- Pure additive schema. Idempotent.

-- ============================================================================
-- 1. intel_items — link to existing alert this row should amend.
-- ============================================================================

ALTER TABLE intel_items
  ADD COLUMN IF NOT EXISTS update_to_alert_id uuid REFERENCES alerts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS haiku_diff_summary text,
  ADD COLUMN IF NOT EXISTS haiku_diff_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS haiku_diff_fail_open boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN intel_items.update_to_alert_id IS
  'When this intel item was caught by Layer 2 dedup AND Haiku diff returned has_new_facts=true, points to the alert that should be amended. Powers the Triage "Updates: <alert title>" link. NULL = not an update (either fresh news or silently suppressed dup). Phase 3 will switch the FK target from alerts to content_variants.';

COMMENT ON COLUMN intel_items.haiku_diff_summary IS
  'One-line description from Haiku diff explaining what changed vs the existing alert (e.g. "deadline extended from May 31 to June 30"). NULL when no Haiku diff ran or it returned has_new_facts=false. Shown in Triage row.';

COMMENT ON COLUMN intel_items.haiku_diff_categories IS
  'Structured categorization of the change: deadline_change | rate_change | destination_change | walkback | cap_change | other. Used by Triage filters and Phase 7 analytics.';

COMMENT ON COLUMN intel_items.haiku_diff_fail_open IS
  'TRUE when the Haiku diff API call errored / timed out / returned malformed JSON. Triage UI shows a banner indicating the dedup check itself failed (this row was surfaced as a safety measure, may actually be a dup).';

CREATE INDEX IF NOT EXISTS intel_items_update_to_alert_id_idx
  ON intel_items (update_to_alert_id)
  WHERE update_to_alert_id IS NOT NULL;

-- ============================================================================
-- 2. RPC — atomic confirmation_count increment + confirming_sources append.
--    Used by ingestItem when Layer 2 / Layer 3 / Haiku-diff routes a new
--    finding to "suppress as silent dup."
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_intel_confirmation(
  p_intel_id uuid,
  p_source text
) RETURNS void AS $$
BEGIN
  UPDATE intel_items
     SET confirmation_count = confirmation_count + 1,
         confirming_sources = array_append(confirming_sources, p_source)
   WHERE id = p_intel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION increment_intel_confirmation(uuid, text) IS
  'Atomic increment of confirmation_count + append to confirming_sources on the ORIGINAL intel item when a later source confirms the same story. Called by utils/intel/ingestItem when a dup is silently suppressed.';
