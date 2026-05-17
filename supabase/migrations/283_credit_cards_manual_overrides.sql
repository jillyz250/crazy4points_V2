-- Track manual field overrides on credit_cards.
--
-- Problem: when a field is set manually (e.g., foreign_transaction_fee_pct
-- because the issuer doesn't publish a public Schumer-box), the auto-extraction
-- pipeline returns null for that field on every future refresh. The
-- manually-set value sits there indefinitely with no signal if the issuer
-- changes it.
--
-- Solution: store per-field manual-override provenance separately so the admin
-- system can surface "manually-set values older than 12 months" for human
-- re-verification.
--
-- Shape:
--   {
--     "foreign_transaction_fee_pct": {
--       "value": 3.0,
--       "set_at": "2026-05-17T14:30:00Z",
--       "set_by": "editor",
--       "note": "Chase doesn't publish a public Schumer-box for this card"
--     },
--     "credit_score_recommended": { ... }
--   }
--
-- Same shape applies to programs.manual_overrides for the programs pipeline.

alter table credit_cards
  add column if not exists manual_overrides jsonb not null default '{}'::jsonb;

alter table programs
  add column if not exists manual_overrides jsonb not null default '{}'::jsonb;

comment on column credit_cards.manual_overrides is
  'Per-field provenance for manually-overridden values. Keyed by field name (foreign_transaction_fee_pct, credit_score_recommended, etc.) with {value, set_at, set_by, note}. Drives the /admin/manual-overrides stale-values report.';

comment on column programs.manual_overrides is
  'Same shape as credit_cards.manual_overrides — tracks manually-set program fields that the extraction pipeline can''t verify (e.g. hub airports, alliance overrides).';
