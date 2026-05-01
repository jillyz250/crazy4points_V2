-- 067_create_partner_redemptions.sql
-- Structured partner-award redemption data for the Alliance Explorer tool
-- and per-airline page sections ("Where to spend my X miles" + reverse-lookup
-- "Who can book flights on me").
--
-- Coexists with the existing `sweet_spots` text field on programs, which
-- stays as the editorial/narrative surface. This table is the queryable
-- data layer that powers cross-alliance search, filtering by cabin/cost,
-- and the partner-airline grid on each program page.
--
-- Pricing model handles fixed-chart programs (AA, Atmos, Flying Blue partner
-- awards), dynamic-pricing programs (Delta SkyMiles, Virgin Flying Club),
-- and hybrid programs (United partner = chart, own metal = dynamic):
--   - fixed:   cost_miles_low = cost_miles_high = single price
--   - dynamic: cost_miles_low + cost_miles_high reflect observed range
--   - hybrid:  fields reflect partner-chart price; notes call out the carve-out
--
-- Used by:
--   - /tools/alliances Alliance Explorer (cross-alliance redemption search)
--   - /programs/[slug] airline pages (forward + reverse lookup grids)
--   - Future: Decision Engine, sweet-spot finder, transfer-partner map

create table if not exists partner_redemptions (
  id                       uuid primary key default gen_random_uuid(),

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- The miles you SPEND (e.g. AA, Atmos, Flying Blue)
  currency_program_id      uuid not null references programs(id) on delete cascade,

  -- The airline you FLY (e.g. Cathay Pacific). Same currency can book
  -- multiple partner carriers; same carrier can be booked with multiple
  -- currencies. Both directions are forward + reverse lookups.
  operating_carrier_id     uuid not null references programs(id) on delete cascade,

  cabin                    text not null check (cabin in (
                             'Economy', 'Premium Economy', 'Business', 'First'
                           )),

  -- Free-form so authors can use whatever shape fits ("HKG-JFK", "Asia from
  -- US", "Transatlantic", "Intra-Europe"). Not a controlled vocabulary on
  -- purpose; we'll add structure later if cross-tool search needs it.
  region_or_route          text not null,

  -- Pricing (nullable for either side; both NULL is allowed for "we know
  -- the redemption exists but haven't priced it yet")
  cost_miles_low           integer check (cost_miles_low is null or cost_miles_low >= 0),
  cost_miles_high          integer check (cost_miles_high is null or cost_miles_high >= 0),
  pricing_model            text not null default 'fixed' check (pricing_model in (
                             'fixed', 'dynamic', 'hybrid'
                           )),

  -- "Best availability via AA; no fuel surcharges". Markdown allowed.
  notes                    text,

  -- Per-claim audit trail (matches the convention from feedback memory)
  confidence               text not null default 'MED' check (confidence in (
                             'HIGH', 'MED', 'LOW'
                           )),
  last_verified            date,

  -- Soft delete for retired or no-longer-bookable redemptions. Keeps the
  -- row for historical reference without polluting public surfaces.
  is_active                boolean not null default true,

  -- Cost-range sanity: high should not be below low when both present
  constraint partner_redemptions_cost_range_chk check (
    cost_miles_low is null
    or cost_miles_high is null
    or cost_miles_high >= cost_miles_low
  )
);

-- Forward lookup: "Where can I spend my Atmos miles?"
create index if not exists partner_redemptions_currency_idx
  on partner_redemptions (currency_program_id)
  where is_active;

-- Reverse lookup: "Who can book flights on Cathay Pacific?"
create index if not exists partner_redemptions_operating_idx
  on partner_redemptions (operating_carrier_id)
  where is_active;

-- Cross-alliance search: "All First Class redemptions under 100k"
create index if not exists partner_redemptions_cabin_cost_idx
  on partner_redemptions (cabin, cost_miles_low)
  where is_active;

-- Pair lookup: "Atmos to Cathay" (both directions narrowed)
create index if not exists partner_redemptions_pair_idx
  on partner_redemptions (currency_program_id, operating_carrier_id)
  where is_active;

-- updated_at maintenance
create or replace function partner_redemptions_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists partner_redemptions_updated_at on partner_redemptions;
create trigger partner_redemptions_updated_at
  before update on partner_redemptions
  for each row execute function partner_redemptions_set_updated_at();

-- RLS: public read-only for active rows. Admin writes through service-role
-- key (bypasses RLS), same pattern as hotel_properties / programs / alerts.
alter table partner_redemptions enable row level security;

drop policy if exists "partner_redemptions are publicly readable" on partner_redemptions;
create policy "partner_redemptions are publicly readable"
  on partner_redemptions for select
  to anon, authenticated
  using (is_active);

comment on table partner_redemptions is
  'Structured partner-award redemption data. Editorial narrative for the same redemptions lives in programs.sweet_spots markdown.';
comment on column partner_redemptions.currency_program_id is
  'The miles spent on this redemption. FK to programs.id.';
comment on column partner_redemptions.operating_carrier_id is
  'The airline operating the flight. FK to programs.id. Differs from currency for partner redemptions.';
comment on column partner_redemptions.pricing_model is
  'fixed = single price; dynamic = range reflects observed pricing; hybrid = chart price for partner with own-metal carve-out in notes.';
comment on column partner_redemptions.region_or_route is
  'Free-form. "HKG-JFK", "Asia from US", "Transatlantic" all valid. Not a controlled vocabulary.';
comment on column partner_redemptions.last_verified is
  'Date the row was last spot-checked against the program search engine. Refresh quarterly or after schedule changes.';
