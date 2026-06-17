-- Seed scrape_urls for Stash Hotel Rewards so research-program.mjs can pull official pages.
-- Stash = points program for independent hotels; no tiers, earn 5 pts/$1, redeem for free nights,
-- points never expire, no blackout dates.

update programs set
  scrape_urls = '{
    "how_it_works": "https://www.stashrewards.com/how-stash-works",
    "faq": "https://www.stashrewards.com/questions",
    "earn": "https://www.stashrewards.com/earn-points",
    "redeem": "https://www.stashrewards.com/redeem-points"
  }'::jsonb,
  updated_at = now()
where slug = 'stash';
