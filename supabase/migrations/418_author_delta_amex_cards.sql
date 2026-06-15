-- Author the 7-card Amex Delta SkyMiles family (4 personal + 3 business).
-- VERIFIED 2026-06-15 against official delta.com card pages:
--   personal: delta.com/us/en/skymiles/airline-credit-cards/american-express-personal-cards
--   business: delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards
-- All earn Delta SkyMiles (co-brand, transfer_eligibility='none'), charge no
-- foreign transaction fee, give 20% back on in-flight purchases, and currently
-- run LIMITED-TIME elevated welcome offers ending July 15, 2026 (noted on each SUB).

-- ============================================================================
-- CARD-LEVEL FIELDS
-- ============================================================================
update credit_cards set
  intro = 'The no-fee foot in the door for Delta loyalists. No free checked bag and no lounge access, but you earn 2X on Delta and dining and pay $0 a year - a clean way to bank SkyMiles and skip award-ticket cash fees if you fly Delta now and then.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/learnblue',
  good_to_know='SkyMiles never expire. Blue skips the checked-bag and priority-boarding perks - if you check bags on Delta even twice a year, the Gold''s free bag more than covers its fee.',
  updated_at=now()
where slug='amex-delta-blue';

update credit_cards set
  intro = 'The sweet spot of the Delta lineup for most flyers: free checked bags (worth about $70 a round trip for two), 2X on Delta, dining and U.S. supermarkets, and a $150 fee that''s waived the first year. The rideshare and Delta Stays credits plus a $200 flight credit after $10K spend can wipe out the fee if you fly Delta a few times a year.',
  annual_fee_usd = 150, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/learngold',
  good_to_know='$0 annual fee the first year, then $150. Free first AND second checked bag covers everyone on the reservation (up to 8). The $200 flight credit needs $10K of spend in a calendar year.',
  updated_at=now()
where slug='amex-delta-gold';

update credit_cards set
  intro = 'Delta''s mid-premium card, built around the annual Companion Certificate - one nearly-free Main Cabin ticket a year that can single-handedly justify the $350 fee. Add 3X on Delta, a stack of credits (rideshare, Delta Stays, Resy) worth up to $390, MQD Headstart and Boost toward Medallion status, and free checked bags.',
  annual_fee_usd = 350, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/learnplatinum',
  good_to_know='The Companion Certificate is the headline - a Main Cabin round trip for a companion (you pay only taxes/fees, $22-$250). The $2,500 MQD Headstart plus $1 MQD per $20 spent is a real leg up toward Medallion status.',
  updated_at=now()
where slug='amex-delta-platinum';

update credit_cards set
  intro = 'The flagship Delta card for frequent flyers chasing Medallion status and lounge access - 15 Delta Sky Club visits a year (unlimited after $75K spend), a First/Comfort/Main Companion Certificate, MQD Headstart and Boost, and up to $560 in credits. The $650 fee is steep, but a standalone Sky Club membership runs more.',
  annual_fee_usd = 650, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/learnreserve',
  good_to_know='Sky Club access is now capped at 15 visits/year unless you spend $75K. MQD Boost here is $1 MQD per $10 spent (double the Platinum''s rate) - the strongest card path to Delta status.',
  updated_at=now()
where slug='amex-delta-reserve';

update credit_cards set
  intro = 'The business version of the Gold - free checked bags, 2X on Delta, dining, and U.S. shipping and advertising, with the fee waived the first year. Up to 99 free employee cards earn on their spend, plus a $200 flight credit after $10K. A clean SkyMiles earner for Delta-loyal small businesses.',
  annual_fee_usd = 150, foreign_transaction_fee_pct = 0, card_type='business', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards',
  good_to_know='$0 annual fee the first year, then $150. The 2X shipping and advertising bonuses are capped at $50K of spend each per year. Up to 99 employee cards at no extra fee.',
  updated_at=now()
where slug='amex-delta-gold-business';

update credit_cards set
  intro = 'The business Platinum pairs the annual Main Cabin Companion Certificate with 3X on Delta, 1.5X on transit, shipping and large purchases, MQD Headstart and Boost toward status, and up to $440 in credits. Free checked bags and up to 99 employee cards round it out at a $350 fee.',
  annual_fee_usd = 350, foreign_transaction_fee_pct = 0, card_type='business', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards',
  good_to_know='The 1.5X bonus covers transit, rideshare, U.S. shipping, and single purchases of $5,000+, up to $100K combined per year. Companion Certificate is Main Cabin.',
  updated_at=now()
