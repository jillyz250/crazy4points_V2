-- Seed programs.scrape_urls for Frontier Airlines (Frontier Miles).
--
-- URLs verified via WebSearch site:flyfrontier.com 2026-05-05. Frontier is
-- a fully dynamic-pricing program (no fixed chart since the FRONTIER Miles
-- relaunch in 2024), so the 'chart' key points to the program landing page
-- where dynamic redemption rules live rather than a chart page.
--
-- Frontier doesn't operate physical lounges, so no 'lounge' key.
-- Frontier's transfer-partner footprint is small (Wyndham 1:1 inbound is
-- the main one, plus a few cobrand earn partnerships), so 'partners' uses
-- the Frontier Miles homepage rather than a dedicated transfer-partner page.

update programs
set refresh_tier = 2,
    scrape_urls = jsonb_build_object(
      'tiers',    'https://www.flyfrontier.com/frontier-miles/elite-status-benefits/',
      'tc',       'https://www.flyfrontier.com/frontiermiles/terms-and-conditions/',
      'partners', 'https://www.flyfrontier.com/frontiermiles/',
      'news',     'https://news.flyfrontier.com/',
      'earn',     'https://faq.flyfrontier.com/help/how-are-frontier-miles-and-points-earned'
    )
where slug = 'frontier';
