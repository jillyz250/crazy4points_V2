-- Seed scrape_urls for Malaysia Airlines Enrich (oneworld). Refreshed program effective 2026-01-01.
update programs set
  scrape_urls = '{
    "main": "https://enrich.malaysiaairlines.com/",
    "tiers": "https://enrich.malaysiaairlines.com/EnrichUpdates2026",
    "earn": "https://enrich.malaysiaairlines.com/earn-points",
    "redeem": "https://enrich.malaysiaairlines.com/redeem-points"
  }'::jsonb,
  updated_at = now()
where slug = 'malaysia';
