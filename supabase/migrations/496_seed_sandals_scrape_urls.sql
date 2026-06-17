-- Seed scrape_urls for Sandals Select Rewards so research-program.mjs can crawl official pages.

update programs set
  scrape_urls = '{
    "tiers": "https://www.sandals.com/select-rewards/",
    "tc": "https://www.sandals.com/select-rewards/terms-conditions/",
    "news": "https://www.sandals.com/blog/"
  }'::jsonb,
  updated_at = now()
where slug = 'sandals';
