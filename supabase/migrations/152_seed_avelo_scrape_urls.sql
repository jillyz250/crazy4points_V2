-- Seed programs.scrape_urls for Avelo Airlines.
--
-- URLs verified via WebSearch site:aveloair.com 2026-05-05.
--
-- Avelo has two programs:
--   1. Avelo Rewards - card-tied points/Avelo Cash program (1 pt = $0.01 Avelo
--      Cash). Launched Jan 27, 2026 with the Avelo Airlines World Elite
--      Mastercard via Cardless (issued by First Electronic Bank).
--   2. Avelo PLUS - paid membership ($59/year first year, $99/year after),
--      launched September 2025. Not a points program; travel-perk subscription.
--
-- Skipping 'chart' (no chart - cash-equivalent), 'lounge' (no own-brand
-- lounges), 'tiers' (no elite tiers - the closest equivalent is the paid
-- PLUS membership).

update programs
set refresh_tier = 2,
    scrape_urls = jsonb_build_object(
      'tc',       'https://www.aveloair.com/rewards-terms-and-conditions',
      'earn',     'https://www.aveloair.com/avelo-credit-card',
      'partners', 'https://www.aveloair.com/avelo-plus',
      'card',     'https://www.aveloair.com/avelo-credit-card',
      'news',     'https://www.aveloair.com/company-news'
    )
where slug = 'avelo';
