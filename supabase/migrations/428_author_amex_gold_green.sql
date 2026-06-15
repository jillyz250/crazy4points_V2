-- Author the two unauthored personal Membership Rewards flagships, Amex Gold and
-- Amex Green, from official issuer pages (americanexpress.com card pages +
-- rewards/credits sections, scraped 2026-06-15). Personal Platinum already authored.
-- ASCII-only. No hardcoded MR partner counts in prose (the Transfer-partners
-- section renders the live count).

-- ============================================================
-- 1) American Express Gold Card  (amex-gold)  $325
-- ============================================================
update credit_cards set
  name = 'American Express Gold Card',
  annual_fee_usd = 325,
  card_type = 'personal',
  card_tier = 'premium',
  network = 'amex',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'excellent',
  points_transferable_to_partners = true,
  transfer_eligibility = 'direct',
  is_metal_card = true,
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  intro = 'The American Express Gold Card is a foodie''s rewards engine: 4X Membership Rewards points at restaurants worldwide and at U.S. supermarkets (each up to an annual cap), plus 3X on flights. At $325 a year it leans hard on monthly credits to earn its keep - dining credits, Uber Cash, Dunkin credits, and a twice-yearly Resy credit - so the math works best if those merchants are already in your routine. Points transfer to Amex''s airline and hotel partners, which is where the real outsized value lives. No foreign transaction fees. Treat the credits as use-it-or-lose-it: skip them and the fee bites; use them and the card more than pays for itself.',
  last_verified = current_date,
  is_active = true,
  closed_to_new_applicants = false,
  updated_at = now()
