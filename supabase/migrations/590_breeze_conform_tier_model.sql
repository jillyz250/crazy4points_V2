-- Fix Breeze to match the welcome-bonus convention used by all 11 other tiered cards:
--   bonus_amount = the FIRST/headline tier; tiered_bonuses = the ADDITIONAL unlock(s).
-- Breeze had stored the TOTAL (50,000) as bonus_amount with the two components (30k+20k) as tiers,
-- so the formatter double-counted to "Up to 100,000". Conform it:
--   bonus_amount      30000  (first tier: 30k after $1k in 90 days / 3 months, + Breezy 1)
--   spend_required_usd 1000  (first tier spend)
--   spend_window_months  3   (90 days)
--   tiered_bonuses   [{20000 additional after $5,000 total in 180 days / 6 months}]
-- Formatter then renders: main 30,000 + additional 20,000 = "Up to 50,000" with the correct breakdown.
-- estimated_value_usd ($500, = 50,000 x 1c total) is unchanged.

update credit_card_welcome_bonuses set
  bonus_amount = 30000,
  spend_required_usd = 1000,
  spend_window_months = 3,
  spend_window_days = null,
  tiered_bonuses = '[
    {"bonus_amount": 20000, "spend_usd": 5000, "timeline_months": 6, "note": "20,000 more after $5,000 total spend in 180 days"}
  ]'::jsonb,
  updated_at = now()
where id = '9a17cb85-e6bc-4835-b942-f3a0691ac0c3';
