-- 668_vendors.sql — Erica's vendor directory.
-- One row per vendor we pay for: the relationship record (contact, website,
-- login, plan, pricing, renewal) that sits alongside the money (/admin/expenses)
-- and their product updates (vendor_radar). Consolidated under Finance (Erica).
-- Admin-only data (contacts + pricing) → RLS on with NO public policies, so it's
-- reachable only via the service-role admin client. (Jill, 2026-09-04.)

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,                          -- infra | ai | email | data | hosting | workspace | other
  website text,                           -- marketing/home page
  account_url text,                       -- login / billing console
  contact_name text,
  contact_email text,
  plan text,                              -- e.g. "Pro + usage"
  flat_monthly numeric not null default 0,-- flat monthly subscription, whole dollars
  usage_monthly numeric,                  -- metered/usage on top, when applicable
  billing_cycle text not null default 'monthly', -- monthly | annual | usage
  renewal_date date,                      -- for prepaid/annual plans
  status text not null default 'active',  -- active | trial | cancelled
  rec text,                               -- hold | watch | action (Erica's recommendation)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_status_idx on public.vendors (status);

alter table public.vendors enable row level security;
-- No policies on purpose: admin-only, accessed via the service-role client.

comment on table public.vendors is 'Erica''s vendor directory — relationship + pricing records for tools we pay for. Admin-only (RLS on, no public policies).';
