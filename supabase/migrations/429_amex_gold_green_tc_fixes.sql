-- Corrections + protection suites for Amex Gold and Green after verifying against
-- the full official benefit pages + Reward Rules (pasted 2026-06-15). ASCII-only.

-- ============================================================
-- GOLD
-- ============================================================
-- (1) Earn fix: prepaid hotels earn 5X (not 2X). The 2X tier is only prepaid
--     car rentals + cruises booked through AmexTravel.
update credit_card_earn_rates e set
  notes = '2X on prepaid car rentals booked through AmexTravel.com or the Amex Travel App, and on cruises booked and paid through AmexTravel.com.'
from credit_cards c
where c.id=e.card_id and c.slug='amex-gold' and e.category='travel' and e.multiplier=2.00;

insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-gold'), 'hotels', 5.00, null, null, '5X on prepaid hotels booked through AmexTravel.com or the Amex Travel App.');

-- (2) Card-level: No Preset Spending Limit + additional-card fee.
update credit_cards set
  no_preset_spending_limit = true,
  authorized_user_fee_usd = 35,
  authorized_user_fee_structure = 'First 5 additional cards $0; $35 each for the 6th or more.',
  last_verified = current_date,
  updated_at = now()
where slug = 'amex-gold';

-- (3) Protection suite (verified on the official page).
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-gold'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 300, 'USD', 'insurance', 'per_trip', 'Up to $300 per trip in covered expenses when a round trip paid with the Card is delayed more than 12 hours (max 2 claims per 12 months). Secondary coverage.', 8),
((select id from credit_cards where slug='amex-gold'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 1250, 'USD', 'insurance', null, 'Coverage for lost, damaged, or stolen baggage on a common-carrier ticket: up to $1,250 carry-on and up to $500 checked, in excess of the carrier''s coverage.', 9),
((select id from credit_cards where slug='amex-gold'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss and Damage Insurance', null, null, 'insurance', null, 'Secondary coverage for damage or theft of a rental vehicle when you pay with the Card and decline the counter CDW (not available in AU, IT, NZ).', 10),
((select id from credit_cards where slug='amex-gold'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', null, null, 'insurance', null, '24/7 emergency medical, legal, and coordination assistance when traveling more than 100 miles from home (you pay third-party service costs).', 11),
((select id from credit_cards where slug='amex-gold'), 'protection', 'purchase_protection', 'Purchase Protection', 10000, 'USD', 'protection', null, 'Covers eligible purchases against accidental damage, theft, or loss for up to 90 days, up to $10,000 per purchase and $50,000 per year.', 12),
((select id from credit_cards where slug='amex-gold'), 'protection', 'extended_warranty', 'Extended Warranty', 10000, 'USD', 'protection', null, 'Adds up to one extra year to eligible original manufacturer warranties of 5 years or less, up to $10,000 per item and $50,000 per year.', 13);

-- ============================================================
-- GREEN
-- ============================================================
update credit_cards set
  no_preset_spending_limit = true,
  last_verified = current_date,
  updated_at = now()
where slug = 'amex-green';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-green'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 1250, 'USD', 'insurance', null, 'Coverage for lost, damaged, or stolen baggage on a common-carrier ticket: up to $1,250 carry-on and up to $500 checked, in excess of the carrier''s coverage.', 4),
((select id from credit_cards where slug='amex-green'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss and Damage Insurance', null, null, 'insurance', null, 'Secondary coverage for damage or theft of a rental vehicle when you pay with the Card and decline the counter CDW (not available in AU, IT, NZ).', 5),
((select id from credit_cards where slug='amex-green'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', null, null, 'insurance', null, '24/7 emergency medical, legal, and coordination assistance when traveling more than 100 miles from home (you pay third-party service costs).', 6),
((select id from credit_cards where slug='amex-green'), 'protection', 'purchase_protection', 'Purchase Protection', 1000, 'USD', 'protection', null, 'Covers eligible purchases against theft or accidental damage for up to 90 days, up to $1,000 per purchase and $50,000 per year.', 7),
((select id from credit_cards where slug='amex-green'), 'protection', 'extended_warranty', 'Extended Warranty', 10000, 'USD', 'protection', null, 'Adds up to one extra year to eligible original manufacturer warranties of 5 years or less, up to $10,000 per item and $50,000 per year.', 8);
