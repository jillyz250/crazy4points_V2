-- 665_vendor_radar.sql — Vendor capability radar (Morgan, Chief of Staff, 2026-09-03).
-- Jill forwards vendor "what's new" emails (Supabase features, Firecrawl updates,
-- Vercel changelogs, etc.) to the SAME intel inbox she uses for travel/points news.
-- The inbound route detects a vendor product-update, has Claude read + assess it,
-- and files it here for Morgan to triage; Jill reviews and decides whether to act
-- or discuss. (Invoices from the same inbox go to the `expenses` ledger instead;
-- travel/points news continues down the existing loyalty-story path untouched.)

create table if not exists public.vendor_radar (
  id              uuid primary key default gen_random_uuid(),
  received_at     timestamptz not null default now(),
  vendor          text,                          -- Supabase, Firecrawl, Vercel, ... (best-effort from the email)
  subject         text,                          -- the email subject line
  whats_new       text,                          -- 1-2 line summary of the capability / change
  could_help      text,                          -- how it could help crazy4points (or an honest "no clear fit")
  disposition     text not null default 'fyi'    -- 'discuss' = worth Jill's time · 'fyi' = awareness only
                    check (disposition in ('discuss','fyi')),
  suggested_owner text,                           -- teammate who should weigh in (bill, devon, priya, erica, ...)
  status          text not null default 'new'     -- new | reviewed | acted | dismissed
                    check (status in ('new','reviewed','acted','dismissed')),
  source_email    text,                           -- who forwarded / original sender (audit trail)
  raw_excerpt     text,                           -- capped excerpt of the email body (audit / re-read)
  decided_note    text,                           -- Jill's note on review
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- Default view is "new first, newest first" — index the triage sort key.
create index if not exists vendor_radar_status_idx
  on public.vendor_radar (status, received_at desc);

-- SECURITY: internal admin-only, same model as the org/expenses tables (651/655/656).
-- Admin pages use the service-role client (bypasses RLS). RLS ON + NO public policies
-- = default-deny to anon + authenticated, so the radar is never publicly readable.
alter table public.vendor_radar enable row level security;
