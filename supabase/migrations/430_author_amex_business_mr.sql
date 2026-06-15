-- Author the three unauthored Amex business Membership Rewards cards from official
-- issuer pages (americanexpress.com business card pages, scraped 2026-06-15).
-- ASCII-only. No hardcoded MR partner counts in prose.
-- Protection suites confirmed on the Business Platinum page; Gold/BBP full
-- protection suites to be verified against pasted T&Cs.

-- ============================================================
-- 1) Blue Business Plus  (amex-blue-business-plus)  $0
--    NOTE: this card DOES charge a foreign transaction fee (2.7%).
-- ============================================================
update credit_cards set
  name = 'The Blue Business Plus Credit Card from American Express',
  annual_fee_usd = 0,
  card_type = 'business',
  card_tier = 'business',
  network = 'amex',
  foreign_transaction_fee_pct = 2.7,
  credit_score_recommended = 'good',
  points_transferable_to_partners = true,
  transfer_eligibility = 'direct',
  no_preset_spending_limit = false,
  is_metal_card = false,
  official_url = 'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-blue-business-plus-credit-card-amex/',
  intro = 'The Blue Business Plus is the no-annual-fee workhorse of the Membership Rewards world: a flat 2X points on the first $50,000 of purchases each year (then 1X), with no categories to track. Pair it with a premium MR card and those points transfer to Amex''s airline and hotel partners. It also runs a 0% intro APR on purchases for the first 12 months and Amex''s Expanded Buying Power, which lets you spend above your credit limit when you''ve earned the room. One catch: unlike most travel cards here, it does charge a foreign transaction fee, so keep it home for overseas spend.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, updated_at = now()
where slug = 'amex-blue-business-plus';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='amex-blue-business-plus');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-blue-business-plus'), 'everything_else', 2.00, 50000, 'annual', '2X Membership Rewards points on all eligible purchases, on the first $50,000 per calendar year.'),
((select id from credit_cards where slug='amex-blue-business-plus'), 'base', 1.00, null, null, '1X on all purchases after the $50,000 annual cap.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='amex-blue-business-plus');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-blue-business-plus'), 'other', 'other', '0% Intro APR for 12 Months', null, null, 'perk', null, '0% introductory APR on purchases for 12 months from account opening, then a variable rate applies.', 1),
((select id from credit_cards where slug='amex-blue-business-plus'), 'other', 'other', 'Expanded Buying Power', null, null, 'perk', null, 'Spend above your credit limit when needed; the flexible amount adapts to your payment and credit history.', 2),
((select id from credit_cards where slug='amex-blue-business-plus'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Membership Rewards points to Amex airline and hotel transfer partners.', 3);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='amex-blue-business-plus');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='amex-blue-business-plus'), 15000, 'Membership Rewards points', 3000, 3, '[]'::jsonb, false, true,
  'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-blue-business-plus-credit-card-amex/',
  'Earn 15,000 Membership Rewards points after $3,000 in purchases in the first 3 months.', current_date, now());

-- ============================================================
-- 2) Business Gold  (amex-business-gold)  $375
-- ============================================================
update credit_cards set
  name = 'American Express Business Gold Card',
  annual_fee_usd = 375,
  card_type = 'business',
  card_tier = 'business',
  network = 'amex',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'excellent',
  points_transferable_to_partners = true,
  transfer_eligibility = 'direct',
  no_preset_spending_limit = true,
  is_metal_card = true,
  official_url = 'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-gold-card-amex/',
  intro = 'The American Express Business Gold Card flexes to your spending: it pays 4X Membership Rewards points automatically on your top 2 spending categories each billing cycle - chosen from six (U.S. advertising, electronics/software & cloud, restaurants, gas, transit, and U.S. wireless) - on up to $150,000 of combined purchases a year, then 1X. At $375 it offsets the fee with a $240 annual flexible business credit (FedEx, Grubhub, office supply stores), a monthly Walmart+ credit, and no foreign transaction fees. Points transfer to Amex''s travel partners, where the real value lives. Best for businesses whose spend concentrates in a couple of those categories.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, updated_at = now()
