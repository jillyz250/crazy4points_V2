-- Chase Ink Business Preferred — manually-sourced benefits
-- Run AFTER migration 288 is applied (adds verified_at + verified_source_url).
--
-- Why this exists: the chase.com pages we scrape don't surface the insurance/
-- protection terms (they live in the Visa Sig Business Guide to Benefits PDF
-- that Firecrawl can't reach). We source them manually from current Chase
-- published guides + cross-checked spot-articles, then stamp verified_at +
-- verified_source_url so the stale-values audit report can flag them for
-- re-verification annually.
--
-- Editor verified: 2026-05-17

-- 1. Remove the low-confidence placeholders the extraction added.
delete from credit_card_benefits
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-preferred')
   and name in ('Travel & Purchase Coverage');

-- 2. Add the missing second DoorDash credit (the QUARTERLY non-restaurant one).
--    The page extraction merged this with the monthly grocery credit; in
--    reality these are TWO distinct credits.
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  value_amount, value_unit, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'statement_credit', 'doordash_credit',
  'DoorDash $10 Quarterly Non-Restaurant Credit',
  10, 'USD', 'quarterly',
  'Once per calendar quarter, get $10 off one qualifying non-restaurant DoorDash order. Applies to subtotal only (excludes fees, taxes, gratuity). Qualifying merchants include grocery (Wegmans, Sprouts, etc.), convenience stores (7-Eleven, Wawa), retail (PetSmart, Sephora), and liquor stores on DoorDash. Restaurants (including Shake Shack and Caviar) do NOT qualify. Must be enrolled in DashPass; any unused portion of the $10 is forfeited if not applied on a single order.',
  10,
  '{"qualifying_categories":["grocery","convenience","retail","liquor","flowers","beauty"],"excluded":["restaurants","caviar"],"requires_dashpass":true,"subtotal_only":true}'::jsonb,
  now(),
  'https://creditcards.chase.com/business-credit-cards/ink/business-preferred'
);

-- 3. Cell Phone Protection
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'protection', 'cellphone_protection', 'Cell Phone Protection',
  1000, 'per_trip',
  'Covers theft or damage to cell phones for the cardholder and employees listed on the monthly bill. Up to $1,000 per claim with a $100 deductible. Maximum 3 claims per 12-month period ($3,000 annual cap). Coverage requires paying the monthly cell phone bill with this card and starts the day after the bill is paid.',
  100,
  '{"deductible_usd":100,"max_claims_per_year":3,"annual_max_usd":3000,"requirement":"pay monthly phone bill with card","covers_employees":true}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/rewards-benefits/how-does-credit-card-cell-phone-protection-work'
);

-- 4. Trip Cancellation & Interruption Insurance
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'insurance', 'trip_cancellation_insurance', 'Trip Cancellation & Interruption Insurance',
  10000, 'per_trip',
  'Reimburses pre-paid, non-refundable travel expenses (passenger fares, tours, hotels) up to $5,000 per covered traveler and $10,000 per trip if your trip is canceled or cut short due to sickness, severe weather, or other covered situations. The trip fare must be charged to the card.',
  101,
  '{"per_traveler_usd":5000,"per_trip_usd":10000,"requires_fare_on_card":true}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 5. Auto Rental Collision Damage Waiver (PRIMARY for business rentals)
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'insurance', 'rental_car_cdw_primary', 'Auto Rental Collision Damage Waiver',
  60000, 'per_trip',
  'Primary coverage when renting a car for business purposes. Reimburses up to $60,000 for theft and collision damage on most rental vehicles with MSRP of $125,000 or less. Decline the rental company''s CDW and charge the entire rental to this card.',
  102,
  '{"primary_or_secondary":"primary","business_purpose":true,"msrp_cap_usd":125000}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 6. Purchase Protection
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'protection', 'purchase_protection', 'Purchase Protection',
  10000, 'per_trip',
  'Covers eligible new purchases for 120 days from the date of purchase against damage or theft. Up to $10,000 per claim and $50,000 per cardholder per year.',
  103,
  '{"days_covered":120,"per_claim_usd":10000,"annual_max_usd":50000}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 7. Extended Warranty Protection
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'protection', 'extended_warranty', 'Extended Warranty Protection',
  10000, 'per_trip',
  'Extends the manufacturer''s U.S. warranty by an additional year on eligible warranties of three years or less, up to four years total from the date of purchase. Up to $10,000 per claim and $50,000 per year.',
  104,
  '{"max_extension_years":1,"eligible_warranty_max_years":3,"per_claim_usd":10000,"annual_max_usd":50000}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 8. Baggage Delay Insurance
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'insurance', 'baggage_delay_insurance', 'Baggage Delay Insurance',
  500, 'per_trip',
  'Reimburses up to $100 per day for essential personal items when checked baggage is delayed by 6+ hours by the common carrier. Covers up to 5 days ($500 max per trip). Must charge the fare to the card.',
  105,
  '{"delay_threshold_hours":6,"per_day_usd":100,"max_days":5,"max_per_trip_usd":500,"requires_fare_on_card":true}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 9. Lost Luggage Reimbursement
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'insurance', 'lost_luggage_insurance', 'Lost Luggage Reimbursement',
  3000, 'per_trip',
  'Reimburses up to $3,000 per passenger for the contents of checked or carry-on baggage lost or damaged by the common carrier. Must charge the fare to the card.',
  106,
  '{"per_passenger_usd":3000,"requires_fare_on_card":true}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);

-- 10. Travel Accident Insurance
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  coverage_amount, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'insurance', 'travel_accident_insurance', 'Travel Accident Insurance',
  500000, 'per_trip',
  'Accidental Death & Dismemberment coverage when traveling on a common carrier (airline, train, ship, bus, etc.) with the fare charged to this card. Up to $500,000 in coverage.',
  107,
  '{"coverage_type":"AD&D","common_carrier_required":true,"requires_fare_on_card":true}'::jsonb,
  now(),
  'https://www.chase.com/personal/credit-cards/education/chase-cards/guide-to-chase-ink-business-preferred-benefits'
);
