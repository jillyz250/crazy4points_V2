-- 630_claim_verifications_reconciliation.sql
-- Adds the three-way reconciliation outcome to the fact-checker ledger.
-- reconciliation: match | conflict | gap | unchecked  (guarantee G-6, G-3)
--   match     = our page agrees with the official source
--   conflict  = our page disagrees with official -> fix our page
--   gap       = official has a fact our page is MISSING -> add to our page
--   unchecked = official source could not be reached (bot wall etc.) -> manual check
-- proposed_addition: for a gap, the fact to add to the program/card page.

alter table public.claim_verifications
  add column if not exists reconciliation text,
  add column if not exists proposed_addition text;

create index if not exists claim_verifications_reconciliation_idx
  on public.claim_verifications (reconciliation)
  where reconciliation in ('conflict', 'gap');
