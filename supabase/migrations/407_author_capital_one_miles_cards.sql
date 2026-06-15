-- Author the Capital One transferable-miles card family (6 live cards) and retire
-- the discontinued Spark Miles line.
--
-- VERIFIED 2026-06-15 against official capitalone.com product pages:
--   Venture X         https://www.capitalone.com/credit-cards/venture-x/
--   Venture           https://www.capitalone.com/credit-cards/venture/
--   VentureOne        https://www.capitalone.com/credit-cards/ventureone/
--   Venture X Business https://www.capitalone.com/small-business/credit-cards/venture-x-business/
--   Venture Business   https://www.capitalone.com/small-business/credit-cards/venture-business/
--   VentureOne Business https://www.capitalone.com/small-business/credit-cards/ventureone-business/
--
-- DISCOVERY: Capital One retired "Spark Miles for Business" and "Spark Miles
-- Select for Business". The spark-miles URL now redirects to the business
-- travel index, which lists Venture X Business / Venture Business / VentureOne
-- Business. Spark Miles -> Venture Business; Spark Miles Select -> VentureOne
-- Business. The two Spark skeletons are marked defunct (excluded from the refresh
-- queue per migration 395); the two new products are authored as fresh rows.
--
-- All six earn transferable Capital One miles (15+ airline/hotel partners, mostly
-- 1:1), charge no foreign transaction fee, and miles do not expire for the life
-- of the account.

-- ============================================================================
-- (1) RETIRE the discontinued Spark Miles cards
-- ============================================================================
update credit_cards
set status = 'defunct', is_active = false, closed_to_new_applicants = true,
    notes = 'Discontinued by Capital One. Replaced for new applicants by the Capital One Venture Business card (capital-one-venture-business). Existing cardholders keep their accounts.',
    updated_at = now()
where slug = 'capital-one-spark-miles';

update credit_cards
set status = 'defunct', is_active = false, closed_to_new_applicants = true,
    notes = 'Discontinued by Capital One. Replaced for new applicants by the Capital One VentureOne Business card (capital-one-ventureone-business). Existing cardholders keep their accounts.',
    updated_at = now()
where slug = 'capital-one-spark-miles-select';

-- ============================================================================
-- (2) CREATE the two new business cards (rebrands of the Spark Miles line)
-- ============================================================================
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, currency_program_id,
    annual_fee_usd, foreign_transaction_fee_pct, credit_score_recommended,
    points_transferable_to_partners, transfer_eligibility, is_active, status,
    official_url)
values
('capital-one-venture-business',
  (select id from issuers where slug='capital-one'),
  'Capital One Venture Business', 'business', 'business',
  'd47028e0-0777-4dcf-bf21-23046086a184',
  95, 0, 'excellent', true, 'direct', true, 'active',
  'https://www.capitalone.com/small-business/credit-cards/venture-business/'),
('capital-one-ventureone-business',
  (select id from issuers where slug='capital-one'),
  'Capital One VentureOne Business', 'business', 'business',
  'd47028e0-0777-4dcf-bf21-23046086a184',
  0, 0, 'excellent', true, 'direct', true, 'active',
  'https://www.capitalone.com/small-business/credit-cards/ventureone-business/')
on conflict (slug) do nothing;

-- ============================================================================
-- (3) AUTHOR card-level fields for all six live cards
-- ============================================================================
update credit_cards set
  intro = 'Capital One''s flagship travel card, and one of the best-value premium cards going. The $395 fee is easy to wipe out with the $300 annual travel credit and 10,000 anniversary miles, then you earn 2X on literally every purchase plus lounge access for you and your authorized users. If you want premium perks without a $695 sticker, start here.',
  annual_fee_usd = 395, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='premium',
  credit_score_recommended='excellent', points_transferable_to_partners=true, transfer_eligibility='direct',
  is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.capitalone.com/credit-cards/venture-x/',
  good_to_know='Capital One miles transfer to 15+ airline and hotel partners, most at 1:1. The $300 credit and 10K anniversary miles are claimed through Capital One Travel. Authorized users are free and get their own lounge access.',
  updated_at=now()
where slug='capital-one-venture-x';