where slug='amex-delta-platinum-business';

update credit_cards set
  intro = 'Delta''s top business card for status-chasers - 15 Sky Club visits (unlimited after $75K), plus Centurion and Escape Lounge access when you book Delta flights on the card, a First/Comfort/Main Companion Certificate, MQD Headstart and Boost, and 1.5X on transit, shipping and office supply. $650 a year, free checked bags, up to 99 employee cards.',
  annual_fee_usd = 650, foreign_transaction_fee_pct = 0, card_type='business', card_tier='airline_cobrand',
  network='amex', credit_score_recommended='excellent', points_transferable_to_partners=false,
  transfer_eligibility='none', is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards',
  good_to_know='The only Delta card with Centurion + Escape Lounge access (when you book the Delta flight on the card). After $150K spend in a year, the 1.5X bonus extends to all purchases for the rest of the year.',
  updated_at=now()
where slug='amex-delta-reserve-business';

-- ============================================================================
-- Clean slate for child rows, then re-insert
-- ============================================================================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug like 'amex-delta-%');
delete from credit_card_earn_rates where card_id in (select id from credit_cards where slug like 'amex-delta-%');
delete from credit_card_benefits where card_id in (select id from credit_cards where slug like 'amex-delta-%');

-- ============================================================================
-- WELCOME BONUSES (limited-time elevated, ends 2026-07-15)
-- ============================================================================
insert into credit_card_welcome_bonuses
  (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, estimated_value_usd, is_current, source_url, last_verified, notes)
values
((select id from credit_cards where slug='amex-delta-blue'), 10000, 'Delta SkyMiles', 1000, 6, '[]'::jsonb, 120, true,
  'https://www.delta.com/learnblue', current_date, 'Earn 10,000 bonus miles after $1,000 in purchases in the first 6 months.'),
((select id from credit_cards where slug='amex-delta-gold'), 70000, 'Delta SkyMiles', 3000, 6,
  '[{"spend_usd":5000,"bonus_amount":20000}]'::jsonb, 1080, true,
  'https://www.delta.com/learngold', current_date, 'Limited-time (ends July 15, 2026): 70,000 miles after $3,000 in 3 months, plus 20,000 more after an additional $2,000 within 6 months. Up to 90,000.'),
((select id from credit_cards where slug='amex-delta-platinum'), 80000, 'Delta SkyMiles', 4000, 6,
  '[{"spend_usd":6000,"bonus_amount":20000}]'::jsonb, 1200, true,
  'https://www.delta.com/learnplatinum', current_date, 'Limited-time (ends July 15, 2026): 80,000 miles after $4,000, plus 20,000 more after an additional $2,000 within 6 months. Up to 100,000.'),
((select id from credit_cards where slug='amex-delta-reserve'), 100000, 'Delta SkyMiles', 6000, 6,
  '[{"spend_usd":9000,"bonus_amount":25000}]'::jsonb, 1500, true,
  'https://www.delta.com/learnreserve', current_date, 'Limited-time (ends July 15, 2026): 100,000 miles after $6,000, plus 25,000 more after an additional $3,000 within 6 months. Up to 125,000.'),
((select id from credit_cards where slug='amex-delta-gold-business'), 90000, 'Delta SkyMiles', 6000, 6, '[]'::jsonb, 1080, true,
  'https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards', current_date, 'Limited-time (ends July 15, 2026): 90,000 miles after $6,000 in purchases in the first 6 months.'),
((select id from credit_cards where slug='amex-delta-platinum-business'), 100000, 'Delta SkyMiles', 8000, 6, '[]'::jsonb, 1200, true,
  'https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards', current_date, 'Limited-time (ends July 15, 2026): 100,000 miles after $8,000 in purchases in the first 6 months.'),
((select id from credit_cards where slug='amex-delta-reserve-business'), 125000, 'Delta SkyMiles', 15000, 6, '[]'::jsonb, 1500, true,
  'https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards', current_date, 'Limited-time (ends July 15, 2026): 125,000 miles after $15,000 in purchases in the first 6 months.');

