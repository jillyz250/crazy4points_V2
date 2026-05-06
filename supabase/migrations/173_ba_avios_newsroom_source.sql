-- Step 7.5 - add British Airways media centre to Scout sources.

insert into sources (name, url, type, tier, is_active, use_firecrawl, scrape_frequency, notes)
values (
  'British Airways Media Centre',
  'https://mediacentre.britishairways.com/',
  'official_partner',
  1,
  true,
  true,
  'daily',
  'BA media centre press releases (HTML; Firecrawl-friendly). Watch for award chart devaluations, tier-point earning changes, status program updates, transfer-bonus promos. Programs: ba-avios'
)
on conflict do nothing;
