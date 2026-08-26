-- 632_claim_verifications_resolution.sql
-- How a finding was resolved when a human acts on it in the /admin/agents inbox.
-- Feeds the accuracy scorecard (guarantee G-2): real fixes vs false positives.
--   fixed          = discrepancy confirmed + our page corrected/added to
--   dismissed      = acknowledged, no page change needed
--   false_positive = the finding was wrong (tune the checker)

alter table public.claim_verifications
  add column if not exists resolution text;

create index if not exists claim_verifications_resolution_idx
  on public.claim_verifications (resolution);
