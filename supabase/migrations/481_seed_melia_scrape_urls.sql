-- Seed scrape_urls for MeliáRewards so research-program.mjs can crawl official pages.

update programs set
  scrape_urls = '{
    "tiers": "https://www.melia.com/en/meliarewards",
    "outbound_transfers": "https://www.melia.com/en/meliarewards/exchange",
    "tc": "https://www.melia.com/en/meliarewards/terms-conditions",
    "news": "https://www.melia.com/en/meliarewards/news"
  }'::jsonb,
  updated_at = now()
where slug = 'melia';
