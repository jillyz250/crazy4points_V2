-- Fix MGM scrape_urls: original paths 404'd. mgmresorts.com is Firecrawl-blocked
-- (Claude Code is also unable to WebFetch it). Updating to best-available URL paths
-- and noting the block so Claude Scout knows to rely on WebSearch for this program.
-- Card data sourced from card.fnbo.com (official issuer -- fetchable).

update programs set
  scrape_urls = '{
    "main": "https://www.mgmresorts.com/en/loyalty.html",
    "tiers": "https://www.mgmresorts.com/en/loyalty/rewards-tiers.html",
    "card_compare": "https://card.fnbo.com/landing/mgmrewards/mgm-card-compare",
    "card_features": "https://card.fnbo.com/mgmrewards/features-benefits"
  }'::jsonb,
  updated_at = now()
where slug = 'mgm';
