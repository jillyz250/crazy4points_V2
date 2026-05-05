-- Step 7.5 - add Breeze press releases to Scout sources.
-- Breeze publishes press releases on flybreeze.com/news (HTML; no public RSS).

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Breeze Airways News',
  'https://www.flybreeze.com/news',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Breeze press releases (HTML; no RSS). Use Firecrawl. Watch for route launches, base additions, program changes, and any further Breezy Rewards updates. Programs: breeze'
)
on conflict do nothing;
