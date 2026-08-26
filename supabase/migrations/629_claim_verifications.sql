-- 629_claim_verifications.sql
-- Fact-Checker ledger (Accuracy Agent, Phase 1).
-- Every verifyClaim() call logs here: the claim, the verdict, what our page said,
-- what the official source said, whether they disagreed, and the correction.
-- This is the substrate the /admin/agents findings inbox and the accuracy
-- scorecard (guarantee G-2) read from.

create table if not exists public.claim_verifications (
  id uuid primary key default gen_random_uuid(),
  claim_text text not null,
  entity_type text,
  entity_slug text,
  fact_type text,
  verdict text not null,                 -- supported | refuted | unverified
  confidence text,                       -- high | medium | low
  our_page_evidence text,
  official_evidence text,
  official_source_url text,
  discrepancy boolean not null default false,
  correction text,
  source_type text,                      -- db | official | none
  source_ref text,
  reviewed_at timestamptz,               -- set when a human acts on it in the inbox
  created_by text,
  created_at timestamptz not null default now()
);

-- Inbox reads: newest first, and cheap filters for "discrepancies" and "unreviewed".
create index if not exists claim_verifications_created_at_idx
  on public.claim_verifications (created_at desc);
create index if not exists claim_verifications_discrepancy_idx
  on public.claim_verifications (discrepancy) where discrepancy = true;
create index if not exists claim_verifications_verdict_idx
  on public.claim_verifications (verdict);
