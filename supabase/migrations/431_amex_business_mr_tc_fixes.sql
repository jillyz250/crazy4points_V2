-- Corrections for the Amex business MR trio after verifying against the full
-- official benefit pages + Reward Rules (pasted 2026-06-15). ASCII-only.

-- ============================================================
-- BLUE BUSINESS PLUS: add protection suite
-- ============================================================
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-blue-business-plus'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss and Damage Insurance', null, null, 'insurance', null, 'Secondary coverage for damage or theft of a rental vehicle when you pay with the Card and decline the counter CDW (not available in AU, IT, NZ).', 4),
((select id from credit_cards where slug='amex-blue-business-plus'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', null, null, 'insurance', null, '24/7 emergency medical, legal, and coordination assistance when traveling more than 100 miles from home (you pay third-party service costs).', 5),
((select id from credit_cards where slug='amex-blue-business-plus'), 'protection', 'purchase_protection', 'Purchase Protection', 1000, 'USD', 'protection', null, 'Covers eligible purchases against theft or accidental damage for up to 90 days, up to $1,000 per purchase and $50,000 per year.', 6),
((select id from credit_cards where slug='amex-blue-business-plus'), 'protection', 'extended_warranty', 'Extended Warranty', null, null, 'protection', null, 'Adds up to one extra year to eligible original manufacturer warranties of 5 years or less.', 7);

-- ============================================================
-- BUSINESS GOLD: add 3X travel earn, new credits, protections, employee fee
-- ============================================================
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-business-gold'), 'travel', 3.00, null, null, '3X on flights and prepaid hotels booked on AmexTravel.com.');

update credit_cards set
  authorized_user_fee_usd = 95,
  authorized_user_fee_structure = '$95 per rewards-earning Employee Card; no-fee Employee Business Expense Cards also available (up to 99 total).',
  last_verified = current_date, updated_at = now()
where slug = 'amex-business-gold';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-business-gold'), 'statement_credit', 'other', '$300 ChatGPT Business Credit', 300, 'USD', 'credit', 'annual', 'Up to $300 per calendar year in statement credits on U.S. purchases of ChatGPT Business made directly with OpenAI. Enrollment required.', 6),
((select id from credit_cards where slug='amex-business-gold'), 'statement_credit', 'other', '$150 Squarespace Credit', 150, 'USD', 'credit', 'annual', 'Up to $150 per calendar year in statement credits on U.S. purchases made directly with Squarespace. Enrollment required.', 7),
((select id from credit_cards where slug='amex-business-gold'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 300, 'USD', 'insurance', 'per_trip', 'Up to $300 per trip when a round trip paid with the Card is delayed more than 12 hours (max 2 claims per 12 months).', 8),
((select id from credit_cards where slug='amex-business-gold'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 1250, 'USD', 'insurance', null, 'Coverage for lost, damaged, or stolen baggage: up to $1,250 carry-on and up to $500 checked, in excess of the carrier''s coverage.', 9),
((select id from credit_cards where slug='amex-business-gold'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss and Damage Insurance', null, null, 'insurance', null, 'Secondary coverage for damage or theft of a rental vehicle when you pay with the Card and decline the counter CDW.', 10),
((select id from credit_cards where slug='amex-business-gold'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', null, null, 'insurance', null, '24/7 emergency medical, legal, and coordination assistance when traveling more than 100 miles from home.', 11),
((select id from credit_cards where slug='amex-business-gold'), 'protection', 'purchase_protection', 'Purchase Protection', 1000, 'USD', 'protection', null, 'Covers eligible purchases against theft or accidental damage for up to 90 days, up to $1,000 per purchase and $50,000 per year.', 12),
((select id from credit_cards where slug='amex-business-gold'), 'protection', 'extended_warranty', 'Extended Warranty', null, null, 'protection', null, 'Adds up to one extra year to eligible original manufacturer warranties of 5 years or less.', 13);

-- ============================================================
-- BUSINESS PLATINUM: fix welcome (300k), add credits/perks/protections, employee fee
-- ============================================================
update credit_card_welcome_bonuses w set
  bonus_amount = 300000,
  notes = 'Welcome offer is targeted and varies by applicant; American Express shows "as high as 300,000" Membership Rewards points after $20,000 in eligible purchases in the first 3 months. Many applicants see a lower targeted amount.',
  last_verified = current_date, verified_at = now()
from credit_cards c
where c.id=w.card_id and c.slug='amex-business-platinum';

update credit_card_earn_rates e set
  notes = '2X on key business categories (U.S. construction & hardware suppliers, U.S. electronics/software & cloud, U.S. shipping) or any single purchase of $5,000 or more, on up to $2 million per calendar year.'
from credit_cards c
where c.id=e.card_id and c.slug='amex-business-platinum' and e.category='business_purchases';

update credit_cards set
  authorized_user_fee_usd = 400,
  authorized_user_fee_structure = '$400 per Employee Business Platinum Card; no-fee Employee Business Expense Cards also available (up to 99 total).',
  last_verified = current_date, updated_at = now()
where slug = 'amex-business-platinum';

-- enrich Delta Sky Club note (unlimited at $75k spend)
update credit_card_benefits b set
  description = '10 complimentary Delta Sky Club visits per year when flying on an eligible Delta flight; unlimited access for the rest of the year after $75,000 in purchases on the account in a calendar year.'
from credit_cards c
where c.id=b.card_id and c.slug='amex-business-platinum' and b.name='Delta Sky Club Access';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'other', '$300 ChatGPT Business Credit', 300, 'USD', 'credit', 'annual', 'Up to $300 per calendar year in statement credits on U.S. purchases of ChatGPT Business made directly with OpenAI. Enrollment required.', 24),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'wireless_credit', '$120 Wireless Credit', 120, 'USD', 'credit', 'monthly', 'Up to $10 in monthly statement credits for wireless phone service purchased directly from a U.S. wireless provider. Enrollment required.', 25),
((select id from credit_cards where slug='amex-business-platinum'), 'spend_unlock', 'spend_unlock_perk', '$2,400 One AP Credit (at $250k spend)', 2400, 'USD', 'earning', 'annual', 'After spending $250,000 in a calendar year, unlock up to $2,400 in statement credits the following year toward American Express One AP monthly fees.', 26),
((select id from credit_cards where slug='amex-business-platinum'), 'spend_unlock', 'spend_unlock_perk', '$1,200 Amex Travel Flight Credit (at $250k spend)', 1200, 'USD', 'earning', 'annual', 'After spending $250,000 in a calendar year, unlock up to $1,200 in statement credits the following year on flights booked at AmexTravel.com.', 27),
((select id from credit_cards where slug='amex-business-platinum'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 800, 'USD', 'protection', null, 'Up to $800 per claim ($50 deductible, 2 claims/12 months) for damage or theft when your line is on a wireless bill paid with the Card.', 28),
((select id from credit_cards where slug='amex-business-platinum'), 'insurance', 'travel_emergency_assistance', 'Premium Global Assist Hotline', null, null, 'insurance', null, '24/7 medical, legal, financial, and emergency coordination when traveling more than 100 miles from home; emergency medical transportation may be covered if coordinated by the hotline.', 29),
((select id from credit_cards where slug='amex-business-platinum'), 'protection', 'return_protection', 'Return Protection', null, null, 'protection', null, 'Refund eligible purchases a merchant won''t take back, within the coverage window (see Guide to Benefits).', 30),
((select id from credit_cards where slug='amex-business-platinum'), 'other', 'concierge', 'Platinum Concierge', null, null, 'perk', null, '24/7 concierge for tickets, dining reservations, travel inquiries, and shopping requests.', 31);
