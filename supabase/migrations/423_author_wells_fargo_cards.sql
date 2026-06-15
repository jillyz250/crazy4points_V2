-- Author the 4 Wells Fargo cards: Autograph + Autograph Journey (earn transferable
-- Wells Fargo Rewards) and Choice Privileges + Choice Privileges Select (co-brand
-- Choice points). Earn rates, fees, $50 airline credit, elite nights, and
-- anniversary bonus are from the official wellsfargo.com /terms/ pages (the
-- marketing pages bot-block Firecrawl). Welcome bonuses verified 2026-06-15:
--   Autograph 20,000/$1,000 (Journey 60,000/$4,000 from terms); Choice 40,000
--   base with a limited-time 60,000/$1,000 through Sept 8, 2026; Select 60,000/$3,000.

-- ============================================================================
-- CARD-LEVEL FIELDS
-- ============================================================================
update credit_cards set
  intro = 'A no-fee powerhouse for everyday spend: 3X points on restaurants, travel, gas, transit, streaming, and phone plans - six of the categories most people actually use - and Wells Fargo Rewards that transfer to airline and hotel partners. Hard to beat at $0 a year.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='starter',
  network='visa', credit_score_recommended='good', points_transferable_to_partners=true,
  transfer_eligibility='direct', is_active=true, status='active', last_verified=current_date,
  official_url='https://www.wellsfargo.com/credit-cards/autograph-visa/',
  good_to_know='Wells Fargo Rewards transfer 1:1 to most airline/hotel partners, but Choice and Wyndham are 1:2. Standard welcome offer is 20,000 points; watch for elevated 30,000-point offers.',
  updated_at=now()
where slug='wells-fargo-autograph';

update credit_cards set
  intro = 'Wells Fargo''s premium travel card: 5X on hotels, 4X on airlines, 3X on other travel and dining, a $50 annual airline credit, and no foreign transaction fees. Points transfer to airline and hotel partners, making the $95 fee easy to justify for regular travelers.',
  annual_fee_usd = 95, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='mid',
  network='visa', credit_score_recommended='excellent', points_transferable_to_partners=true,
  transfer_eligibility='direct', is_active=true, status='active', last_verified=current_date,
  official_url='https://www.wellsfargo.com/credit-cards/autograph-journey-visa/',
  good_to_know='The $50 airline credit triggers on your first airline purchase of $50 or more each year. No lounge access, but a strong all-around travel earner with transfer partners.',
  updated_at=now()
where slug='wells-fargo-autograph-journey';

update credit_cards set
  intro = 'The no-fee Choice Hotels card for road-trippers and budget-stay loyalists: 5X points on Choice stays, 3X on gas, groceries, home improvement, phone, and streaming, plus 10 Elite Night Credits a year toward Choice status. Choice points stretch far at Comfort, Cambria, and the Ascend Collection.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='hotel_cobrand',
  network='mastercard', credit_score_recommended='good', points_transferable_to_partners=false,
  transfer_eligibility='none', co_brand_program_id='5b23098d-3477-4d2e-96d0-29c51b8ef7b6',
  is_active=true, status='active', last_verified=current_date,
  official_url='https://www.wellsfargo.com/credit-cards/choice/',
  good_to_know='Choice points are low-value (about 0.6 cents) but cheap award nights make them stretch. The 10 Elite Night Credits jump-start status. Limited-time 60,000-point welcome bonus through Sept 8, 2026 (40,000 standard).',
  updated_at=now()
where slug='wells-fargo-choice-privileges' or slug='choice-privileges' or name='Choice Privileges Mastercard';

update credit_cards set
  intro = 'The $95 upgrade for Choice devotees: 10X on Choice stays, 5X on everyday categories, 30,000 anniversary points a year (worth more than the fee), automatic Platinum Elite status, and 10 Elite Night Credits. If you stay with Choice even a few times a year, this card pays for itself.',
  annual_fee_usd = 95, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='hotel_cobrand',
  network='mastercard', credit_score_recommended='good', points_transferable_to_partners=false,
  transfer_eligibility='none', co_brand_program_id='5b23098d-3477-4d2e-96d0-29c51b8ef7b6',
  is_active=true, status='active', last_verified=current_date,
  official_url='https://www.wellsfargo.com/credit-cards/choice-select/',
  good_to_know='The 30,000 anniversary points (about $180 value) more than cover the $95 fee on their own. Automatic Platinum Elite status plus 10 Elite Night Credits make it a no-brainer for frequent Choice guests.',
  updated_at=now()
where slug='wells-fargo-choice-privileges-select' or slug='choice-privileges-select' or name='Choice Privileges Select Mastercard';

-- ============================================================================
-- Clean slate + child rows
-- ============================================================================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug like 'wells-fargo-%');
delete from credit_card_earn_rates where card_id in (select id from credit_cards where slug like 'wells-fargo-%');
delete from credit_card_benefits where card_id in (select id from credit_cards where slug like 'wells-fargo-%');

-- WELCOME BONUSES
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, baseline_bonus_amount, is_elevated, estimated_value_usd, is_current, source_url, last_verified, notes) values
((select id from credit_cards where slug='wells-fargo-autograph'), 20000, 'Wells Fargo Rewards', 1000, 3, null, false, 200, true,
  'https://www.wellsfargo.com/credit-cards/autograph-visa/', current_date, 'Earn 20,000 bonus points after $1,000 in purchases in the first 3 months. Elevated 30,000-point offers (after $1,500) appear periodically.'),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 60000, 'Wells Fargo Rewards', 4000, 3, null, false, 600, true,
  'https://www.wellsfargo.com/credit-cards/autograph-journey-visa/', current_date, 'Earn 60,000 bonus points after $4,000 in purchases in the first 3 months.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 60000, 'Choice Privileges points', 1000, 3, 40000, true, 360, true,
  'https://www.wellsfargo.com/credit-cards/choice/', current_date, 'Limited-time 60,000 bonus points after $1,000 in purchases in the first 3 months, through Sept 8, 2026. Standard offer is 40,000.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 60000, 'Choice Privileges points', 3000, 3, null, false, 360, true,
  'https://www.wellsfargo.com/credit-cards/choice-select/', current_date, 'Earn 60,000 bonus points after $3,000 in purchases in the first 3 months.');

