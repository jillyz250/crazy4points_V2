-- Seed scrape_urls for Sonesta Travel Pass so research-program.mjs can pull official pages.
-- 4 tiers: Bronze / Silver / Gold / Platinum. Earn + redeem at participating Sonesta brands.

update programs set
  scrape_urls = '{
    "main": "https://travelpass.sonesta.com/",
    "benefits": "https://www.sonesta.com/sonesta-travel-pass",
    "terms": "https://www.sonesta.com/sonesta-travel-pass-terms-conditions",
    "partners": "https://www.sonesta.com/our-partners"
  }'::jsonb,
  updated_at = now()
where slug = 'sonesta';