where slug = 'amex-gold';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='amex-gold');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-gold'), 'dining', 4.00, 50000, 'annual', '4X Membership Rewards points at restaurants worldwide, including takeout and delivery in the U.S., on up to $50,000 in purchases per calendar year (then 1X).'),
((select id from credit_cards where slug='amex-gold'), 'groceries', 4.00, 25000, 'annual', '4X at U.S. supermarkets on up to $25,000 in purchases per calendar year (then 1X).'),
((select id from credit_cards where slug='amex-gold'), 'flights', 3.00, null, null, '3X on flights booked directly with airlines or on AmexTravel.com.'),
((select id from credit_cards where slug='amex-gold'), 'travel', 2.00, null, null, '2X on prepaid hotels, car rentals, and other eligible travel booked on AmexTravel.com, plus cruises.'),
((select id from credit_cards where slug='amex-gold'), 'base', 1.00, null, null, '1X on all other eligible purchases.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='amex-gold');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-gold'), 'statement_credit', 'dining_credit', '$120 Dining Credit', 120, 'USD', 'credit', 'monthly', 'Up to $10 in statement credits each month at Grubhub (incl. Seamless), Buffalo Wild Wings, Five Guys, The Cheesecake Factory, and Wonder. Up to $120/year. Enrollment required.', 1),
((select id from credit_cards where slug='amex-gold'), 'statement_credit', 'uber_credit', '$120 Uber Cash', 120, 'USD', 'credit', 'monthly', '$10 in Uber Cash each month for U.S. Uber rides and Uber Eats orders when the Gold Card is added to your Uber account.', 2),
((select id from credit_cards where slug='amex-gold'), 'statement_credit', 'dining_credit', '$100 Resy Credit', 100, 'USD', 'credit', 'semiannual', 'Up to $50 in statement credits Jan-Jun and up to $50 Jul-Dec at 10,000+ qualifying U.S. Resy restaurants. Enrollment required.', 3),
((select id from credit_cards where slug='amex-gold'), 'statement_credit', 'dining_credit', '$84 Dunkin Credit', 84, 'USD', 'credit', 'monthly', 'Up to $7 in statement credits each month at U.S. Dunkin locations. Enrollment required.', 4),
((select id from credit_cards where slug='amex-gold'), 'travel_credit', 'hotel_credit', 'The Hotel Collection Credit', 100, 'USD', 'hotel', 'per_trip', '$100 credit toward eligible charges on a 2-night minimum stay booked through The Hotel Collection on AmexTravel.com.', 5),
((select id from credit_cards where slug='amex-gold'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, 'status', null, 'Complimentary upgrade to Hertz Five Star status (enrollment required); earn 2X on prepaid car rentals via AmexTravel.com.', 6),
((select id from credit_cards where slug='amex-gold'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Membership Rewards points to Amex airline and hotel transfer partners - the highest-value way to use them.', 7);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='amex-gold');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='amex-gold'),
  100000, 'Membership Rewards points', 8000, 6,
  '[]'::jsonb, true, true,
  'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  'Welcome offers vary by applicant. Current public high is as much as 100,000 Membership Rewards points after $8,000 in purchases in the first 6 months; many applicants will see a lower targeted offer.',
  current_date, now());

-- ============================================================
-- 2) American Express Green Card  (amex-green)  $150
-- ============================================================
update credit_cards set
  name = 'American Express Green Card',
  annual_fee_usd = 150,
  card_type = 'personal',
  card_tier = 'mid',
  network = 'amex',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'excellent',
  points_transferable_to_partners = true,
  transfer_eligibility = 'direct',
  is_metal_card = true,
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/green/',
  intro = 'The American Express Green Card is the quiet workhorse of the Membership Rewards lineup: a flat 3X on travel (defined about as broadly as it gets - flights, hotels, vacation rentals, even third-party booking sites), 3X on transit (rideshare, trains, tolls, parking), and 3X at restaurants worldwide. At $150 a year its headline perk is an annual CLEAR Plus credit that nearly covers the fee on its own. There''s no lounge access or sprawling credit suite here - just clean, broad earning and the same valuable transfer partners as its pricier siblings. No foreign transaction fees. A strong everyday-travel card if you want MR-earning breadth without a premium price tag.',
  last_verified = current_date,
  is_active = true,
  closed_to_new_applicants = false,
  updated_at = now()
where slug = 'amex-green';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='amex-green');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-green'), 'travel', 3.00, null, null, '3X on eligible travel - airfare, hotels, car rentals, cruises, tours, campgrounds, vacation rentals, and third-party travel sites, plus bookings on AmexTravel.com.'),
((select id from credit_cards where slug='amex-green'), 'transit', 3.00, null, null, '3X on transit - trains, taxis, rideshare, ferries, tolls, parking, buses, and subways.'),
((select id from credit_cards where slug='amex-green'), 'dining', 3.00, null, null, '3X at restaurants worldwide, plus takeout and delivery in the U.S.'),
((select id from credit_cards where slug='amex-green'), 'base', 1.00, null, null, '1X on all other eligible purchases.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='amex-green');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-green'), 'statement_credit', 'clear_credit', 'CLEAR Plus Credit', 209, 'USD', 'credit', 'annual', 'Up to $209 in statement credits per calendar year toward a CLEAR Plus membership when you pay with the Card.', 1),
((select id from credit_cards where slug='amex-green'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 300, 'USD', 'insurance', 'per_trip', 'Up to $300 per trip in covered expenses when a round trip paid with the Card is delayed more than 12 hours (max 2 claims per 12 months).', 2),
((select id from credit_cards where slug='amex-green'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Membership Rewards points to Amex airline and hotel transfer partners - the same partner roster as the Gold and Platinum.', 3);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='amex-green');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='amex-green'),
  40000, 'Membership Rewards points', 3000, 6,
  '[]'::jsonb, false, true,
  'https://www.americanexpress.com/us/credit-cards/card/green/',
  'Earn 40,000 Membership Rewards points after $3,000 in eligible purchases in the first 6 months.',
  current_date, now());

-- ============================================================
-- 3) Classification: mark both as manually saved
-- ============================================================
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('amex-gold','amex-green');
