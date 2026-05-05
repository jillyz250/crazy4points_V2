-- Seed programs.scrape_urls for Allegiant Allways Rewards.
--
-- URLs verified via WebSearch site:allegiantair.com 2026-05-05.
--
-- Allegiant is a flat-tier ULCC program: 1 point = $0.01, fully dynamic
-- redemption value (no chart), no alliance, no lounges, no transfer
-- partners, no elite tiers. Co-brand Visa is the main earn accelerator.
--
-- Skipping: 'chart' (dynamic, no chart), 'lounge' (no own-brand lounges),
-- 'tiers' (no elite tiers — flat program).

update programs
set refresh_tier = 2,
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.allegiantair.com/rewards-terms',
      'earn',     'https://www.allegiantair.com/rewards-faqs',
      'partners', 'https://www.allegiantair.com/deals/allways-rewards/',
      'card',     'https://www.allegiantair.com/allways-rewards-visa-card',
      'news',     'https://newsroom.allegiantair.com/'
    )
where slug = 'allegiant';
