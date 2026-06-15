-- Citi consumer ThankYou lineup overhaul (verified vs official citi.com, 2026-06-15):
--  - Citi Rewards+ DISCONTINUED (closed Apr 2025, ended Jul 20 2025), replaced by
--    the new no-annual-fee Citi Strata Card -> mark defunct, create + author Strata.
--  - Citi Custom Cash CLOSED to new applicants 2026-05-28 -> mark closed.
--  - Citi Double Cash still open -> author.
-- ThankYou currency = a7bfc382-03aa-4f39-a8c1-c73cff6b304a; issuer citi = 5f362b4e-ed96-48d7-84ab-7dcdfcf70dff.
-- ASCII-only. No hardcoded transfer-partner counts in prose. FX fees (3%) flagged for T&C verification.

-- ============================================================
-- 0) Retire the two discontinued cards
-- ============================================================
update credit_cards set
  closed_to_new_applicants = true, status = 'closed_to_new_apps',
  notes = trim(coalesce(notes,'') || ' Citi closed the Custom Cash to new applicants on 2026-05-28 (directs cash-back seekers to Double Cash). Existing cardmembers keep the card.'),
  updated_at = now()
where slug = 'citi-custom-cash';

update credit_cards set
  closed_to_new_applicants = true, status = 'defunct',
  notes = trim(coalesce(notes,'') || ' Citi Rewards+ was discontinued (closed to new apps Apr 2025, fully ended 2025-07-20); existing cardholders were transitioned to the new Citi Strata Card. Replaced by citi-strata.'),
  updated_at = now()
where slug = 'citi-rewards-plus';

-- ============================================================
-- 1) Citi Double Cash (open)  $0
-- ============================================================
update credit_cards set
  name = 'Citi Double Cash Card',
  annual_fee_usd = 0, card_type = 'personal', card_tier = 'starter', network = 'mastercard',
  foreign_transaction_fee_pct = 3, credit_score_recommended = 'good',
  points_transferable_to_partners = false, transfer_eligibility = 'pool_to_unlock',
  official_url = 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
  intro = 'The Citi Double Cash is the set-it-and-forget-it flat-rate workhorse: 2% on everything (1% when you buy, 1% when you pay), earned as ThankYou points, with no categories and no annual fee. On its own it''s effectively a cash-back card - but pair it with a Citi Strata Premier or Strata Elite and those points become transferable to Citi''s airline and hotel partners, which is where the real value unlocks. You also get 5% back on hotels, cars, and attractions booked through Citi Travel. Watch the 3% foreign transaction fee - keep it home for overseas spend.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, status = 'active', updated_at = now()
where slug = 'citi-double-cash';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='citi-double-cash');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='citi-double-cash'), 'travel', 5.00, null, null, 'portal', '5% (as ThankYou points) on hotels, car rentals, and attractions booked through Citi Travel - the 3% bonus on top of the standard 2%.'),
((select id from credit_cards where slug='citi-double-cash'), 'base', 2.00, null, null, 'any', '2% on every purchase - 1% when you buy plus 1% as you pay - earned as ThankYou points.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='citi-double-cash');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='citi-double-cash'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer Partners (Pool-to-Unlock)', null, null, 'perk', null, 'On its own, points redeem for cash back. If you also hold a Citi Strata Premier or Strata Elite, you can move these ThankYou points there and transfer them 1:1 to Citi''s airline and hotel partners.', 1),
((select id from credit_cards where slug='citi-double-cash'), 'other', 'other', 'No Annual Fee', null, null, 'perk', null, 'No annual fee, no categories to track, and no cap on cash back earned.', 2),
((select id from credit_cards where slug='citi-double-cash'), 'protection', 'other', 'Mastercard ID Theft Protection', null, null, 'protection', null, 'Free identity-theft monitoring and alerts through Mastercard (enrollment required).', 3);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='citi-double-cash');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='citi-double-cash'), 20000, 'ThankYou Points', 1500, 6, '[]'::jsonb, false, true,
  'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
  '$200 cash back (20,000 ThankYou points) after $1,500 in purchases in the first 6 months.', current_date, now());

