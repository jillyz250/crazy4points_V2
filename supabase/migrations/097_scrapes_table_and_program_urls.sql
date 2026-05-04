-- Foundation for the monthly auto-refresh pipeline.
--
-- Adds:
--   1. programs.scrape_urls (jsonb)  — per-program URL list (shape varies
--      by program type; see /memory/project_next_session_2026_05_05_pickup.md)
--   2. programs.refresh_tier (int)   — 1 = monthly, 2 = quarterly, 3 = annual.
--      Drives the cron filter for which programs get refreshed each run.
--   3. scrapes (table)               — stores every scrape with content,
--      content_hash, previous_hash, and a flag indicating whether content
--      changed since last refresh. Tools/scripts query this for diffs.
--
-- See plans/auto-refresh-design.md (TBD) for the full architecture.

-- ============================================================
-- 1. programs.scrape_urls + refresh_tier
-- ============================================================

alter table programs
  add column if not exists scrape_urls   jsonb        not null default '{}'::jsonb,
  add column if not exists refresh_tier  smallint     not null default 2;

alter table programs
  drop constraint if exists programs_refresh_tier_chk;
alter table programs
  add constraint programs_refresh_tier_chk check (refresh_tier in (1, 2, 3));

comment on column programs.scrape_urls is
  'Per-program JSON of {url_type: url} pairs used by the monthly auto-refresh. Shape varies by program type — airline/loyalty programs use partners/chart/tiers/tc/lounge; hotels use brands/chart/tiers/tc/earning-partners; etc.';
comment on column programs.refresh_tier is
  '1 = monthly refresh (top 30 programs by traffic). 2 = quarterly. 3 = annual / long tail. Drives the scrape-all.mjs filter.';

-- ============================================================
-- 2. scrapes table — content history with diff detection
-- ============================================================

create table if not exists scrapes (
  id              uuid primary key default gen_random_uuid(),
  program_slug    text not null,
  url_type        text not null,
  url             text not null,
  scraped_at      timestamptz not null default now(),
  content_md      text not null,
  content_hash    text not null,
  prev_hash       text,
  changed         boolean not null default false,
  diff_summary    text,
  fetch_status    text not null default 'success'
                  check (fetch_status in ('success', 'firecrawl_blocked', 'http_error', 'empty', 'parse_error')),
  notes           text
);

create index if not exists scrapes_program_url_time_idx
  on scrapes (program_slug, url_type, scraped_at desc);

create index if not exists scrapes_changed_idx
  on scrapes (changed, scraped_at desc)
  where changed;

create index if not exists scrapes_fetch_status_idx
  on scrapes (fetch_status, scraped_at desc)
  where fetch_status != 'success';

alter table scrapes enable row level security;

drop policy if exists "scrapes are publicly readable" on scrapes;
create policy "scrapes are publicly readable"
  on scrapes for select
  to anon, authenticated
  using (true);

-- Writes go through service role (bypasses RLS) — same as programs / alerts pattern.

comment on table scrapes is
  'Auto-refresh content history. Each scrape captures markdown + content_hash. Diffs vs prev_hash drive change-detection alerts surfaced in the daily brief.';
comment on column scrapes.url_type is
  'Categorical type of URL within a program (partners, chart, tiers, tc, lounge, brands, etc.). Per-program-type defaults documented in project_next_session_2026_05_05_pickup.md.';
comment on column scrapes.changed is
  'TRUE when content_hash != prev_hash. Drives the change-report and editorial fix queue.';
comment on column scrapes.diff_summary is
  'LLM-generated one-paragraph diff of what changed (e.g., "LATAM removed from partner list; Air Tahiti Nui added").';
comment on column scrapes.fetch_status is
  'Capture path for non-success states. firecrawl_blocked = vendor unsupported (e.g., aa.com). http_error = 4xx/5xx. empty = success but no content. parse_error = unexpected response shape.';
