-- Step 7.5 - add Air Canada media room to Scout sources.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'Air Canada Media Room',
  'https://www.aircanada.com/media/',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'Air Canada press releases (HTML; Firecrawl-blocked on most aircanada.com pages but worth trying daily). Watch for award chart updates, status program changes, transfer-bonus promos. Programs: aeroplan'
)
on conflict do nothing;
