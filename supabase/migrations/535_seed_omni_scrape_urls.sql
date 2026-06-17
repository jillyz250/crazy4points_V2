-- Seed scrape_urls for Omni Select Guest so research-program.mjs can attempt official pages.
-- Omni relaunched Select Guest as a revenue-based program (Feb 2024):
--   Tiers: Member / Insider / Champion / Icon (formerly Gold / Platinum / Black).

update programs set
  scrape_urls = '{
    "main": "https://www.omnihotels.com/loyalty",
    "tiers": "https://www.omnihotels.com/loyalty/member-tiers",
    "benefits": "https://www.omnihotels.com/loyalty/member-benefits",
    "faq": "https://www.omnihotels.com/loyalty/faq"
  }'::jsonb,
  updated_at = now()
where slug = 'omni';