-- EARN RATES
insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes) values
-- Autograph
((select id from credit_cards where slug='wells-fargo-autograph'), 'dining', 3, 'any', '3X points at restaurants (including fast food and food-serving grocery).'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'travel', 3, 'any', '3X points on travel (travel agencies, discount travel sites, and more).'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'gas', 3, 'any', '3X points at gas stations.'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'transit', 3, 'any', '3X points on transit.'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'streaming', 3, 'any', '3X points on popular streaming services.'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'telecom', 3, 'any', '3X points on phone plans (landline and cell phone providers).'),
((select id from credit_cards where slug='wells-fargo-autograph'), 'base', 1, 'any', '1X points on all other purchases.'),
-- Autograph Journey
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'hotels', 5, 'any', '5X points on hotels.'),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'airline_tickets', 4, 'any', '4X points on airlines and air carriers.'),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'travel', 3, 'any', '3X points on other travel.'),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'dining', 3, 'any', '3X points at restaurants.'),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'base', 1, 'any', '1X points on all other purchases.'),
-- Choice Privileges
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'hotels', 5, 'any', '5X points on stays at eligible Choice and non-Choice locations (plus 5X on Choice Privileges Points purchases).'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'gas', 3, 'any', '3X points at gas stations.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'groceries', 3, 'any', '3X points at grocery stores.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'telecom', 3, 'any', '3X points on phone plans.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'streaming', 3, 'any', '3X points on select streaming services.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'home_improvement', 3, 'any', '3X points at home improvement stores.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'base', 1, 'any', '1X points on all other purchases.'),
-- Choice Privileges Select
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'hotels', 10, 'any', '10X points on stays at eligible Choice and non-Choice locations.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'gas', 5, 'any', '5X points at gas stations.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'groceries', 5, 'any', '5X points at grocery stores.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'telecom', 5, 'any', '5X points on phone plans.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'streaming', 5, 'any', '5X points on select streaming services.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'home_improvement', 5, 'any', '5X points at home improvement stores.'),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'base', 1, 'any', '1X points on all other purchases.');

-- BENEFITS
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
-- Autograph
((select id from credit_cards where slug='wells-fargo-autograph'), 'protection', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'Up to $600 per claim (subject to a deductible) against damage or theft when you pay your monthly cell phone bill with the Card.', 1),
((select id from credit_cards where slug='wells-fargo-autograph'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Airline & Hotel Partners', null, null, 'earning', null, 'Move Wells Fargo Rewards to airline and hotel transfer partners (most 1:1; Choice and Wyndham 1:2).', 2),
-- Autograph Journey
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'travel_credit', 'airline_credit', 'Annual Airline Credit', 50, 'USD', 'airline', 'annual', '$50 statement credit each year on your first airline purchase of $50 or more.', 1),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'protection', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'Up to $600 per claim (subject to a deductible) against damage or theft when you pay your phone bill with the Card.', 2),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation & Interruption Insurance', null, null, 'insurance', null, 'Reimbursement for covered non-refundable trip costs when a trip is cancelled or interrupted (terms apply).', 3),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'insurance', 'lost_luggage_insurance', 'Lost Luggage Reimbursement', null, null, 'insurance', null, 'Coverage for lost or damaged checked or carry-on baggage on a common carrier (terms apply).', 4),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'insurance', 'rental_car_cdw_secondary', 'Auto Rental Collision Damage Waiver', null, null, 'insurance', null, 'Coverage for damage or theft on eligible rentals paid with the Card.', 5),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Airline & Hotel Partners', null, null, 'earning', null, 'Move Wells Fargo Rewards to airline and hotel transfer partners (most 1:1; Choice and Wyndham 1:2).', 6),
-- Choice Privileges
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'spend_unlock', 'other', '10 Elite Night Credits', null, null, 'status', 'annual', '10 Elite Qualifying Nights deposited within 14 days of opening and each year, jump-starting Choice Privileges elite status.', 1),
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'protection', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'World Elite Mastercard cell phone protection against damage or theft when you pay your phone bill with the Card (terms apply).', 2),
-- Choice Privileges Select
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'other', 'other', 'Anniversary Bonus Points', 30000, 'points', 'perk', 'annual', '30,000 bonus points each anniversary year - worth roughly $180, more than the annual fee.', 1),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'status_conferred', 'status_other', 'Automatic Platinum Elite Status', null, null, 'status', null, 'Automatic Choice Privileges Platinum Elite status while you hold the Card.', 2),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'spend_unlock', 'other', '10 Elite Night Credits', null, null, 'status', 'annual', '10 Elite Qualifying Nights deposited within 14 days of opening and each year toward Choice Privileges status.', 3),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'protection', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'World Elite Mastercard cell phone protection against damage or theft when you pay your phone bill with the Card (terms apply).', 4);

-- Mark extracted
insert into credit_card_extractions (card_id, source_url, raw_markdown, markdown_chars, extraction, status, model, saved_at, created_at)
select c.id, c.official_url, 'Manual authoring from official wellsfargo.com /terms/ pages + verified welcome offers (2026-06-15).', 95,
       jsonb_build_object('source','manual','authored_on','2026-06-15'), 'saved', 'manual', now(), now()
from credit_cards c where c.slug like 'wells-fargo-%';
