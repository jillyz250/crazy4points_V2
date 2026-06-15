-- Migration 442: Backfill spend_window_months on co-brand welcome bonuses
--
-- ~15 pre-existing co-brand cards had a welcome-bonus row with
-- spend_required_usd > 0 but spend_window_months IS NULL. Each of those rows
-- already carries an issuer-sourced spend_window_days value, and the months
-- value below was re-verified directly against the official issuer offer page
-- (Firecrawl scrape, 2026-06-15) — no third-party sources, per
-- plans/card-data-source-policy.md.
--
-- Verified windows (issuer page quote):
--   amex-hilton-honors          "$2,000 ... in the first 6 months"  -> 6  (180d)
--   amex-hilton-honors-surpass  "$3,000 ... in the first 6 months"  -> 6  (180d)
--   amex-hilton-honors-aspire   "$6,000 ... in the first 6 months"  -> 6  (180d)
--   amex-hilton-honors-business "$8,000 ... in the first 6 months"  -> 6  (180d)
--   barclays-jetblue            "$1,000 ... in the first 90 days"   -> 3  (90d)
--   barclays-jetblue-plus       "$1,000 ... within the first 90 days" -> 3 (90d)
--   barclays-jetblue-business   "$2,000 ... within the first 90 days" -> 3 (90d)
--   barclays-jetblue-premier    "$5,000 ... within the first 90 days" -> 3 (90d)
--   barclays-wyndham-rewards-earner-plus     "$1,000 ... first 90 days" -> 3 (90d)
--   barclays-wyndham-rewards-earner-business "$3,000 ... first 90 days" -> 3 (90d)
--   citi-aadvantage-mileup          "$500 ... within the first 3 months"   -> 3 (90d)
--   citi-aadvantage-executive       "$7,000 ... within the first 3 months" -> 3 (90d)
--   citi-aadvantage-platinum-select "$3,500 ... within the first 4 months" -> 4 (120d)
--   citi-aadvantage-business        "$4,000 ... within the first 4 months" -> 4 (120d)
--   citi-aadvantage-globe           "$5,000 ... within the first 4 months" -> 4 (120d)
--
-- Sources: hilton.com/en/hilton-honors/credit-cards/,
--   jetblue.com/trueblue/credit-cards/jetblue-card-comparison,
--   cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-{plus,business}-card,
--   creditcards.aa.com/credit-cards/citi-{mileup,executive,platinum,business,globe}-card-american-airlines-direct/

update credit_card_welcome_bonuses w
set spend_window_months = v.months,
    updated_at = now(),
    last_verified = current_date
from (values
  ('amex-hilton-honors', 6),
  ('amex-hilton-honors-surpass', 6),
  ('amex-hilton-honors-aspire', 6),
  ('amex-hilton-honors-business', 6),
  ('barclays-jetblue', 3),
  ('barclays-jetblue-plus', 3),
  ('barclays-jetblue-business', 3),
  ('barclays-jetblue-premier', 3),
  ('barclays-wyndham-rewards-earner-plus', 3),
  ('barclays-wyndham-rewards-earner-business', 3),
  ('citi-aadvantage-mileup', 3),
  ('citi-aadvantage-executive', 3),
  ('citi-aadvantage-platinum-select', 4),
  ('citi-aadvantage-business', 4),
  ('citi-aadvantage-globe', 4)
) as v(slug, months)
join credit_cards c on c.slug = v.slug
where w.card_id = c.id
  and w.spend_required_usd > 0
  and w.spend_window_months is null;
