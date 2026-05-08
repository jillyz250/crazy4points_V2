-- Seed Caribbean Airlines (Caribbean Miles) program row + scrape_urls.
--
-- Caribbean Airlines is the flag carrier of Trinidad and Tobago, with a
-- secondary hub in Kingston, Jamaica. Caribbean Miles was relaunched on
-- 01 January 2025 as a spend-based program (Bronze / Silver / Gold /
-- Platinum tiers) and as of 08 May 2026, peak redemption rates have been
-- eliminated (per program email to members). One row, type='airline' —
-- 1:1 carrier-to-program (no joint program structure).
--
-- This seed leaves Page-content fields empty; the editorial UPDATE lands
-- in a follow-up migration once research + Copilot fact-check clear.

insert into programs (
  slug,
  name,
  type,
  alliance,
  hubs,
  is_active,
  is_reference_stub,
  refresh_tier,
  scrape_urls
)
-- refresh_tier 2 = mid-priority weekly refresh (small regional carrier)
values (
  'caribbean-airlines',
  'Caribbean Airlines',
  'airline',
  'none',
  array['POS', 'KIN'],
  true,
  false,
  2,
  jsonb_build_object(
    'partners',  'https://www.caribbean-airlines.com/caribbean-miles/partners',
    'chart',     'https://www.caribbean-airlines.com/caribbean-miles/redeem-miles',
    'tiers',     'https://www.caribbean-airlines.com/caribbean-miles/tiers',
    'tc',        'https://www.caribbean-airlines.com/caribbean-miles/terms-and-conditions',
    'lounge',    'https://www.caribbean-airlines.com/lounges',
    'about',     'https://www.caribbean-airlines.com/caribbean-miles/about-caribbean-miles',
    'earn',      'https://www.caribbean-airlines.com/caribbean-miles/earn-miles'
  )
)
on conflict (slug) do update set
  type = excluded.type,
  alliance = excluded.alliance,
  hubs = excluded.hubs,
  is_active = excluded.is_active,
  is_reference_stub = excluded.is_reference_stub,
  refresh_tier = excluded.refresh_tier,
  scrape_urls = excluded.scrape_urls;
