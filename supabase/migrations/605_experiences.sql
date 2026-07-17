-- Experience listings watch (Phase 1: internal engine, Wyndham only).
--
-- NOTE: the existing `experiences` table is the 26-program editorial DIRECTORY
-- (/experiences hub + per-program pages, with a `recent_highlights` field). These
-- new tables are the MONITORING ENGINE: individual bid/redeem listings scraped
-- daily, which also feed fresh `recent_highlights` back onto that directory.
--
-- A daily cron (/api/cron/experiences-watch) scrapes each program's experiences
-- page (Firecrawl), parses listings to JSON (Claude Haiku), and upserts here.
--
-- Design reflects reviewer feedback (Copilot + ChatGPT, 2026-07-17):
--  * Store FACTS + our own editorial summary; never republish their copy/images.
--  * Split fixed-redeem price from auction bid fields (don't overload one column).
--  * Keep an append-only change history (editorial gold: "launched at 100k -> 150k").
--  * Track scraper health so a "HTTP 200 / parsed zero" silent failure is visible.
--  * Editorial verdict fields are human-approved drafts, never auto-published.
-- Public Finder is deliberately NOT built as a new tool (the /experiences
-- directory already exists); validate + legal review before scaling programs.

-- ── Individual listings ─────────────────────────────────────────────────────
create table if not exists public.experience_listings (
  id                    uuid primary key default gen_random_uuid(),
  program_slug          text not null,                 -- loyalty program: 'wyndham'
  source_platform       text,                          -- host platform (program != host)
  source_listing_key    text not null,                 -- provider id / normalized detail URL (dedup)
  canonical_experience_key text,                        -- best-effort identity across relaunches

  title                 text not null,
  detail_url            text,
  category              text,                           -- music | sports | entertainment | ...
  location              text,

  -- price: fixed redemption vs auction (kept separate on purpose)
  format                text,                           -- 'bid' | 'redeem'
  points_required       integer,                        -- fixed redeem price
  current_bid           integer,                        -- auction current bid
  minimum_bid           integer,
  bid_increment         integer,

  -- dates (timezone-aware; auction close times are local)
  event_date            text,                           -- as shown (formats vary)
  event_timezone        text,
  close_date            timestamptz,                    -- auction close, from detail page
  close_timezone        text,
  close_date_confidence text,                           -- 'exact' | 'approx' | 'unknown'

  image_url             text,                           -- source image (internal ref; do NOT republish w/o license)
  raw_listing_blob      jsonb,                          -- unprocessed Haiku output, for re-parse
  parse_confidence      text,

  -- editorial layer (human-approved DRAFTS only; the moat, never machine-published)
  editorial_summary     text,                           -- our own plain-English bundle summary
  editorial_verdict     text,                           -- our take
  best_for              text,
  watch_out_for         text,
  stay_included         boolean,
  tickets_included      boolean,
  food_included         boolean,
  vip_access_included   boolean,
  travel_included       boolean,
  editorial_reviewed_at timestamptz,

  -- lifecycle
  status                text not null default 'active', -- active | closed | removed
  status_reason         text,                           -- 'gone_from_source' | 'close_date_passed' | ...
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  last_checked_at       timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (program_slug, source_listing_key)
);
create index if not exists experience_listings_program_status_idx on public.experience_listings (program_slug, status);
create index if not exists experience_listings_close_date_idx     on public.experience_listings (close_date);
create index if not exists experience_listings_first_seen_idx     on public.experience_listings (first_seen_at desc);

-- ── Append-only change history ──────────────────────────────────────────────
create table if not exists public.experience_listing_changes (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.experience_listings(id) on delete cascade,
  change_type      text not null,                       -- 'new' | 'points' | 'close_date' | 'status' | 'other'
  field_name       text,
  old_value        text,
  new_value        text,
  detected_at      timestamptz not null default now()
);
create index if not exists experience_listing_changes_idx on public.experience_listing_changes (listing_id, detected_at desc);

-- ── Scraper-health / run log ────────────────────────────────────────────────
create table if not exists public.experience_scrape_runs (
  id               uuid primary key default gen_random_uuid(),
  program_slug     text not null,
  run_started_at   timestamptz not null default now(),
  run_completed_at timestamptz,
  http_ok          boolean,
  items_found      integer,
  items_parsed     integer,
  items_new        integer,
  items_changed    integer,
  items_closed     integer,
  parse_confidence text,
  success          boolean,
  error_message    text,
  created_at       timestamptz not null default now()
);
create index if not exists experience_scrape_runs_program_idx on public.experience_scrape_runs (program_slug, run_started_at desc);

-- Service-role only (cron + admin); no public/anon access.
alter table public.experience_listings         enable row level security;
alter table public.experience_listing_changes  enable row level security;
alter table public.experience_scrape_runs      enable row level security;
