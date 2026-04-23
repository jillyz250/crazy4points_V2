-- Phase 1 of brief-auto-revise: store a structured log of every reviser edit
-- on each alert. Surfaced in the daily brief approve card so the human can see
-- exactly what the reviser changed and why, with a source URL.
alter table alerts
  add column if not exists revision_log jsonb;
