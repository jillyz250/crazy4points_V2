-- Step 7.5 - add Sun Country IR newsroom to Scout sources.
-- Sun Country IR newsroom is HTML-only (no public RSS); same pattern as Allegiant.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Sun Country Airlines IR Newsroom',
  'https://ir.suncountry.com/news-releases',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Q4 Inc-hosted IR newsroom; HTML-only (no RSS). Use Firecrawl. Watch for Allegiant merger updates, program changes, fleet/route news. Programs: sun-country'
)
on conflict do nothing;
