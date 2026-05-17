-- Track manual-source verification on credit_card_benefits.
--
-- Context: many card benefits (insurance/protection terms, dollar limits,
-- deductibles) live in Visa or Mastercard "Guide to Benefits" PDFs that
-- Firecrawl can't reach. Those benefit rows get sourced manually from
-- Chase's published guides and inserted via SQL. Without a verification
-- timestamp, we lose track of which manually-sourced benefits are still
-- current vs. months-old and possibly stale.
--
-- These columns are populated on every manual insert (verified_at = now(),
-- verified_source_url = the page or PDF the terms were sourced from). The
-- admin stale-values report can then surface benefits where verified_at
-- is older than ~12 months for re-audit. Extraction-driven rows can leave
-- both null (they rerun on extraction so freshness is implicit).

alter table credit_card_benefits
  add column if not exists verified_at timestamptz;

alter table credit_card_benefits
  add column if not exists verified_source_url text;

comment on column credit_card_benefits.verified_at is
  'Timestamp when a manually-sourced benefit (e.g. insurance terms from a Visa Guide to Benefits PDF) was last verified against the issuer''s current published terms. Null for benefits sourced via the automated extraction pipeline — freshness for those is tracked at the extraction level. Populate this column whenever the row is inserted or updated via manual SQL.';

comment on column credit_card_benefits.verified_source_url is
  'URL of the issuer source the manually-sourced benefit terms came from (e.g. https://www.chase.com/.../guide-to-chase-ink-business-preferred-benefits). Used by the stale-values audit report so the editor can re-open the exact source when re-verifying.';

create index if not exists credit_card_benefits_verified_at_idx
  on credit_card_benefits (verified_at);
