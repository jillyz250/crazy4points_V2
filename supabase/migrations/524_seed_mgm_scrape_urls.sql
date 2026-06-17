-- Seed scrape_urls for MGM Rewards so research-program.mjs can pull official pages.
-- MGM Rewards (rebranded from M life Rewards in 2022) -- 5 tiers: Sapphire, Pearl, Gold, Platinum, Noir.

update programs set
  scrape_urls = '{
    "main": "https://www.mgmresorts.com/en/loyalty/mgm-rewards.html",
    "benefits": "https://www.mgmresorts.com/en/loyalty/mgm-rewards/benefits.html",
    "earn_redeem": "https://www.mgmresorts.com/en/loyalty/mgm-rewards/earn-redeem.html",
    "partners": "https://www.mgmresorts.com/en/loyalty/mgm-rewards/partners.html"
  }'::jsonb,
  updated_at = now()
where slug = 'mgm';
