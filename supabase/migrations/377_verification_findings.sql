-- ============================================================================
-- 377 - verification_findings: data-accuracy plan Layer 3 (weekly re-verification
-- sweep). For each program we maintain transfer data on, the sweep scrapes a
-- known roster source, has the model compare it to our stored
-- transfer_partners_outbound, and writes GHOST / MISSING / WRONG_RATIO findings
-- for human review. Flag-for-review only - never edits program data.
--
-- This is the productized version of the 2026-06-04 manual currency + hotel
-- audits. Closes the "silent factual drift nobody blogged about" gap that
-- Phase 1 (structure) and Phase 2 (announcements) can't catch.
--
-- Dedup key = content_hash (program + partner + finding_type) so a standing
-- discrepancy doesn't pile up every week; last_seen_at bumps instead.
-- ============================================================================
create table if not exists verification_findings (
  id uuid primary key default gen_random_uuid(),
  content_hash text unique not null,
  program_slug text not null,            -- program we maintain (amex, marriott-bonvoy, ...)
  partner_slug text,                     -- our partner slug (null if source-only / unmapped)
  partner_name text,                     -- partner name as seen in the source
  finding_type text not null,            -- ghost | missing | wrong_ratio
  ours text,                             -- our stored value (ratio / "listed" / "absent")
  theirs text,                           -- the source's value
  source_label text not null,
  source_url text not null,
  confidence text not null default 'med',-- high | med | low
  summary text not null,
  status text not null default 'new',    -- new | dismissed
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists verification_findings_status_idx on verification_findings(status, last_seen_at desc);
create index if not exists verification_findings_program_idx on verification_findings(program_slug);

-- Track when each program was last re-verified, for rotation as the source list grows.
alter table programs add column if not exists reverified_at timestamptz;

select 'verification_findings created' as ok;
