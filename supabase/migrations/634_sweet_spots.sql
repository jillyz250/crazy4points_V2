-- 634_sweet_spots.sql
-- Curated sweet-spots dataset (Sweet-Spot Agent v2 — the value-first approach).
-- Each row is a researched, high-value redemption of the kind readers actually
-- want: free stopovers, cheap first class, lounge value, standout business.
-- Researched from aggregators as LEADS (lead_source_url), then verified against
-- the official source (official_source_url) before publishing — blogs are never
-- cited in published content, only used to find the lead.

create table if not exists public.sweet_spots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  value_type text not null,              -- stopover | first_class | business | lounge | value
  program_slug text not null,            -- the booking program (atmos, flying-blue, aeroplan, ...)
  operating_partner text,                -- the metal flown, e.g. cathay, ana (nullable)
  cabin text,                            -- first | business | economy | null
  points integer,                        -- one-way/round-trip points cost (nullable for stopover/lounge)
  route text,                            -- "US West Coast to Japan" (nullable)
  value_angle text not null,             -- the one-line why-it-matters (kept qualitative)
  detail text,                           -- longer description / how to book
  lead_source_url text,                  -- where we found the lead (aggregator; never cited publicly)
  official_source_url text,              -- the issuer/program page to verify against
  verified text not null default 'unverified',  -- verified | unverified | needs_check
  verified_at timestamptz,
  status text not null default 'active', -- active | retired
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sweet_spots_value_type_idx on public.sweet_spots (value_type) where status = 'active';
create index if not exists sweet_spots_program_idx on public.sweet_spots (program_slug) where status = 'active';