-- ============================================================================
-- EARN RATES
-- ============================================================================
insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes) values
-- Blue
((select id from credit_cards where slug='amex-delta-blue'), 'airline', 2, 'any', '2X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-blue'), 'dining', 2, 'any', '2X miles at restaurants worldwide, plus U.S. takeout and delivery.'),
((select id from credit_cards where slug='amex-delta-blue'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Gold
((select id from credit_cards where slug='amex-delta-gold'), 'airline', 2, 'any', '2X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-gold'), 'dining', 2, 'any', '2X miles at restaurants worldwide, plus U.S. takeout and delivery.'),
((select id from credit_cards where slug='amex-delta-gold'), 'groceries_us_supermarkets', 2, 'any', '2X miles at U.S. supermarkets.'),
((select id from credit_cards where slug='amex-delta-gold'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Platinum
((select id from credit_cards where slug='amex-delta-platinum'), 'airline', 3, 'any', '3X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-platinum'), 'hotels', 3, 'any', '3X miles on eligible hotel purchases.'),
((select id from credit_cards where slug='amex-delta-platinum'), 'dining', 2, 'any', '2X miles at restaurants worldwide, plus U.S. takeout and delivery.'),
((select id from credit_cards where slug='amex-delta-platinum'), 'groceries_us_supermarkets', 2, 'any', '2X miles at U.S. supermarkets.'),
((select id from credit_cards where slug='amex-delta-platinum'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Reserve
((select id from credit_cards where slug='amex-delta-reserve'), 'airline', 3, 'any', '3X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-reserve'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Gold Business
((select id from credit_cards where slug='amex-delta-gold-business'), 'airline', 2, 'any', '2X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-gold-business'), 'dining', 2, 'any', '2X miles at restaurants worldwide, plus U.S. takeout and delivery.'),
((select id from credit_cards where slug='amex-delta-gold-business'), 'shipping', 2, 'any', '2X miles at U.S. shipping providers (up to $50,000/year).'),
((select id from credit_cards where slug='amex-delta-gold-business'), 'advertising', 2, 'any', '2X miles on U.S. advertising in select media (up to $50,000/year).'),
((select id from credit_cards where slug='amex-delta-gold-business'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Platinum Business
((select id from credit_cards where slug='amex-delta-platinum-business'), 'airline', 3, 'any', '3X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'transit', 1.5, 'any', '1.5X miles on transit (rideshare, taxis), U.S. shipping, and single purchases of $5,000+, up to $100,000 combined/year.'),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'base', 1, 'any', '1X miles on all other eligible purchases.'),
-- Reserve Business
((select id from credit_cards where slug='amex-delta-reserve-business'), 'airline', 3, 'any', '3X miles on Delta purchases.'),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'transit', 1.5, 'any', '1.5X miles on transit (rideshare, taxis), U.S. shipping, and U.S. office supply; after $150,000 spend/year, 1.5X on all purchases for the rest of the year.'),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'base', 1, 'any', '1X miles on all other eligible purchases.');

-- ============================================================================
-- BENEFITS
-- ============================================================================
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
-- Blue
((select id from credit_cards where slug='amex-delta-blue'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases (food, beverages, audio headsets).', 1),
-- Gold
((select id from credit_cards where slug='amex-delta-gold'), 'other', 'free_checked_bag', 'First + Second Checked Bag Free', null, null, 'airline', null, 'First checked bag free on Delta flights (international and domestic), plus second checked bag free on domestic Delta flights, for you and up to 8 on the reservation.', 1),
((select id from credit_cards where slug='amex-delta-gold'), 'other', 'priority_boarding', 'Zone 5 Priority Boarding', null, null, 'airline', null, 'Settle in sooner with Zone 5 priority boarding on Delta flights.', 2),
((select id from credit_cards where slug='amex-delta-gold'), 'travel_credit', 'airline_credit', 'Delta Flight Credit', 200, 'USD', 'airline', 'annual', '$200 Delta Flight Credit toward future travel after you spend $10,000 on the Card in a calendar year.', 3),
((select id from credit_cards where slug='amex-delta-gold'), 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on U.S. rideshare with select providers, after your first Card renewal. Enrollment required.', 4),
((select id from credit_cards where slug='amex-delta-gold'), 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 100, 'USD', 'hotel', 'annual', 'Up to $100/year as a statement credit on prepaid hotels and vacation rentals booked through Delta Stays on delta.com.', 5),
((select id from credit_cards where slug='amex-delta-gold'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 6),
-- Platinum
((select id from credit_cards where slug='amex-delta-platinum'), 'other', 'companion_pass', 'Annual Companion Certificate (Main Cabin)', null, null, 'airline', 'annual', 'Each year after Card renewal: a Main Cabin round-trip Companion Certificate for domestic, Caribbean, or Central American destinations. Companion pays only government taxes/fees ($22-$250).', 1),
((select id from credit_cards where slug='amex-delta-platinum'), 'other', 'free_checked_bag', 'First + Second Checked Bag Free', null, null, 'airline', null, 'First and second checked bag free on Delta flights for you and up to 8 on the reservation.', 2),
((select id from credit_cards where slug='amex-delta-platinum'), 'other', 'priority_boarding', 'Zone 5 Priority Boarding', null, null, 'airline', null, 'Zone 5 priority boarding on Delta flights.', 3),
((select id from credit_cards where slug='amex-delta-platinum'), 'spend_unlock', 'other', 'MQD Headstart', null, null, 'status', 'annual', '$2,500 Medallion Qualification Dollars (MQDs) each Medallion Qualification Year - a head start toward Delta elite status.', 4),
((select id from credit_cards where slug='amex-delta-platinum'), 'spend_unlock', 'other', 'MQD Boost', null, null, 'status', null, 'Earn $1 MQD for every $20 in Card purchases toward Medallion status.', 5),
((select id from credit_cards where slug='amex-delta-platinum'), 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on U.S. rideshare with select providers. Enrollment required.', 6),
((select id from credit_cards where slug='amex-delta-platinum'), 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 150, 'USD', 'hotel', 'annual', 'Up to $150/year as a statement credit on prepaid hotels/vacation rentals through Delta Stays on delta.com.', 7),
((select id from credit_cards where slug='amex-delta-platinum'), 'statement_credit', 'dining_credit', 'Resy Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on eligible U.S. Resy restaurant purchases. Resy account required.', 8),
((select id from credit_cards where slug='amex-delta-platinum'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 9),
-- Reserve
((select id from credit_cards where slug='amex-delta-reserve'), 'lounge_access', 'lounge_skyclub', 'Delta Sky Club Access (15 Visits)', null, null, 'lounge', null, '15 Delta Sky Club visits each Medallion Year when flying Delta; unlock unlimited access after spending $75,000 on the Card in a calendar year.', 1),
((select id from credit_cards where slug='amex-delta-reserve'), 'other', 'companion_pass', 'Annual Companion Certificate (First/Comfort/Main)', null, null, 'airline', 'annual', 'Each year after Card renewal: a First Class, Comfort+, or Main Cabin round-trip Companion Certificate for domestic, Caribbean, or Central American destinations. Companion pays only taxes/fees ($22-$250).', 2),
((select id from credit_cards where slug='amex-delta-reserve'), 'other', 'free_checked_bag', 'First + Second Checked Bag Free', null, null, 'airline', null, 'First and second checked bag free on Delta flights for you and up to 8 on the reservation.', 3),
((select id from credit_cards where slug='amex-delta-reserve'), 'other', 'priority_boarding', 'Zone 5 Priority Boarding', null, null, 'airline', null, 'Zone 5 priority boarding on Delta flights.', 4),
((select id from credit_cards where slug='amex-delta-reserve'), 'spend_unlock', 'other', 'MQD Headstart', null, null, 'status', 'annual', '$2,500 Medallion Qualification Dollars (MQDs) each Medallion Qualification Year.', 5),
((select id from credit_cards where slug='amex-delta-reserve'), 'spend_unlock', 'other', 'MQD Boost', null, null, 'status', null, 'Earn $1 MQD for every $10 in Card purchases toward Medallion status (double the Platinum rate).', 6),
((select id from credit_cards where slug='amex-delta-reserve'), 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on U.S. rideshare with select providers. Enrollment required.', 7),
((select id from credit_cards where slug='amex-delta-reserve'), 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 200, 'USD', 'hotel', 'annual', 'Up to $200/year as a statement credit on prepaid hotels/vacation rentals through Delta Stays on delta.com.', 8),
((select id from credit_cards where slug='amex-delta-reserve'), 'statement_credit', 'dining_credit', 'Resy Credit', 240, 'USD', 'credit', 'annual', 'Up to $20/month in statement credits on eligible U.S. Resy restaurant purchases. Resy account required.', 9),
((select id from credit_cards where slug='amex-delta-reserve'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 10),
-- Gold Business
((select id from credit_cards where slug='amex-delta-gold-business'), 'other', 'free_checked_bag', 'First Checked Bag Free', null, null, 'airline', null, 'First checked bag free on Delta flights (international and domestic) for you and up to 8 on the reservation.', 1),
((select id from credit_cards where slug='amex-delta-gold-business'), 'travel_credit', 'airline_credit', 'Delta Flight Credit', 200, 'USD', 'airline', 'annual', '$200 Delta Flight Credit toward future travel after you spend $10,000 on the Card in a calendar year.', 2),
((select id from credit_cards where slug='amex-delta-gold-business'), 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on U.S. rideshare with select providers, after your first Card renewal. Enrollment required.', 3),
((select id from credit_cards where slug='amex-delta-gold-business'), 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 150, 'USD', 'hotel', 'annual', 'Up to $150/year as a statement credit on prepaid hotels/vacation rentals through Delta Stays on delta.com.', 4),
((select id from credit_cards where slug='amex-delta-gold-business'), 'other', 'other', 'Up to 99 Employee Cards', null, null, 'perk', null, 'Add up to 99 employee cards at no annual fee; they earn miles the same way your Card does.', 5),
((select id from credit_cards where slug='amex-delta-gold-business'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 6),
-- Platinum Business
((select id from credit_cards where slug='amex-delta-platinum-business'), 'other', 'companion_pass', 'Annual Companion Certificate (Main Cabin)', null, null, 'airline', 'annual', 'Each year after Card renewal: a Main Cabin round-trip Companion Certificate for domestic, Caribbean, or Central American destinations. Companion pays only taxes/fees ($22-$250).', 1),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'other', 'free_checked_bag', 'First Checked Bag Free', null, null, 'airline', null, 'First checked bag free on Delta flights for you and up to 8 on the reservation.', 2),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'spend_unlock', 'other', 'MQD Headstart', null, null, 'status', 'annual', '$2,500 Medallion Qualification Dollars (MQDs) each Medallion Qualification Year.', 3),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'spend_unlock', 'other', 'MQD Boost', null, null, 'status', null, 'Earn $1 MQD for every $20 in Card purchases toward Medallion status.', 4),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on U.S. rideshare. Enrollment required.', 5),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 200, 'USD', 'hotel', 'annual', 'Up to $200/year as a statement credit on prepaid hotels/vacation rentals through Delta Stays on delta.com.', 6),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'statement_credit', 'dining_credit', 'Resy Credit', 120, 'USD', 'credit', 'annual', 'Up to $10/month in statement credits on eligible U.S. Resy restaurant purchases.', 7),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'other', 'other', 'Up to 99 Employee Cards', null, null, 'perk', null, 'Add up to 99 employee cards at no annual fee; they earn miles the same way your Card does.', 8),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 9),
-- Reserve Business
((select id from credit_cards where slug='amex-delta-reserve-business'), 'lounge_access', 'lounge_skyclub', 'Delta Sky Club Access (15 Visits)', null, null, 'lounge', null, '15 Delta Sky Club visits each Medallion Year when flying Delta; unlimited after $75,000 in Card purchases in a calendar year.', 1),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'lounge_access', 'lounge_centurion', 'Centurion + Escape Lounge Access', null, null, 'lounge', null, 'Access to The Centurion Lounge and Escape Lounges when you book your Delta flight with the Card.', 2),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'other', 'companion_pass', 'Annual Companion Certificate (First/Comfort/Main)', null, null, 'airline', 'annual', 'Each year after Card renewal: a First Class, Comfort+, or Main Cabin round-trip Companion Certificate for domestic, Caribbean, or Central American destinations. Companion pays only taxes/fees ($22-$250).', 3),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'other', 'free_checked_bag', 'First Checked Bag Free', null, null, 'airline', null, 'First checked bag free on Delta flights for you and up to 8 on the reservation.', 4),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'spend_unlock', 'other', 'MQD Headstart', null, null, 'status', 'annual', '$2,500 Medallion Qualification Dollars (MQDs) each Medallion Qualification Year.', 5),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'spend_unlock', 'other', 'MQD Boost', null, null, 'status', null, 'Earn $1 MQD for every $10 in Card purchases toward Medallion status.', 6),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'other', 'other', 'Up to 99 Employee Cards', null, null, 'perk', null, 'Add up to 99 employee cards at no annual fee; they earn miles the same way your Card does.', 7),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'statement_credit', 'other', '20% Back on In-Flight Purchases', null, null, 'credit', null, 'Earn 20% back as a statement credit on eligible in-flight Delta purchases.', 8);

-- ============================================================================
-- Mark all 7 as freshly extracted (manual authoring)
-- ============================================================================
insert into credit_card_extractions (card_id, source_url, raw_markdown, markdown_chars, extraction, status, model, saved_at, created_at)
select c.id, c.official_url, 'Manual authoring from official delta.com card pages (2026-06-15).', 64,
       jsonb_build_object('source','manual','authored_on','2026-06-15'), 'saved', 'manual', now(), now()
from credit_cards c where c.slug like 'amex-delta-%';
