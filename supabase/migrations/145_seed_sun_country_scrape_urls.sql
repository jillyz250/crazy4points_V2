-- Seed programs.scrape_urls for Sun Country Rewards.
--
-- URLs verified via WebSearch site:suncountry.com 2026-05-05.
--
-- Sun Country is a flat-tier leisure carrier program: 100 points = $1
-- (i.e. 1 pt = $0.01), fully fixed-value redemption, no alliance, no
-- lounges, no transfer partners, no elite tiers. Pending Allegiant
-- acquisition close (~May 13, 2026). Synchrony-issued Visa Signature is
-- the main co-brand earn accelerator (replaced prior First Bankcard).
--
-- Skipping 'chart' (no chart - cash-equivalent), 'lounge' (no own-brand
-- lounges), 'tiers' (no elite tiers).

update programs
set refresh_tier = 2,
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.suncountry.com/terms-and-conditions/sun-country-rewards',
      'earn',     'https://www.suncountry.com/help-center/sun-country-rewards',
      'partners', 'https://stories.suncountry.com/post/sun-country-rewards-unlock-savings-and-earn-rewards-when-you-travel',
      'card',     'https://www.synchrony.com/partner/sun-country/benefits',
      'news',     'https://ir.suncountry.com/news-releases'
    )
where slug = 'sun-country';