update credit_cards set
  intro = 'The workhorse of flexible travel cards: 2X miles on every purchase, a big welcome bonus, and a $95 fee that pays for itself fast. Capital One miles transfer to 15+ airline and hotel partners, so this punches well above its weight for a mid-tier card.',
  annual_fee_usd = 95, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='mid',
  credit_score_recommended='excellent', points_transferable_to_partners=true, transfer_eligibility='direct',
  is_metal_card=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.capitalone.com/credit-cards/venture/',
  good_to_know='Best paired with a transfer partner you actually use - the miles are worth far more transferred than redeemed as a flat travel eraser.',
  updated_at=now()
where slug='capital-one-venture';

update credit_cards set
  intro = 'The no-fee way into Capital One''s transfer-partner ecosystem. 1.25X on everything isn''t thrilling, but with zero annual fee, no foreign transaction fees, and full access to the same 15+ transfer partners as the paid Venture cards, it''s a solid keeper card and a great first miles card.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 0, card_type='personal', card_tier='starter',
  credit_score_recommended='excellent', points_transferable_to_partners=true, transfer_eligibility='direct',
  is_metal_card=false, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.capitalone.com/credit-cards/ventureone/',
  good_to_know='Hold this to keep your Capital One miles alive with no annual fee. Pair it with a Venture or Venture X for the earning, and downgrade to this instead of canceling.',
  updated_at=now()
where slug='capital-one-ventureone';

update credit_cards set
  intro = 'The business version of Capital One''s flagship - same $300 travel credit, 10,000 anniversary miles, and lounge access, but with no preset spending limit and a huge 150,000-mile welcome bonus. 2X on every dollar your business spends, all transferable to 15+ partners.',
  annual_fee_usd = 395, foreign_transaction_fee_pct = 0, card_type='business', card_tier='business',
  credit_score_recommended='excellent', points_transferable_to_partners=true, transfer_eligibility='direct',
  is_metal_card=true, no_preset_spending_limit=true, is_active=true, status='active', last_verified=current_date,
  official_url='https://www.capitalone.com/small-business/credit-cards/venture-x-business/',
  good_to_know='The 150K bonus requires $30,000 in spend in 3 months - sized for real business volume. Free employee cards earn on their spend too.',
  updated_at=now()
where slug='capital-one-venture-x-business';

update credit_cards set
  intro = 'Capital One''s mid-tier business travel card (the rebrand of Spark Miles for Business): unlimited 2X on every purchase, a 100,000-mile welcome bonus, free employee cards, and a $95 fee. Miles transfer to the same 15+ partners as the personal Venture line.',
  annual_fee_usd = 95, card_type='business', card_tier='business',
  good_to_know='Replaced the Spark Miles for Business card. The 100K bonus needs $10,000 in spend in 3 months. Free employee cards earn 2X on their spend.',
  updated_at=now()
where slug='capital-one-venture-business';

update credit_cards set
  intro = 'The no-annual-fee business miles card (formerly Spark Miles Select for Business): 1.5X flat on everything, free employee cards, and full access to Capital One''s 15+ transfer partners. A clean, free way to bank transferable miles on business spend.',
  annual_fee_usd = 0, card_type='business', card_tier='business',
  good_to_know='Replaced the Spark Miles Select for Business card. No annual fee makes it an easy long-term hold to keep business miles earning.',
  updated_at=now()
where slug='capital-one-ventureone-business';

-- ============================================================================
-- (4) Clean slate for child rows on the 6 live cards, then re-insert
-- ============================================================================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug in
  ('capital-one-venture-x','capital-one-venture','capital-one-ventureone',
   'capital-one-venture-x-business','capital-one-venture-business','capital-one-ventureone-business'));
delete from credit_card_earn_rates where card_id in (select id from credit_cards where slug in
  ('capital-one-venture-x','capital-one-venture','capital-one-ventureone',
   'capital-one-venture-x-business','capital-one-venture-business','capital-one-ventureone-business'));
delete from credit_card_benefits where card_id in (select id from credit_cards where slug in
  ('capital-one-venture-x','capital-one-venture','capital-one-ventureone',
   'capital-one-venture-x-business','capital-one-venture-business','capital-one-ventureone-business'));

