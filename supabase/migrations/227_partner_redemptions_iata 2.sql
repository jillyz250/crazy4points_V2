-- 227_partner_redemptions_iata.sql
-- Award Chart Rebuild (Option C) — Phase 1 schema, part 2.
--
-- Adds structured origin/dest IATA columns to partner_redemptions per
-- audit decision #5. Lets the chart compute engine run against specific
-- routes anchored on Don't Sleep / Top Sweet Spot rows, instead of parsing
-- free-form region_or_route text at query time.
--
-- Backfill is intentionally NOT in this migration — done by
-- scripts/backfill-partner-redemption-iata.mjs which can run idempotently
-- and report what was filled vs left NULL (regional rows can't be anchored
-- to a specific IATA pair and are expected to stay NULL).
--
-- Authored: 2026-05-11

begin;

alter table partner_redemptions
  add column if not exists origin_iata text,
  add column if not exists dest_iata   text;

comment on column partner_redemptions.origin_iata is
  '3-letter IATA code for the origin airport when the row anchors a specific '
  'route (e.g. Don''t Sleep sweet-spot rows). NULL on region-bucket rows.';
comment on column partner_redemptions.dest_iata is
  '3-letter IATA code for the destination airport when the row anchors a specific '
  'route. NULL on region-bucket rows.';

-- Light constraint: IATA must be exactly 3 uppercase letters when set.
alter table partner_redemptions
  add constraint partner_redemptions_origin_iata_format
    check (origin_iata is null or origin_iata ~ '^[A-Z]{3}$'),
  add constraint partner_redemptions_dest_iata_format
    check (dest_iata is null or dest_iata ~ '^[A-Z]{3}$');

-- Composite index for "find rows anchored to this specific route" queries.
create index if not exists partner_redemptions_route_iata_idx
  on partner_redemptions (origin_iata, dest_iata)
  where origin_iata is not null and dest_iata is not null;

commit;
