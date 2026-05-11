-- 083_partner_redemptions_hub_columns.sql
-- Schema foundation for The Points Hub tools. Adds 6 columns to
-- partner_redemptions so every Hub tool (Best Way to Book It, Should I
-- Transfer?, Don't Sleep, Earn Path, Will My FNC Fit?, Where Can My Points
-- Take Me?) can render rich decision-support context without re-querying
-- or re-parsing free-form fields.
--
-- Per the spec (plans/points-hub-tools.md):
--
--   complexity_score      — friction signal: easy / annoying / nerd_stuff
--   what_breaks_this      — plain-language catch surfaced inline
--   devalued_at           — date the redemption was devalued
--   devaluation_note      — what changed
--   availability_reality  — SPARSE; populate only with HIGH-confidence
--                           industry-consensus signal (excellent or unicorn).
--                           NULL means no chip renders. NULL = honest.
--   route_buckets         — text[] array of deterministic route buckets the
--                           row applies to. Replaces fragile keyword-matching
--                           on region_or_route. Backfilled by migration 084.

alter table partner_redemptions
  add column if not exists complexity_score text
    check (complexity_score is null or complexity_score in
      ('easy', 'annoying', 'nerd_stuff')),
  add column if not exists what_breaks_this text,
  add column if not exists devalued_at date,
  add column if not exists devaluation_note text,
  add column if not exists availability_reality text
    check (availability_reality is null or availability_reality in
      ('excellent', 'good', 'mixed', 'rare', 'unicorn')),
  add column if not exists route_buckets text[];

create index if not exists partner_redemptions_route_buckets_idx
  on partner_redemptions using gin (route_buckets);

comment on column partner_redemptions.complexity_score is
  'How much friction the booking process has. easy = online + no surcharges + 1 program. annoying = phone-only, per-segment traps, surcharge risk. nerd_stuff = multi-carrier itineraries, married segments, stopover gymnastics.';
comment on column partner_redemptions.what_breaks_this is
  'Plain-language catch worth surfacing inline. Example: "BA fuel surcharges $700+ on own metal." Optional - populate when a non-obvious gotcha exists.';
comment on column partner_redemptions.devalued_at is
  'Date the redemption was materially devalued. Triggers a "Devalued [Mmm YYYY]" chip when set.';
comment on column partner_redemptions.devaluation_note is
  'Brief description of what changed at devaluation.';
comment on column partner_redemptions.availability_reality is
  'How reliably this redemption can actually be booked, separate from chart price. SPARSE - only populate when industry consensus is strong. NULL means no chip renders. Trust beats fuzzy ratings.';
comment on column partner_redemptions.route_buckets is
  'Array of route bucket tags this row applies to. Buckets: us-short, us-medium, us-long, us-eu-east, us-eu-west, us-japan, us-se-asia, us-me-india, us-pacific, us-africa, us-samerica. Replaces fragile keyword matching on region_or_route. Query: where ''us-eu-east'' = any(route_buckets)';