-- ============================================================================
-- (5) WELCOME BONUSES
-- ============================================================================
insert into credit_card_welcome_bonuses
  (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, estimated_value_usd, is_current, source_url, last_verified, notes)
values
((select id from credit_cards where slug='capital-one-venture-x'), 75000, 'Capital One miles', 4000, 3, 750, true,
  'https://www.capitalone.com/credit-cards/venture-x/', current_date, 'Earn 75,000 bonus miles after $4,000 in purchases in the first 3 months.'),
((select id from credit_cards where slug='capital-one-venture'), 75000, 'Capital One miles', 4000, 3, 750, true,
  'https://www.capitalone.com/credit-cards/venture/', current_date, 'Earn 75,000 bonus miles after $4,000 in purchases in the first 3 months.'),
((select id from credit_cards where slug='capital-one-ventureone'), 20000, 'Capital One miles', 500, 3, 200, true,
  'https://www.capitalone.com/credit-cards/ventureone/', current_date, 'Earn 20,000 bonus miles after $500 in purchases in the first 3 months. Plus 0% intro APR for 15 months on purchases and balance transfers.'),
((select id from credit_cards where slug='capital-one-venture-x-business'), 150000, 'Capital One miles', 30000, 3, 1500, true,
  'https://www.capitalone.com/small-business/credit-cards/venture-x-business/', current_date, 'Earn 150,000 bonus miles after $30,000 in purchases in the first 3 months.'),
((select id from credit_cards where slug='capital-one-venture-business'), 100000, 'Capital One miles', 10000, 3, 1000, true,
  'https://www.capitalone.com/small-business/credit-cards/venture-business/', current_date, 'Earn 100,000 bonus miles after $10,000 in purchases in the first 3 months.'),
((select id from credit_cards where slug='capital-one-ventureone-business'), 50000, 'Capital One miles', 4500, 3, 500, true,
  'https://www.capitalone.com/small-business/credit-cards/ventureone-business/', current_date, 'Earn 50,000 bonus miles after $4,500 in purchases in the first 3 months.');

-- ============================================================================
-- (6) EARN RATES
-- ============================================================================
insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes) values
-- Venture X
((select id from credit_cards where slug='capital-one-venture-x'), 'base', 2, 'any', '2X miles on every purchase, every day.'),
((select id from credit_cards where slug='capital-one-venture-x'), 'hotels_cars_attractions_portal', 10, 'portal', '10X miles on hotels and rental cars booked through Capital One Travel.'),
((select id from credit_cards where slug='capital-one-venture-x'), 'travel_through_portal', 5, 'portal', '5X miles on flights and vacation rentals booked through Capital One Travel (also 5X on Capital One Entertainment).'),
-- Venture
((select id from credit_cards where slug='capital-one-venture'), 'base', 2, 'any', '2X miles on every purchase, every day.'),
((select id from credit_cards where slug='capital-one-venture'), 'hotels_cars_attractions_portal', 5, 'portal', '5X miles on hotels, vacation rentals, and rental cars booked through Capital One Travel.'),
-- VentureOne
((select id from credit_cards where slug='capital-one-ventureone'), 'base', 1.25, 'any', '1.25X miles on every purchase.'),
((select id from credit_cards where slug='capital-one-ventureone'), 'hotels_cars_attractions_portal', 5, 'portal', '5X miles on hotels, vacation rentals, and rental cars booked through Capital One Travel.'),
-- Venture X Business
((select id from credit_cards where slug='capital-one-venture-x-business'), 'base', 2, 'any', '2X miles on every purchase, everywhere, no limits or category restrictions.'),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'hotels_cars_attractions_portal', 10, 'portal', '10X miles on hotels and rental cars booked through Capital One Business Travel.'),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'travel_through_portal', 5, 'portal', '5X miles on flights and vacation rentals booked through Capital One Business Travel.'),
-- Venture Business
((select id from credit_cards where slug='capital-one-venture-business'), 'base', 2, 'any', '2X miles on every purchase for your business.'),
((select id from credit_cards where slug='capital-one-venture-business'), 'hotels_cars_attractions_portal', 5, 'portal', '5X miles on hotels, vacation rentals, and rental cars booked through Capital One Business Travel.'),
-- VentureOne Business
((select id from credit_cards where slug='capital-one-ventureone-business'), 'base', 1.5, 'any', '1.5X miles on every purchase for your business.'),
((select id from credit_cards where slug='capital-one-ventureone-business'), 'hotels_cars_attractions_portal', 5, 'portal', '5X miles on hotels, vacation rentals, and rental cars booked through Capital One Business Travel.');

