-- Phase 5b — bring brand voice + originality checks to alerts so the alert
-- edit page has the same 4-pill verification surface as blog drafts.
-- Fact-check columns already exist (fact_check_at + fact_check_claims).

alter table alerts
  add column if not exists voice_checked_at timestamptz,
  add column if not exists voice_pass boolean,
  add column if not exists voice_notes text,
  add column if not exists originality_checked_at timestamptz,
  add column if not exists originality_pass boolean,
  add column if not exists originality_notes text;
