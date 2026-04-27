-- Per-property data for hotel programs (Hyatt, Marriott, Hilton, IHG, etc.).
--
-- The existing `programs` table holds editorial content for the program as a
-- whole (intro, sweet spots, tier benefits). It does not hold per-property
-- facts (which Park Hyatt is which category, what's the peak rate at the
-- Andaz Tokyo, which all-inclusives are in the Inclusive Collection).
--
-- This table fills that gap. Generic by design — `category` is text so that
-- programs with letter-based or non-numeric tiers (e.g. dynamic-pricing
-- hotels) can use the same shape. Three pricing columns (off_peak, standard,
-- peak) accommodate Hyatt's pre-May-20-2026 chart. After May 20, we'll add
-- two more columns for the new 5-tier ("lowest"/"low"/"moderate"/"upper"/
-- "top") chart in a follow-up migration. Both shapes can coexist while we
-- transition.
--
-- Used by:
--   - Public sortable property list on /programs/[slug]
--   - The writer pipeline (utils/ai/) — passed as authoritative reference
--     data when drafting alerts and blog posts that mention specific
--     properties or category-level redemptions
--   - The fact-checker — to verify a draft's "Cat 4 = 18K points" claim
--     against the actual current category chart

create table if not exists hotel_properties (
  id                uuid primary key default gen_random_uuid(),
  program_id        uuid not null references programs(id) on delete cascade,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Identity
  name              text not null,
  brand             text,                   -- "Park Hyatt", "Andaz", "Hyatt Place"

  -- Location
  city              text,
  country           text,
  region            text check (region is null or region in (
                      'americas', 'europe', 'asia_pacific', 'middle_east_africa'
                    )),

  -- Pricing (program-specific interpretation; nullable for dynamic programs)
  category          text,                   -- "1"-"8" for Hyatt; "Cat A"-"F" for others
  off_peak_points   integer check (off_peak_points is null or off_peak_points >= 0),
  standard_points   integer check (standard_points is null or standard_points >= 0),
  peak_points       integer check (peak_points is null or peak_points >= 0),

  -- Metadata
  hotel_url         text,
  all_inclusive     boolean not null default false,
  notes             text,                   -- flagship, M&MS-only, brand-explorer eligible

  -- Audit
  last_verified     date
);

-- A given program shouldn't list the same property twice (case-insensitive)
create unique index if not exists hotel_properties_program_name_uniq
  on hotel_properties (program_id, lower(name));

-- Lookup indexes for filter/sort on the public page
create index if not exists hotel_properties_program_category_idx
  on hotel_properties (program_id, category);

create index if not exists hotel_properties_program_region_idx
  on hotel_properties (program_id, region);

create index if not exists hotel_properties_program_brand_idx
  on hotel_properties (program_id, brand);

-- Keep updated_at fresh
create or replace function hotel_properties_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists hotel_properties_updated_at on hotel_properties;
create trigger hotel_properties_updated_at
  before update on hotel_properties
  for each row execute function hotel_properties_set_updated_at();

-- RLS: public read-only. Authenticated admin clients write through the
-- service-role key (bypasses RLS), same pattern as programs/alerts.
alter table hotel_properties enable row level security;

drop policy if exists "hotel_properties are publicly readable" on hotel_properties;
create policy "hotel_properties are publicly readable"
  on hotel_properties for select
  to anon, authenticated
  using (true);

comment on table hotel_properties is
  'Per-property facts for hotel programs. Editorial content for the program as a whole lives in programs.intro/sweet_spots/etc.';
comment on column hotel_properties.category is
  'Program-specific category label. Hyatt uses "1"-"8"; other programs may use letters or non-numeric tiers.';
comment on column hotel_properties.last_verified is
  'Date the row was last spot-checked against the official program site. Quarterly review cadence.';
