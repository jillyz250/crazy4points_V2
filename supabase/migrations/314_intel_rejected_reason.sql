-- Phase 1d.4 follow-up: capture WHY an intel item was rejected.
--
-- Currently dismissCandidate just sets rejected_at — the editor can see WHEN
-- but not WHY. Adding a small column + the Triage UI exposes a preset picker
-- (duplicate | low-signal | wrong-program | off-brand | not-actionable | other)
-- with an optional custom text field for "other."
--
-- The rejected_reason surfaces in the Rejected tab's one-liner expand view.
-- Pure additive, idempotent.

ALTER TABLE intel_items
  ADD COLUMN IF NOT EXISTS rejected_reason text;

COMMENT ON COLUMN intel_items.rejected_reason IS
  'Why this item was rejected. Preset values from the Triage UI: duplicate | low-signal | wrong-program | off-brand | not-actionable | other:<free-text>. NULL when the legacy rejection path was used (the 26 items archived in Phase 0 cleanup, plus any pre-1d.4 manual skips).';

CREATE INDEX IF NOT EXISTS intel_items_rejected_reason_idx
  ON intel_items (rejected_reason)
  WHERE rejected_reason IS NOT NULL;
