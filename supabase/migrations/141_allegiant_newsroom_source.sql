-- Step 7.5 - add Allegiant newsroom to Scout sources.
--
-- Allegiant's newsroom (Q4 Inc / Akamai-backed) does not expose a public
-- RSS feed; the press-releases page is HTML only. Scout scrapes the HTML
-- listing page directly. This matches how Frontier (`news.flyfrontier.com`)
-- and other newsroom-only carriers are seeded.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Allegiant Air Newsroom',
  'https://newsroom.allegiantair.com/press-releases/default.aspx',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Q4 Inc-hosted newsroom; HTML-only (no RSS). Use Firecrawl. Watch for fleet, route, and Sun Country merger updates.'
)
on conflict do nothing;
