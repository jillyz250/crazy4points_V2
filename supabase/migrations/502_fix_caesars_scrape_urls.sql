-- Fix Caesars Rewards scrape_urls: /caesars-rewards/* paths all redirect to homepage.
-- Correct prefix is /myrewards/. Adding FAQ article for TC earn rates.

update programs set
  scrape_urls = '{
    "benefits": "https://www.caesars.com/myrewards/benefits-overview",
    "earn_redeem": "https://www.caesars.com/myrewards/earn-and-redeem",
    "seven_stars": "https://www.caesars.com/myrewards/sevenstars",
    "tc_faq": "https://caesarsrewards.custhelp.com/app/answers/detail/a_id/233"
  }'::jsonb,
  updated_at = now()
where slug = 'caesars';
