-- Phase 6b — fact-check stamps for the weekly newsletter draft.
-- Mirrors the alerts/content_ideas convention so the editor can show
-- "X claims flagged" and gate Send on review.

alter table newsletters
  add column if not exists fact_checked_at timestamptz,
  add column if not exists fact_check_claims jsonb;
