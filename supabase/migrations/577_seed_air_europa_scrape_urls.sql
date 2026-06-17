update programs set
  scrape_urls = '{
    "main": "https://www.aireuropa.com/us/en/aea/suma/our-program.html",
    "tiers": "https://www.aireuropa.com/us/en/aea/suma/our-program/cards-and-benefits.html",
    "miles": "https://www.aireuropa.com/ot/en/aea/suma/our-program/miles-suma-miles-level.html",
    "partners": "https://www.aireuropa.com/us/en/aea/suma/our-program/our-partners.html"
  }'::jsonb,
  updated_at = now()
where slug = 'air-europa';
