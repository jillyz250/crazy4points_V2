-- Foundation for the Partner Booking Tool: structured region pairs +
-- distance bands on partner_redemptions, plus an airports lookup table
-- that maps IATA codes to regions for origin/destination resolution.
--
-- BACKGROUND
-- ----------
-- partner_redemptions today uses free-form text in `region_or_route`
-- ("North America to Europe", "AA short-haul (~0-700 mi)"). The tool needs
-- structured lookups so a user entering "JFK -> AUA" can auto-resolve to
-- "North America -> Caribbean" and find matching rows without a per-route
-- entry for every airport pair.
--
-- DESIGN
-- ------
-- 1. `airports` table maps IATA codes to controlled-vocab regions + lat/lng
--    for great-circle distance computation.
-- 2. `partner_redemptions` gets origin_region / dest_region columns for
--    region-paired charts (AA, Atmos own metal, Delta), and
--    distance_band_low / distance_band_high for distance-banded charts
--    (Avios, Atmos partner chart). Hybrid programs (Atmos uses both for
--    different partners) populate whichever applies; both can be present.
-- 3. The existing `region_or_route` text field stays as a human-readable
--    label for the admin editor and the public page; the new columns drive
--    the tool's structured query.
--
-- The controlled-vocab regions match how award charts actually segment
-- the world (15 regions). Every airport gets exactly one region.

-- ============================================================
-- 1. airports table
-- ============================================================

create table if not exists airports (
  iata          text primary key,            -- 'JFK'
  icao          text,                         -- 'KJFK' (optional)
  name          text not null,                -- 'John F. Kennedy Intl'
  city          text not null,                -- 'New York'
  country       text not null,                -- ISO-2: 'US'
  region        text not null check (region in (
    'north_america',
    'hawaii',
    'caribbean',
    'central_america',
    'mexico',
    'south_america_1',
    'south_america_2',
    'europe',
    'north_africa',
    'sub_saharan_africa',
    'middle_east',
    'india_south_asia',
    'asia_1',
    'asia_2',
    'south_pacific'
  )),
  lat           numeric(8,5),
  lng           numeric(8,5)
);

create index if not exists airports_region_idx on airports (region);
create index if not exists airports_country_idx on airports (country);

alter table airports enable row level security;

drop policy if exists "airports are publicly readable" on airports;
create policy "airports are publicly readable"
  on airports for select
  to anon, authenticated
  using (true);

comment on table airports is
  'IATA-keyed airport directory. Drives the Partner Booking Tool''s origin/destination resolution to controlled-vocab regions for award-chart matching.';
comment on column airports.region is
  'Controlled vocabulary matching the 15 regions used by major award charts. Every airport maps to exactly one region.';

-- ============================================================
-- 2. partner_redemptions structured columns
-- ============================================================

alter table partner_redemptions
  add column if not exists origin_region        text,
  add column if not exists dest_region          text,
  add column if not exists distance_band_low    integer,
  add column if not exists distance_band_high   integer;

-- Constrain region values to the same controlled vocab as airports.region
-- (NULL allowed — distance-banded programs can leave both NULL).
alter table partner_redemptions
  drop constraint if exists partner_redemptions_origin_region_chk,
  drop constraint if exists partner_redemptions_dest_region_chk,
  drop constraint if exists partner_redemptions_distance_band_chk;

alter table partner_redemptions
  add constraint partner_redemptions_origin_region_chk check (
    origin_region is null or origin_region in (
      'north_america','hawaii','caribbean','central_america','mexico',
      'south_america_1','south_america_2','europe','north_africa',
      'sub_saharan_africa','middle_east','india_south_asia',
      'asia_1','asia_2','south_pacific'
    )
  ),
  add constraint partner_redemptions_dest_region_chk check (
    dest_region is null or dest_region in (
      'north_america','hawaii','caribbean','central_america','mexico',
      'south_america_1','south_america_2','europe','north_africa',
      'sub_saharan_africa','middle_east','india_south_asia',
      'asia_1','asia_2','south_pacific'
    )
  ),
  add constraint partner_redemptions_distance_band_chk check (
    distance_band_low is null
    or distance_band_high is null
    or distance_band_high >= distance_band_low
  );

-- Forward index: query by region pair
create index if not exists partner_redemptions_region_pair_idx
  on partner_redemptions (origin_region, dest_region)
  where is_active and origin_region is not null and dest_region is not null;

-- Distance band index for distance-banded program queries
create index if not exists partner_redemptions_distance_idx
  on partner_redemptions (distance_band_low, distance_band_high)
  where is_active and distance_band_low is not null;

comment on column partner_redemptions.origin_region is
  'Origin controlled-vocab region (matches airports.region). NULL when this row prices by distance band only.';
comment on column partner_redemptions.dest_region is
  'Destination controlled-vocab region (matches airports.region). NULL when this row prices by distance band only.';
comment on column partner_redemptions.distance_band_low is
  'Lower bound of distance band in miles (inclusive). For programs that price by distance (Avios, Atmos partner chart). NULL when this row prices by region pair only.';
comment on column partner_redemptions.distance_band_high is
  'Upper bound of distance band in miles (inclusive). NULL when distance_band_low is also NULL.';
