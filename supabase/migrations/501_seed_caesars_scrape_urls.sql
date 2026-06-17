-- Seed scrape_urls for Caesars Rewards so research-program.mjs can crawl official pages.

update programs set
  scrape_urls = '{
    "tiers": "https://www.caesars.com/caesars-rewards/tiers",
    "how_it_works": "https://www.caesars.com/caesars-rewards/how-it-works",
    "tc": "https://www.caesars.com/caesars-rewards/terms-and-conditions",
    "news": "https://www.caesars.com/caesars-rewards/news"
  }'::jsonb,
  updated_at = now()
where slug = 'caesars';
