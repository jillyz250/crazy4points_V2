-- Multi-story email fan-out (email triage overhaul).
--
-- A forwarded email is now split into many intel_items (one per story) instead
-- of collapsing into one. This table keeps the source email once so the fanned
-- out items can be grouped back together in triage ("AwardWallet Jul 27 -> these
-- 8 items") and the verbatim forward is retained for audit / re-segmentation.

CREATE TABLE IF NOT EXISTS intel_source_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  subject text,
  sender_email text,
  sender_domain text,
  source_name text,
  cleaned_body text,           -- padding-stripped body, capped ~20k
  segment_count integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE intel_source_emails IS
  'One row per inbound/forwarded email that was segmented into intel_items. Groups fanned-out stories and keeps the verbatim forward for audit.';

ALTER TABLE intel_items
  ADD COLUMN IF NOT EXISTS source_email_id uuid REFERENCES intel_source_emails(id);

COMMENT ON COLUMN intel_items.source_email_id IS
  'The forwarded email this story was segmented out of (intel_source_emails). NULL for non-email intake and pre-overhaul rows.';

CREATE INDEX IF NOT EXISTS idx_intel_items_source_email
  ON intel_items(source_email_id) WHERE source_email_id IS NOT NULL;
