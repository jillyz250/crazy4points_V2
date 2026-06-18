-- Fix Breeze welcome-bonus tiered_bonuses key shape. It was written on 2026-06-15 with
-- non-canonical keys {amount, window_days}, but the card-page renderer and all 11 other
-- tiered cards use {bonus_amount, timeline_months}. Because the public card page reads these
-- keys directly (select * , no normalization), t.bonus_amount was undefined -> the tier
-- breakdown failed to render. Breeze was the only card of 12 with the wrong shape.
--   amount -> bonus_amount ; window_days -> timeline_months (90->3, 180->6).
-- Only the tiered_bonuses keys change here; spend_required_usd (the flat headline) is a
-- separate editorial decision handled in a follow-up.

update credit_card_welcome_bonuses set
  tiered_bonuses = '[
    {"bonus_amount": 30000, "spend_usd": 1000, "timeline_months": 3, "note": "plus Breezy 1 benefits"},
    {"bonus_amount": 20000, "spend_usd": 5000, "timeline_months": 6}
  ]'::jsonb,
  updated_at = now()
where id = '9a17cb85-e6bc-4835-b942-f3a0691ac0c3';
