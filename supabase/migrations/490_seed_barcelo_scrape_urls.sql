-- Seed scrape_urls for Barceló MyBarceló so research-program.mjs can crawl official pages.

update programs set
  scrape_urls = '{
    "tiers": "https://www.barcelo.com/en-us/mybarcelo/",
    "outbound_transfers": "https://www.barcelo.com/en-us/bhg/partners/",
    "tc": "https://www.barcelo.com/en-us/mybarcelo/terms-conditions/",
    "news": "https://www.barcelo.com/en-us/bhg/press-room/"
  }'::jsonb,
  updated_at = now()
where slug = 'barcelo';
