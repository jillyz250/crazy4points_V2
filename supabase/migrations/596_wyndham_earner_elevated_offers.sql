-- Capture the June 17 2026 Wyndham Earner card refresh as a proper archive-on-change:
-- archive each card's prior (flat) offer with a window_end, and insert the new TIERED
-- limited-time offer as current with a window_start. Mirrors saveExtractedBenefits.
-- Offers verified 2026-06-18 via Firecrawl (Barclays per-card pages confirm "up to 100,000"
-- for Plus/Business) + FrequentMiler refresh detail (base + $500-at-Wyndham bonus tier).
--   Earner          base 30,000 / $1,000 / 3mo  +  45,000 after $500 at Wyndham / 180d  = up to 75,000
--   Earner Plus     base 45,000 / $1,000 / 3mo  +  55,000 after $500 at Wyndham / 180d  = up to 100,000
--   Earner Business base 45,000 / $3,000 / 3mo  +  55,000 after $500 at Wyndham / 180d  = up to 100,000
-- baseline = the prior flat offer (so each shows as a real elevation old -> new).

-- ── Earner ──────────────────────────────────────────────────────────────────
update credit_card_welcome_bonuses set is_current = false, window_end = current_date, updated_at = now()
  where id = '53b78f74-0162-4ea4-875a-c1811ddb2b17';
insert into credit_card_welcome_bonuses
  (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses,
   baseline_bonus_amount, is_elevated, is_current, is_historical_high, window_start, source_url, verified_at, last_verified, created_at, updated_at)
select card_id, 30000, 'points', 1000, 3,
  '[{"bonus_amount":45000,"spend_usd":500,"timeline_months":6,"note":"additional 45,000 after spending $500 at Hotels by Wyndham within the first 180 days"}]'::jsonb,
  30000, true, true, false, current_date,
  'https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-card', now(), current_date, now(), now()
from credit_card_welcome_bonuses where id = '53b78f74-0162-4ea4-875a-c1811ddb2b17';

-- ── Earner Plus ─────────────────────────────────────────────────────────────
update credit_card_welcome_bonuses set is_current = false, window_end = current_date, updated_at = now()
  where id = 'cff3e0c3-effb-4bcf-a3cc-37c3be8fd19d';
insert into credit_card_welcome_bonuses
  (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses,
   baseline_bonus_amount, is_elevated, is_current, is_historical_high, window_start, source_url, verified_at, last_verified, created_at, updated_at)
select card_id, 45000, 'points', 1000, 3,
  '[{"bonus_amount":55000,"spend_usd":500,"timeline_months":6,"note":"additional 55,000 after spending $500 at Hotels by Wyndham within the first 180 days"}]'::jsonb,
  45000, true, true, false, current_date,
  'https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-plus-card', now(), current_date, now(), now()
from credit_card_welcome_bonuses where id = 'cff3e0c3-effb-4bcf-a3cc-37c3be8fd19d';

-- ── Earner Business ─────────────────────────────────────────────────────────
update credit_card_welcome_bonuses set is_current = false, window_end = current_date, updated_at = now()
  where id = '1e22a8d1-8303-4e9e-9d09-1cd5f0f4934e';
insert into credit_card_welcome_bonuses
  (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses,
   baseline_bonus_amount, is_elevated, is_current, is_historical_high, window_start, source_url, verified_at, last_verified, created_at, updated_at)
select card_id, 45000, 'points', 3000, 3,
  '[{"bonus_amount":55000,"spend_usd":500,"timeline_months":6,"note":"additional 55,000 after spending $500 at Hotels by Wyndham within the first 180 days"}]'::jsonb,
  45000, true, true, false, current_date,
  'https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-business-card', now(), current_date, now(), now()
from credit_card_welcome_bonuses where id = '1e22a8d1-8303-4e9e-9d09-1cd5f0f4934e';
