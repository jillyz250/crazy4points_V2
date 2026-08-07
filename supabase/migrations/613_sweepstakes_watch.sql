-- Points & miles sweepstakes watcher.
--
-- Loyalty programs constantly run sweepstakes / daily-entry giveaways (AAdvantage
-- Perks, Stars Perks, Wyndham "1M points/day", hotel "moments", etc.). Each LIVE
-- sweepstakes is a high-engagement Facebook-post opportunity — the Wyndham
-- giveaway was crazy4points' best-performing post ever (point an ad at a c4p
-- landing page with "register at crazy4points.com" — see project_fb_giveaway_
-- landing_tactic). A daily watcher (/api/cron/sweepstakes-watch) scrapes the
-- configured source pages, extracts the live sweepstakes, and surfaces a count +
-- a "needs a social post" flag on the admin dashboard.

CREATE TABLE IF NOT EXISTS sweepstakes_sources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program    text NOT NULL,               -- e.g. 'American Airlines AAdvantage'
  url        text NOT NULL UNIQUE,         -- page to scrape for live sweepstakes
  active     boolean NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sweepstakes_sources IS
  'Seed list of points/miles pages the sweepstakes watcher scrapes. Add/disable rows to tune coverage.';

CREATE TABLE IF NOT EXISTS sweepstakes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     uuid REFERENCES sweepstakes_sources(id) ON DELETE SET NULL,
  program       text NOT NULL,            -- brand/program, e.g. 'Wyndham Rewards'
  title         text NOT NULL,            -- the sweepstakes name
  prize         text,                     -- what you can win
  entry_url     text,                     -- the entry/landing page (point ads here)
  source_url    text,                     -- page we found it on
  mechanic      text,                     -- 'one_time' | 'daily_entry' | 'unknown'
  ends_at       text,                     -- ISO YYYY-MM-DD enter-by deadline (text, per source)
  status        text NOT NULL DEFAULT 'running',   -- 'running' | 'ended'
  posted_social boolean NOT NULL DEFAULT false,    -- have we done the FB post yet
  first_seen    timestamptz NOT NULL DEFAULT now(),
  last_seen     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program, title)
);

CREATE INDEX IF NOT EXISTS sweepstakes_status_idx ON sweepstakes (status);

COMMENT ON TABLE sweepstakes IS
  'Live points/miles sweepstakes detected by /api/cron/sweepstakes-watch. Each running one is a Facebook-post candidate.';

-- Seed sources: points/miles programs that run sweepstakes / daily giveaways.
-- URLs are best-effort canonical promo pages; refine against live pages in
-- /admin as coverage is verified. Firecrawl renders JS so JS-gated pages work.
--
-- Verified 2026-08-07 (Firecrawl+Haiku dry run):
--   * The dedicated PERKS microsites (heatperks/starsperks) are the gold
--     sources - they host the actual AAdvantage member sweepstakes with real
--     enter-by dates. aa.com itself is HARD-BLOCKED by Firecrawl ("we do not
--     support this site"), so the aa.com perks hub is NOT seeded - the sweeps it
--     links to live on the microsites below, which scrape fine.
--   * Generic hotel/airline "promotions/offers/deals" pages are mostly
--     bonus-point offers, not sweepstakes, so they usually return nothing. They
--     are harmless (a clean empty result) and occasionally do carry a giveaway,
--     so a curated few are kept as low-yield coverage. Tune the list in /admin
--     as we learn where each program actually hides its sweepstakes.
INSERT INTO sweepstakes_sources (program, url, notes) VALUES
  ('HEAT Perks (AAdvantage)',            'https://www.heatperks.com/',                                          'AAdvantage x Miami HEAT daily-entry sweepstakes - verified live (Jill-provided)'),
  ('Stars Perks (AAdvantage)',           'https://www.starsperks.com/',                                         'AAdvantage x Dallas Stars sweepstakes - verified scrapable (Jill-provided)'),
  ('Wyndham Rewards',                    'https://www.wyndhamrewards.com/promotions',                           'Wyndham promos - watch for the periodic points sweepstakes'),
  ('Marriott Bonvoy',                    'https://www.marriott.com/loyalty/promotions.mi',                      'Marriott Bonvoy promotions'),
  ('World of Hyatt',                     'https://world.hyatt.com/content/gp/en/offers.html',                   'World of Hyatt offers'),
  ('IHG One Rewards',                    'https://www.ihg.com/onerewards/us/en/deals',                          'IHG One Rewards deals/offers'),
  ('Hilton Honors',                      'https://www.hilton.com/en/hilton-honors/member-offers/',              'Hilton Honors member offers'),
  ('Delta SkyMiles',                     'https://www.delta.com/us/en/skymiles/how-to-earn-miles/promotions',   'Delta SkyMiles promotions'),
  ('United MileagePlus',                 'https://www.united.com/en/us/fly/mileageplus/promotions.html',        'United MileagePlus promotions'),
  ('Alaska Mileage Plan',               'https://www.alaskaair.com/deals',                                     'Alaska deals/promotions'),
  ('Southwest Rapid Rewards',           'https://www.southwest.com/rapidrewards/promotions/',                  'Southwest Rapid Rewards promotions'),
  ('JetBlue TrueBlue',                   'https://www.jetblue.com/trueblue/promotions',                         'JetBlue TrueBlue promotions')
ON CONFLICT (url) DO NOTHING;
