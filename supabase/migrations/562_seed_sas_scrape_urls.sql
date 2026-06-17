-- Seed scrape_urls for SAS EuroBonus. NOTE: SAS LEFT Star Alliance and joined SkyTeam (2024-09-01).
update programs set
  scrape_urls = '{
    "main": "https://www.flysas.com/en/eurobonus",
    "tiers": "https://www.flysas.com/en/eurobonus/member-levels",
    "partners": "https://www.flysas.com/en/eurobonus/partners",
    "spend": "https://www.flysas.com/en/eurobonus/use-points"
  }'::jsonb,
  updated_at = now()
where slug = 'sas';
