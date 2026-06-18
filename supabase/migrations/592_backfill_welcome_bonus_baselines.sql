-- Backfill baseline_bonus_amount (the normal, non-promo welcome offer) on the 9 elevated-flagged
-- cards that were missing it, and correct is_elevated where the stored offer is actually the
-- standard offer (so they don't show up as fake "elevated" in the newsletter/history features).
-- Baselines sourced 2026-06-18 (Jill's domain knowledge + UpgradedPoints offer-history pages).
--
-- Genuinely elevated (keep is_elevated=true, set baseline = the normal offer):
--   Amex Gold              current 100,000  baseline  60,000
--   Amex Business Gold     current 200,000  baseline 100,000  (standard Jul24-Apr26)
--   Amex Business Platinum current 300,000  baseline 200,000  (prior public standard)
--   Breeze Easy            current up to 50k baseline 30,000  (30k is the standard; 50k tiered is limited-time)
--   Atmos Summit           current 100,000  baseline  80,000
-- Not actually elevated (stored offer = the standard; set is_elevated=false, baseline = current):
--   Air France KLM         50,000  | Atmos Business 80,000 | Bilt Palladium 50,000 | Atmos Ascent 50,000

update credit_card_welcome_bonuses set baseline_bonus_amount = 60000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'American Express Gold Card');
update credit_card_welcome_bonuses set baseline_bonus_amount = 100000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'American Express Business Gold Card');
update credit_card_welcome_bonuses set baseline_bonus_amount = 200000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'The Business Platinum Card from American Express');
update credit_card_welcome_bonuses set baseline_bonus_amount = 30000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Breeze Easy Visa Signature Card');
update credit_card_welcome_bonuses set baseline_bonus_amount = 80000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Atmos Rewards Summit Visa Infinite');

-- Not elevated: clear the flag and record the normal offer (= current).
update credit_card_welcome_bonuses set is_elevated = false, baseline_bonus_amount = 50000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Air France KLM Visa Signature Card');
update credit_card_welcome_bonuses set is_elevated = false, baseline_bonus_amount = 80000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Atmos Rewards Visa Signature Business');
update credit_card_welcome_bonuses set is_elevated = false, baseline_bonus_amount = 50000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Bilt Palladium Card');
update credit_card_welcome_bonuses set is_elevated = false, baseline_bonus_amount = 50000, updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Atmos Rewards Ascent Visa Signature');
