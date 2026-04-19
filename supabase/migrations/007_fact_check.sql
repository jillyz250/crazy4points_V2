-- Phase 3.5: automated fact-check for AI-written alert drafts.
-- The Writer agent (Sonnet) generates the alert draft from intel raw_text.
-- The Verifier agent extracts factual claims and grounds each against
-- raw_text, returning supported / unsupported. Admin review shows the
-- unsupported high-severity claims as warnings before publish.

alter table alerts
  add column if not exists fact_check_claims jsonb,
  add column if not exists fact_check_at timestamptz;

-- Claim shape stored in fact_check_claims:
-- [
--   {
--     "claim": "400+ properties",
--     "supported": false,
--     "severity": "high",          -- "high" | "low"
--     "source_excerpt": null        -- string quoted from raw_text when supported
--   }
-- ]

comment on column alerts.fact_check_claims is
  'JSON array of {claim, supported, severity, source_excerpt} produced by verifyAlertDraft.';
comment on column alerts.fact_check_at is
  'Timestamp when the last fact-check pass ran on this alert draft.';