-- ============================================================
-- 2) Citi Strata Card (new $0) - create row, replaces Rewards+
-- ============================================================
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  currency_program_id, annual_fee_usd, foreign_transaction_fee_pct, credit_score_recommended,
  points_transferable_to_partners, transfer_eligibility, official_url, is_active,
  closed_to_new_applicants, status, last_verified, intro)
values
('citi-strata', '5f362b4e-ed96-48d7-84ab-7dcdfcf70dff', 'Citi Strata Card', 'personal', 'mid', 'mastercard',
  'a7bfc382-03aa-4f39-a8c1-c73cff6b304a', 0, 3, 'good', true, 'direct',
  'https://www.citi.com/credit-cards/citi-strata-credit-card', true, false, 'active', current_date,
  'The Citi Strata is the no-annual-fee ThankYou card that replaced Citi Rewards+ in 2025, with a broader, richer earn structure: 5X on travel booked through Citi Travel, 3X at supermarkets, 3X on transit, gas, and EV charging, 3X on a self-select category you pick (from fitness clubs, select streaming, live entertainment, salons, or pet stores), and 2X at restaurants. Unlike its cash-back siblings, the Strata transfers ThankYou points to Citi''s airline and hotel partners on its own - no premium card required. Add a 0% intro APR for 15 months and World Elite Mastercard perks, and it''s a strong free everyday-earner. Note the 3% foreign transaction fee.');

insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='citi-strata'), 'travel', 5.00, null, null, 'portal', '5X on hotels, car rentals, and attractions booked through Citi Travel.'),
((select id from credit_cards where slug='citi-strata'), 'groceries', 3.00, null, null, 'any', '3X at supermarkets.'),
((select id from credit_cards where slug='citi-strata'), 'transit', 3.00, null, null, 'any', '3X on select transit, gas stations, and EV charging.'),
((select id from credit_cards where slug='citi-strata'), 'self_select', 3.00, null, null, 'any', '3X on one self-select category of your choice: fitness clubs, select streaming, live entertainment, cosmetic stores/barbers/salons, or pet supply stores.'),
((select id from credit_cards where slug='citi-strata'), 'dining', 2.00, null, null, 'any', '2X at restaurants.'),
((select id from credit_cards where slug='citi-strata'), 'base', 1.00, null, null, 'any', '1X on all other purchases.');

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='citi-strata'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer ThankYou points 1:1 to Citi''s airline and hotel partners (no fee, 1,000-point minimum) - no premium Citi card required.', 1),
((select id from credit_cards where slug='citi-strata'), 'other', 'other', '0% Intro APR for 15 Months', null, null, 'perk', null, '0% intro APR on purchases and balance transfers for 15 months, then a variable 18.49%-28.49% APR.', 2),
((select id from credit_cards where slug='citi-strata'), 'other', 'other', 'Self-Select 3X Category', null, null, 'perk', null, 'Pick one 3X category: fitness clubs, select streaming, live entertainment, salons/barbers/cosmetic stores, or pet supply stores.', 3),
((select id from credit_cards where slug='citi-strata'), 'protection', 'other', 'World Elite Mastercard Benefits', null, null, 'perk', null, 'World Elite Mastercard concierge, cellphone protection, and partner offers (see Guide to Benefits).', 4),
((select id from credit_cards where slug='citi-strata'), 'other', 'other', 'No Annual Fee', null, null, 'perk', null, 'No annual fee.', 5);

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='citi-strata'), 20000, 'ThankYou Points', 1000, 3, '[]'::jsonb, false, true,
  'https://www.citi.com/credit-cards/citi-strata-credit-card',
  'Earn 20,000 bonus ThankYou points after $1,000 in purchases in the first 3 months.', current_date, now());

-- ============================================================
-- 3) Classification: mark the two authored cards as manually saved
-- ============================================================
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('citi-double-cash','citi-strata');