-- ============================================================================
-- (7) BENEFITS
-- ============================================================================
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, coverage_amount, benefit_family, frequency, description, sort_order) values
-- Venture X
((select id from credit_cards where slug='capital-one-venture-x'), 'travel_credit', 'travel_credit_annual', 'Annual Travel Credit', 300, 'USD', null, 'credit', 'annual', '$300 annual credit for bookings through Capital One Travel.', 1),
((select id from credit_cards where slug='capital-one-venture-x'), 'other', 'other', 'Anniversary Bonus Miles', 10000, 'miles', null, 'earning', 'annual', '10,000 bonus miles (about $100 toward travel) every year, starting on your first anniversary.', 2),
((select id from credit_cards where slug='capital-one-venture-x'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', null, 'credit', null, 'Up to $120 statement credit for Global Entry or TSA PreCheck application fee.', 3),
((select id from credit_cards where slug='capital-one-venture-x'), 'lounge_access', 'lounge_other', 'Capital One Lounges and Landing', null, null, null, 'lounge', null, 'Primary cardholders get access to Capital One Lounge and Landing locations.', 4),
((select id from credit_cards where slug='capital-one-venture-x'), 'lounge_access', 'lounge_priority_pass', 'Priority Pass Lounge Access', null, null, null, 'lounge', null, 'Primary cardholders get access to 1,300+ Priority Pass lounges worldwide.', 5),
((select id from credit_cards where slug='capital-one-venture-x'), 'protection', 'cellphone_protection', 'Cell Phone Protection', null, null, 800, 'protection', null, 'Up to $800 reimbursement if your phone is stolen or damaged, when you pay your bill with the card. Terms and exclusions apply.', 6),
((select id from credit_cards where slug='capital-one-venture-x'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, null, 'status', null, 'Complimentary Hertz Five Star status - skip the counter and pick from a wider selection of cars.', 7),
((select id from credit_cards where slug='capital-one-venture-x'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 8),
((select id from credit_cards where slug='capital-one-venture-x'), 'other', 'other', 'PRIOR and The Cultivist Subscriptions', 149, 'USD', null, 'perk', null, 'Complimentary PRIOR subscription (a $149 value) for curated travel experiences, plus The Cultivist access.', 9),
-- Venture
((select id from credit_cards where slug='capital-one-venture'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', null, 'credit', null, 'Up to $120 statement credit for Global Entry or TSA PreCheck application fee.', 1),
((select id from credit_cards where slug='capital-one-venture'), 'travel_credit', 'hotel_credit', 'Lifestyle Collection Experience Credit', 50, 'USD', null, 'hotel', 'per_use', '$50 experience credit on every Lifestyle Collection booking, plus room upgrades, early check-in and late checkout when available.', 2),
((select id from credit_cards where slug='capital-one-venture'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, null, 'status', null, 'Complimentary Hertz Five Star status.', 3),
((select id from credit_cards where slug='capital-one-venture'), 'insurance', 'travel_accident_insurance', 'Travel Accident Insurance', null, null, null, 'insurance', null, 'Automatic insurance for a covered loss when you buy your fare with the card.', 4),
((select id from credit_cards where slug='capital-one-venture'), 'insurance', 'rental_car_cdw_secondary', 'Auto Rental Collision Damage Waiver', null, null, null, 'insurance', null, 'Coverage for damage from collision or theft on eligible rentals paid with the card (secondary in the US).', 5),
((select id from credit_cards where slug='capital-one-venture'), 'insurance', 'travel_emergency_assistance', '24-Hour Travel Assistance', null, null, null, 'insurance', null, 'If your card is lost or stolen, get an emergency replacement card and a cash advance.', 6),
((select id from credit_cards where slug='capital-one-venture'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 7),
-- VentureOne
((select id from credit_cards where slug='capital-one-ventureone'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, null, 'status', null, 'Complimentary Hertz Five Star status.', 1),
((select id from credit_cards where slug='capital-one-ventureone'), 'insurance', 'rental_car_cdw_secondary', 'Auto Rental Collision Damage Waiver', null, null, null, 'insurance', null, 'Coverage for damage from collision or theft on eligible rentals paid with the card.', 2),
((select id from credit_cards where slug='capital-one-ventureone'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 3),
-- Venture X Business
((select id from credit_cards where slug='capital-one-venture-x-business'), 'travel_credit', 'travel_credit_annual', 'Annual Travel Credit', 300, 'USD', null, 'credit', 'annual', '$300 annual credit for bookings through Capital One Business Travel.', 1),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'other', 'other', 'Anniversary Bonus Miles', 10000, 'miles', null, 'earning', 'annual', '10,000 bonus miles every year, starting on your first anniversary.', 2),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', null, 'credit', null, 'Up to $120 statement credit for Global Entry or TSA PreCheck application fee.', 3),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'lounge_access', 'lounge_other', 'Capital One Lounges and Landing', null, null, null, 'lounge', null, 'Access to Capital One Lounge and Landing locations.', 4),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'lounge_access', 'lounge_priority_pass', 'Priority Pass Lounge Access', null, null, null, 'lounge', null, 'Access to 1,300+ Priority Pass lounges worldwide.', 5),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'travel_credit', 'hotel_credit', 'Premier Collection Experience Credit', 100, 'USD', null, 'hotel', 'per_use', '$100 experience credit and premium benefits on every Premier Collection booking.', 6),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'status_conferred', 'status_hertz_presidents_circle', 'Hertz Presidents Circle Status', null, null, null, 'status', null, 'Complimentary Hertz Presidents Circle status.', 7),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'other', 'other', 'Free Employee Cards', null, null, null, 'perk', null, 'Free employee and virtual cards that earn rewards on their spend.', 8),
((select id from credit_cards where slug='capital-one-venture-x-business'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 9),
-- Venture Business
((select id from credit_cards where slug='capital-one-venture-business'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', null, 'credit', null, 'Up to $120 statement credit for Global Entry or TSA PreCheck application fee.', 1),
((select id from credit_cards where slug='capital-one-venture-business'), 'travel_credit', 'hotel_credit', 'Lifestyle Collection Experience Credit', 50, 'USD', null, 'hotel', 'per_use', '$50 experience credit on every Lifestyle Collection booking, plus room upgrades when available.', 2),
((select id from credit_cards where slug='capital-one-venture-business'), 'other', 'other', 'Free Employee Cards', null, null, null, 'perk', null, 'Free employee cards that earn 2X on their spend.', 3),
((select id from credit_cards where slug='capital-one-venture-business'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 4),
-- VentureOne Business
((select id from credit_cards where slug='capital-one-ventureone-business'), 'other', 'other', 'Free Employee Cards', null, null, null, 'perk', null, 'Free employee cards that earn rewards on their spend.', 1),
((select id from credit_cards where slug='capital-one-ventureone-business'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to 15+ Travel Partners', null, null, null, 'earning', null, 'Transfer miles to 15+ airline and hotel loyalty programs, most at 1:1.', 2);

-- ============================================================================
-- (8) Mark all six as freshly extracted (manual authoring) so the refresh queue
--     shows them verified today rather than "never extracted".
-- ============================================================================
insert into credit_card_extractions (card_id, source_url, raw_markdown, markdown_chars, extraction, status, model, saved_at, created_at)
select c.id, c.official_url, 'Manual authoring from official capitalone.com product page (2026-06-15).', 70,
       jsonb_build_object('source','manual','authored_on','2026-06-15'), 'saved', 'manual', now(), now()
from credit_cards c
where c.slug in ('capital-one-venture-x','capital-one-venture','capital-one-ventureone',
   'capital-one-venture-x-business','capital-one-venture-business','capital-one-ventureone-business');
