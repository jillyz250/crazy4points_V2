-- ============================================================================
-- 372 - change_signals: external announcement-monitor findings (accuracy plan
-- Layer 1). The daily monitor scrapes issuer newsrooms + points-blog news pages,
-- keyword-prefilters for our programs + change verbs, then Haiku-classifies hits
-- into structured signals (devaluation / added-or-removed partner / ratio change)
-- for human review against our stored data. Flag-for-review only - never edits.
--
-- Dedup key = content_hash (source_url + program_slug + signal_type) so the same
-- announcement doesn't re-flag every day; last_seen_at bumps instead.
-- ============================================================================
create table if not exists change_signals (
  id uuid primary key default gen_random_uuid(),
  content_hash text unique not null,
  source_name text not null,
  source_url text not null,
  program_slug text,                     -- our program this likely affects (nullable)
  signal_type text not null,             -- devaluation | new_partner | ended_partner | ratio_change | other
  summary text not null,                 -- Haiku one-line description of the change
  excerpt text,                          -- source snippet for context
  confidence text not null default 'med',-- high | med | low
  status text not null default 'new',    -- new | dismissed
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists change_signals_status_idx on change_signals(status, last_seen_at desc);
create index if not exists change_signals_program_idx on change_signals(program_slug);

select 'change_signals created' as ok;
