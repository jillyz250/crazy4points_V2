-- ============================================================================
-- 355 — Snooze for Drafts "Needs review" queue.
--
-- Mirrors the intel_items snooze pattern (migration 310) on content_variants
-- so an editor can defer a draft out of the Needs-review view until a chosen
-- date. Snoozed rows still live under a dedicated "Snoozed" chip with an
-- Unsnooze button; they wake automatically once snoozed_until passes.
-- ============================================================================

ALTER TABLE content_variants
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

COMMENT ON COLUMN content_variants.snoozed_until IS
  'Hide this variant from the default Drafts "Needs review" view until this timestamp. NULL = not snoozed. Picker presets: 1d / 7d / 14d / 30d / custom. Cleared on unsnooze. Variant still appears in the Snoozed chip while waiting to wake.';

-- Partial index — only snoozed rows are indexed (most rows are NULL).
CREATE INDEX IF NOT EXISTS content_variants_snoozed_until_idx
  ON content_variants (snoozed_until)
  WHERE snoozed_until IS NOT NULL;