where slug = 'amex-business-gold';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='amex-business-gold');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-business-gold'), 'top_categories', 4.00, 150000, 'annual', '4X on your top 2 eligible categories each billing cycle, from: U.S. advertising in select media, U.S. electronics/software & cloud, U.S. restaurants (incl. takeout & delivery), U.S. gas stations, transit, and monthly U.S. wireless. On up to $150,000 combined per calendar year, then 1X.'),
((select id from credit_cards where slug='amex-business-gold'), 'base', 1.00, null, null, '1X on all other eligible purchases.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='amex-business-gold');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-business-gold'), 'statement_credit', 'other', '$240 Flexible Business Credit', 240, 'USD', 'credit', 'monthly', 'Up to $20 in monthly statement credits for eligible U.S. purchases at FedEx (through 10/01/2026), Grubhub, and office supply stores. Up to $240/year. Enrollment required.', 1),
((select id from credit_cards where slug='amex-business-gold'), 'statement_credit', 'walmart_credit', 'Walmart+ Monthly Credit', 155, 'USD', 'credit', 'monthly', 'Up to $12.95 plus tax in monthly statement credits to cover a Walmart+ membership (about $155/year).', 2),
((select id from credit_cards where slug='amex-business-gold'), 'travel_credit', 'hotel_credit', 'The Hotel Collection Credit', 100, 'USD', 'hotel', 'per_trip', '$100 credit toward eligible charges on a 2-night minimum stay booked through The Hotel Collection on AmexTravel.com.', 3),
((select id from credit_cards where slug='amex-business-gold'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 800, 'USD', 'protection', null, 'Up to $800 per claim ($50 deductible, 2 claims/12 months) for damage or theft when you pay your prior month''s wireless bill with the Card.', 4),
((select id from credit_cards where slug='amex-business-gold'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Membership Rewards points to Amex airline and hotel transfer partners - the highest-value redemption.', 5);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='amex-business-gold');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='amex-business-gold'), 200000, 'Membership Rewards points', 15000, 3, '[]'::jsonb, true, true,
  'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-gold-card-amex/',
  'Welcome offers vary by applicant. Current public high is as much as 200,000 Membership Rewards points after $15,000 in purchases in the first 3 months; many applicants see a lower targeted offer.', current_date, now());

-- ============================================================
-- 3) Business Platinum  (amex-business-platinum)  $895
-- ============================================================
update credit_cards set
  name = 'The Business Platinum Card from American Express',
  annual_fee_usd = 895,
  card_type = 'business',
  card_tier = 'business',
  network = 'amex',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'excellent',
  points_transferable_to_partners = true,
  transfer_eligibility = 'direct',
  no_preset_spending_limit = true,
  is_metal_card = true,
  official_url = 'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-platinum-credit-card-amex/',
  intro = 'The Business Platinum Card is Amex''s maximalist business charge card: $895 a year buys the deepest lounge access in the game (Centurion Lounges, Priority Pass, and Delta Sky Club visits), 5X on flights and prepaid hotels through Amex Travel, and 2X on big-ticket business purchases ($5,000+) and key categories up to $2 million a year. The fee is meant to be clawed back through a sprawl of credits - hotel, airline, Dell, Adobe, Indeed, CLEAR, Hilton - that reward businesses willing to do the enrollment legwork. You also get Marriott and Hilton Gold status, a Global Entry credit, and a 35% Pay-with-Points airline rebate. Points transfer to Amex''s partners. Overkill for light spenders; outstanding for travel-heavy businesses that use the credits.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, updated_at = now()
where slug = 'amex-business-platinum';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='amex-business-platinum');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='amex-business-platinum'), 'flights', 5.00, null, null, '5X on flights booked on AmexTravel.com.'),
((select id from credit_cards where slug='amex-business-platinum'), 'hotels', 5.00, null, null, '5X on prepaid hotels booked on AmexTravel.com.'),
((select id from credit_cards where slug='amex-business-platinum'), 'business_purchases', 2.00, 2000000, 'annual', '2X on eligible purchases in key business categories and on single purchases of $5,000 or more, on up to $2 million per calendar year.'),
((select id from credit_cards where slug='amex-business-platinum'), 'base', 1.00, null, null, '1X on all other eligible purchases.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='amex-business-platinum');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='amex-business-platinum'), 'travel_credit', 'hotel_credit', '$600 Hotel Credit', 600, 'USD', 'hotel', 'semiannual', 'Up to $300 in statement credits semi-annually on prepaid Fine Hotels + Resorts or The Hotel Collection bookings through Amex Travel.', 1),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'hotel_credit', '$200 Hilton Credit', 200, 'USD', 'hotel', 'quarterly', 'Up to $50 in quarterly statement credits on eligible purchases made directly with Hilton (Hilton for Business enrollment required).', 2),
((select id from credit_cards where slug='amex-business-platinum'), 'travel_credit', 'airline_credit', '$200 Airline Fee Credit', 200, 'USD', 'airline', 'annual', 'Up to $200 per calendar year in statement credits for incidental fees with one selected qualifying airline.', 3),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'clear_credit', '$209 CLEAR Plus Credit', 209, 'USD', 'credit', 'annual', 'Up to $209 per calendar year toward an auto-renewing CLEAR Plus membership.', 4),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'other', '$1,150 Dell Technologies Credit', 1150, 'USD', 'credit', 'annual', '$150 in statement credits on U.S. Dell purchases plus an additional $1,000 after you spend $5,000 or more, per calendar year. Enrollment required.', 5),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'other', '$250 Adobe Credit', 250, 'USD', 'credit', 'annual', '$250 statement credit per calendar year after $600 or more in U.S. purchases directly with Adobe. Enrollment required.', 6),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'other', '$360 Indeed Credit', 360, 'USD', 'credit', 'quarterly', 'Up to $90 in quarterly statement credits for U.S. purchases made directly with Indeed. Enrollment required.', 7),
((select id from credit_cards where slug='amex-business-platinum'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', 'credit', null, '$120 statement credit for Global Entry or up to $85 for TSA PreCheck, once every 4 years.', 8),
((select id from credit_cards where slug='amex-business-platinum'), 'portal_redemption', 'portal_redemption_bonus', '35% Airline Pay-with-Points Bonus', null, null, 'perk', null, 'Get 35% of your points back when you use Pay with Points for flights with your selected qualifying airline through Amex Travel, up to 1,000,000 points back per calendar year.', 9),
((select id from credit_cards where slug='amex-business-platinum'), 'lounge_access', 'lounge_centurion', 'The Global Lounge Collection', null, null, 'lounge', null, 'Access to Centurion Lounges, Priority Pass Select membership (enrollment required), and other partner lounges worldwide.', 10),
((select id from credit_cards where slug='amex-business-platinum'), 'lounge_access', 'lounge_skyclub', 'Delta Sky Club Access', null, null, 'lounge', null, '10 complimentary Delta Sky Club visits per year when flying on an eligible Delta flight.', 11),
((select id from credit_cards where slug='amex-business-platinum'), 'status_conferred', 'status_marriott_gold', 'Marriott Bonvoy Gold Elite Status', null, null, 'status', null, 'Complimentary Marriott Bonvoy Gold Elite status with no stay requirement (enrollment required).', 12),
((select id from credit_cards where slug='amex-business-platinum'), 'status_conferred', 'status_hilton_gold', 'Hilton Honors Gold Status', null, null, 'status', null, 'Complimentary Hilton Honors Gold status (enrollment required).', 13),
((select id from credit_cards where slug='amex-business-platinum'), 'status_conferred', 'status_other', 'Leaders Club Sterling Status (LHW)', null, null, 'status', null, 'Complimentary Leaders Club Sterling status from The Leading Hotels of the World (enrollment required).', 14),
((select id from credit_cards where slug='amex-business-platinum'), 'status_conferred', 'status_other', 'Car Rental Elite Status (Avis, Hertz, National)', null, null, 'status', null, 'Complimentary premium status with Avis, Hertz, and National car rental programs (enrollment required).', 15),
((select id from credit_cards where slug='amex-business-platinum'), 'travel_credit', 'hotel_credit', 'The Hotel Collection Credit', 100, 'USD', 'hotel', 'per_trip', '$100 credit toward eligible charges on a 2-night minimum stay booked through The Hotel Collection on AmexTravel.com.', 16),
((select id from credit_cards where slug='amex-business-platinum'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 500, 'USD', 'insurance', 'per_trip', 'Up to $500 per trip in covered expenses when a round trip paid with the Card is delayed more than 6 hours (max 2 claims per 12 months).', 17),
((select id from credit_cards where slug='amex-business-platinum'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation and Interruption Insurance', 10000, 'USD', 'insurance', 'per_trip', 'Up to $10,000 per trip (and $20,000 per card per 12 months) for non-refundable expenses when a covered reason cancels or interrupts a round trip paid with the Card.', 18),
((select id from credit_cards where slug='amex-business-platinum'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 3000, 'USD', 'insurance', null, 'Coverage for lost, damaged, or stolen baggage: up to $2,000 checked and up to $3,000 combined checked and carry-on, in excess of the carrier''s coverage.', 19),
((select id from credit_cards where slug='amex-business-platinum'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss and Damage Insurance', null, null, 'insurance', null, 'Secondary coverage for damage or theft of a rental vehicle when you pay with the Card and decline the counter CDW.', 20),
((select id from credit_cards where slug='amex-business-platinum'), 'protection', 'purchase_protection', 'Purchase Protection', null, null, 'protection', null, 'Covers eligible purchases against accidental damage, theft, or loss for a limited period after purchase (see Guide to Benefits for limits).', 21),
((select id from credit_cards where slug='amex-business-platinum'), 'protection', 'extended_warranty', 'Extended Warranty', null, null, 'protection', null, 'Adds up to one extra year to eligible original manufacturer warranties of 5 years or less.', 22),
((select id from credit_cards where slug='amex-business-platinum'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Membership Rewards points to Amex airline and hotel transfer partners.', 23);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='amex-business-platinum');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='amex-business-platinum'), 150000, 'Membership Rewards points', 20000, 3, '[]'::jsonb, true, true,
  'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-platinum-credit-card-amex/',
  'Welcome offer is targeted and varies by applicant; American Express does not publish a fixed amount on the application page (shown as "apply and find out"). Spend requirement is $20,000 in 3 months. 150,000 reflects a commonly-run public offer - verify the live offer at application.', current_date, now());

-- Classification: mark all three as manually saved
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('amex-blue-business-plus','amex-business-gold','amex-business-platinum');
