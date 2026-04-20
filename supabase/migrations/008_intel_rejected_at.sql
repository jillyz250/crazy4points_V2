-- Track when intel items were rejected from the daily brief so they don't
-- re-surface. Scout's 7-day dedup already matches on headline, but this
-- widens the dedup window specifically for rejected items and lets the brief
-- filter them out deterministically.

ALTER TABLE intel_items
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_intel_items_rejected_at
  ON intel_items (rejected_at)
  WHERE rejected_at IS NOT NULL;
