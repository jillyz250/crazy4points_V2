-- Seed programs.scrape_urls + refresh_tier for Marriott Bonvoy.
--
-- URLs verified working with --wait=8000 during 2026-05-05 authoring session
-- (the upgrade landed in commit 6042b14). Plain Firecrawl markdown returns
-- only chrome on marriott.com SPA pages; --wait=8000 lets JS render before
-- scrape so content (tier benefits, FNA caps, transfer table) actually
-- captures.
--
-- Notable URL findings:
-- * 'chart' deliberately NULL — Marriott eliminated published category-band
--   pricing in March 2022. Pricing is dynamic within each category. The
--   FNA-redemption page (free_night_caps) is the canonical source for the
--   tiered point bands (20K / 25K / 35K / 50K / 85K) governing FNA
--   eligibility, since FNAs anchor the de-facto chart.
-- * 'outbound_transfers' uses the points-to-miles URL, not transferPartners.mi
--   (which redirects to Marriott's universal search shell as of 2026).
-- * 'news' is the press room — known good without --wait.
-- * Inbound card-to-Marriott transfers (Amex MR, Chase UR, Bilt) are NOT on
--   marriott.com; they live on issuer sites and require WebSearch fallback.

update programs
set refresh_tier = 1,
    scrape_urls = jsonb_build_object(
      'tiers',              'https://www.marriott.com/loyalty/member-benefits.mi',
      'outbound_transfers', 'https://www.marriott.com/loyalty/redeem/travel/points-to-miles.mi',
      'free_night_caps',    'https://www.marriott.com/loyalty/redeem/free-night-award-redemption.mi',
      'tc',                 'https://www.marriott.com/loyalty/terms/default.mi',
      'news',               'https://news.marriott.com/'
    )
where slug = 'marriott-bonvoy';
