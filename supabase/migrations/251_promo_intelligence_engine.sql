-- 251_promo_intelligence_engine.sql
-- Foundation for the Promo Intelligence Engine (plans/promo-scraper.md).
--
-- Three tables:
--   1. promo_rewards     — scraped promo data + enriched intel fields + admin queue state
--   2. scrape_runs       — observability log for every scraper invocation
--   3. chart_snapshots   — full-page hashes for chart-delta detection (Phase 3)
--
-- Phase 0 scope: tables only. No code path writes to them yet.
-- Phase 1 (Flying Blue scraper) will be the first writer.
--
-- Authored: 2026-05-13

begin;

-- ── scrape_runs ──────────────────────────────────────────────────────
-- Every scraper invocation creates a row here. Surfaces in admin
-- dashboard for monitoring scraper health.
create table if not exists scrape_runs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  scraper_slug text not null,
  source_url text not null,
  ran_at timestamptz not null default now(),
  duration_ms integer,
  status text not null check (status in ('success','partial','failed')),
  items_seen integer default 0,
  items_new integer default 0,
  items_updated integer default 0,
  items_disappeared integer default 0,
  firecrawl_credits_used integer,
  error_log text,
  raw_response_hash text
);

create index if not exists scrape_runs_program_id_ran_at_idx
  on scrape_runs (program_id, ran_at desc);

comment on table scrape_runs is
  'Observability log for every scraper invocation. One row per run.';

-- ── promo_rewards ────────────────────────────────────────────────────
-- The main entity. Carries raw scraped data, enriched intel, and
-- admin-queue lifecycle. Nothing renders on public surfaces until
-- admin_status = ''published''.
create table if not exists promo_rewards (
  id uuid primary key default gen_random_uuid(),

  -- Identity / source
  program_id uuid references programs(id) on delete cascade,
  source_url text not null,
  external_id text,
  raw_snapshot_hash text not null,

  -- Scrape lifecycle
  first_scraped_at timestamptz not null default now(),
  last_scraped_at timestamptz not null default now(),
  last_seen_active boolean not null default true,
  scrape_run_id uuid references scrape_runs(id) on delete set null,

  -- Raw promo data (parsed from scrape)
  promo_label text,
  origin_iata text,
  dest_iata text,
  origin_label text,
  dest_label text,
  cabin text,
  carrier_slug text,
  points_required integer check (points_required is null or points_required >= 0),
  points_baseline integer check (points_baseline is null or points_baseline >= 0),
  cash_co_pay_amount numeric,
  cash_co_pay_currency text,
  valid_from date,
  valid_to date,
  booking_window_end date,
  raw_payload jsonb,

  -- Intelligence layer (computed by enrichment pipeline)
  intel_type text check (intel_type in (
    'monthly_promo','transfer_bonus','award_sale','flash_sale',
    'partner_discount','status_fast_track','chart_change','partner_change'
  )),
  intel_discount_percent numeric,
  intel_value_score numeric check (intel_value_score is null or (intel_value_score >= 0 and intel_value_score <= 100)),
  intel_affects_redemption_ids uuid[],
  intel_affects_alert_ids uuid[],
  intel_match_confidence text check (intel_match_confidence in ('high','medium','low','unmatched')),

  -- Admin queue lifecycle
  admin_status text not null default 'pending' check (admin_status in (
    'pending','approved','published','rejected','ignored'
  )),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promo_rewards_program_id_idx
  on promo_rewards (program_id);

create index if not exists promo_rewards_admin_status_idx
  on promo_rewards (admin_status)
  where admin_status in ('pending','approved');

create index if not exists promo_rewards_valid_to_idx
  on promo_rewards (valid_to)
  where last_seen_active = true;

create index if not exists promo_rewards_intel_type_idx
  on promo_rewards (intel_type);

create index if not exists promo_rewards_published_idx
  on promo_rewards (program_id, valid_to)
  where admin_status = 'published' and last_seen_active = true;

-- Idempotency: same raw content for same source URL collapses to one row.
create unique index if not exists promo_rewards_dedupe_idx
  on promo_rewards (source_url, raw_snapshot_hash);

comment on table promo_rewards is
  'Scraped promo deals + enriched intel + admin queue state. Public surfaces only read rows where admin_status = ''published''.';

comment on column promo_rewards.raw_snapshot_hash is
  'Content hash of the raw scrape payload. Used for dedupe and to detect when a previously-seen promo''s data changed.';

comment on column promo_rewards.last_seen_active is
  'False when the most recent scrape no longer surfaces this promo. After 24+ hours of inactivity, public renders hide the row automatically.';

comment on column promo_rewards.admin_status is
  'Curator queue state. pending → approved → published. Rejected and ignored are terminal. Nothing renders on public surfaces unless published.';

-- ── chart_snapshots ──────────────────────────────────────────────────
-- Phase 3 chart-delta detection storage. Every scraper run snapshots
-- the full page content; subsequent runs compare hashes and surface
-- a "chart changed" promo_rewards row when they diverge.
create table if not exists chart_snapshots (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  source_url text not null,
  snapshot_hash text not null,
  snapshot_text text,
  taken_at timestamptz not null default now()
);

create index if not exists chart_snapshots_program_id_taken_at_idx
  on chart_snapshots (program_id, taken_at desc);

create index if not exists chart_snapshots_url_hash_idx
  on chart_snapshots (source_url, snapshot_hash);

comment on table chart_snapshots is
  'Full-page content hashes for chart-delta detection. Phase 3 of promo-scraper plan. Phase 0 ships the table only.';

-- ── updated_at trigger on promo_rewards ──────────────────────────────
create or replace function promo_rewards_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists promo_rewards_updated_at on promo_rewards;
create trigger promo_rewards_updated_at
  before update on promo_rewards
  for each row
  execute function promo_rewards_set_updated_at();

commit;
