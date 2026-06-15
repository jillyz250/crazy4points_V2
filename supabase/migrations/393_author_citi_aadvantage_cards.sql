-- Author the four Citi AAdvantage cards (MileUp, Platinum Select, Executive,
-- CitiBusiness). Citi became American's exclusive AAdvantage issuer in 2026.
-- Sourced from official pages (verified 2026-06-15):
--   creditcards.aa.com (AA/Citi co-brand pages) + citi.com product pages.
-- AAdvantage miles are co-brand earn-only -> transfer_eligibility='none'.
-- NOTE: a 5th card, Citi AAdvantage Globe ($350), is new and not yet in the DB.

-- ===================================================== MileUp ($0)
update credit_cards set
  intro = 'The AAdvantage MileUp Card is American''s no-annual-fee entry card, issued by Citi (which became American''s exclusive card partner in 2026). It earns 2X miles at grocery stores and on American purchases, plus 25% back on inflight purchases. There is no free checked bag and it carries a 3% foreign transaction fee, so it is best as a domestic, low-commitment way to earn AAdvantage miles and Loyalty Points toward status.',
  good_to_know = E'- No annual fee - a simple way to earn AAdvantage miles on everyday spend.\n- 2X miles at grocery stores (including delivery) and on eligible American Airlines purchases.\n- 25% savings on inflight food and drink purchases.\n- No free checked bag, and a 3% foreign transaction fee - keep this card for domestic spend.\n- Earns Loyalty Points 1:1 with miles, counting toward AAdvantage elite status.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 3,
  network = 'mastercard', network_level = 'world', card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://creditcards.aa.com/credit-cards/citi-mileup-card-american-airlines-direct/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'citi-aadvantage-mileup';

-- ===================================================== Platinum Select ($99, waived yr1)
update credit_cards set
  intro = 'The Citi / AAdvantage Platinum Select is the workhorse American Airlines card: a free first checked bag, preferred boarding, and 2X miles on dining, gas, and American purchases. The $99 annual fee is waived the first year, and for anyone who checks a bag on American even once or twice a year, the free-bag benefit alone tends to cover it. It also earns Loyalty Points toward elite status.',
  good_to_know = E'- First checked bag free on domestic American itineraries for you and up to 4 companions on the same reservation - usually pays the $99 fee back fast.\n- 2X miles at restaurants, gas stations, and on eligible American Airlines purchases.\n- Preferred boarding on American flights.\n- $125 American Airlines flight discount after you spend $20,000 in a card membership year.\n- No foreign transaction fees, and the $99 annual fee is waived the first year.\n- Earns Loyalty Points 1:1 toward AAdvantage status.\n- The 80,000-mile welcome offer is a limited-time elevated bonus (the standard offer is 50,000).',
  annual_fee_usd = 99, foreign_transaction_fee_pct = 0,
  network = 'mastercard', network_level = 'world_elite', card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://creditcards.aa.com/credit-cards/citi-platinum-card-american-airlines-direct/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'citi-aadvantage-platinum-select';

-- ===================================================== Executive ($595)
update credit_cards set
  intro = 'The Citi / AAdvantage Executive is American''s premium card and the only one that comes with a full Admirals Club membership - worth hundreds on its own. It earns 4X on American purchases (5X after $150,000 in a year) and 10X on hotels and cars booked through AAdvantage''s travel portals. At $595 (plus $175 per authorized user), it makes sense if you value Admirals Club access and fly American often.',
  good_to_know = E'- Complimentary Admirals Club membership - the only AAdvantage card that includes it.\n- 10X miles on hotels booked at aadvantagehotels.com and cars at aadvantagecars.com; 4X on eligible American purchases (5X after $150,000 in a calendar year).\n- First checked bag free on domestic American itineraries.\n- No foreign transaction fees.\n- $595 annual fee; authorized users are $175 each (up to 3, then $175 each thereafter).\n- Earns Loyalty Points 1:1 toward AAdvantage status.',
  annual_fee_usd = 595, authorized_user_fee_usd = 175, foreign_transaction_fee_pct = 0,
  network = 'mastercard', network_level = 'world_elite', card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://creditcards.aa.com/credit-cards/citi-executive-card-american-airlines-direct/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'citi-aadvantage-executive';

-- ===================================================== CitiBusiness ($99, waived yr1)
update credit_cards set
  intro = 'The CitiBusiness / AAdvantage Platinum Select brings the personal Platinum Select''s best perks - free first checked bag, preferred boarding, 2X on American - to business owners, and adds 2X on gas, car rentals, telecom, and cable/satellite. The $99 annual fee is waived the first year, making it an easy pick for a business that flies American and checks bags.',
  good_to_know = E'- First checked bag free on domestic American itineraries.\n- 2X miles on eligible American Airlines purchases; 2X at gas stations, car rental merchants, telecommunications merchants, and cable/satellite providers.\n- No foreign transaction fees, and the $99 annual fee is waived the first year.\n- Earns Loyalty Points 1:1 toward AAdvantage status.\n- 65,000-mile welcome offer after $4,000 in purchases in the first 4 months.',
  annual_fee_usd = 99, foreign_transaction_fee_pct = 0,
  network = 'mastercard', network_level = 'world_elite', card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'citi-aadvantage-business';

-- =============================== reset child rows ===============================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug in ('citi-aadvantage-mileup','citi-aadvantage-platinum-select','citi-aadvantage-executive','citi-aadvantage-business'));
delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug in ('citi-aadvantage-mileup','citi-aadvantage-platinum-select','citi-aadvantage-executive','citi-aadvantage-business'));
delete from credit_card_benefits         where card_id in (select id from credit_cards where slug in ('citi-aadvantage-mileup','citi-aadvantage-platinum-select','citi-aadvantage-executive','citi-aadvantage-business'));

-- =============================== welcome bonuses ===============================
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 15000, 'AAdvantage miles', 500, 90, true, null, 'https://creditcards.aa.com/credit-cards/citi-mileup-card-american-airlines-direct/', '2026-06-15', now() from credit_cards where slug='citi-aadvantage-mileup';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, is_elevated, baseline_bonus_amount, extras, source_url, last_verified, verified_at)
select id, 80000, 'AAdvantage miles', 3500, 120, true, true, 50000, 'Limited-time elevated offer (standard 50,000). $0 intro annual fee the first year, then $99.', 'https://creditcards.aa.com/credit-cards/citi-platinum-card-american-airlines-direct/', '2026-06-15', now() from credit_cards where slug='citi-aadvantage-platinum-select';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 70000, 'AAdvantage miles', 7000, 90, true, null, 'https://creditcards.aa.com/credit-cards/citi-executive-card-american-airlines-direct/', '2026-06-15', now() from credit_cards where slug='citi-aadvantage-executive';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 65000, 'AAdvantage miles', 4000, 120, true, '$0 intro annual fee the first year, then $99.', 'https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/', '2026-06-15', now() from credit_cards where slug='citi-aadvantage-business';

-- =============================== earn rates ===============================
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('grocery', 2.0, '2X miles at grocery stores, including grocery delivery services.'),
  ('flights', 2.0, '2X miles on eligible American Airlines purchases.'),
  ('base',    1.0, '1X miles on all other purchases.')
) as c(category, multiplier, notes) where slug='citi-aadvantage-mileup';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('dining',  2.0, '2X miles at restaurants.'),
  ('gas',     2.0, '2X miles at gas stations.'),
  ('flights', 2.0, '2X miles on eligible American Airlines purchases.'),
  ('base',    1.0, '1X miles on all other purchases.')
) as c(category, multiplier, notes) where slug='citi-aadvantage-platinum-select';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel',   10.0, '10X miles on hotels (aadvantagehotels.com) and car rentals (aadvantagecars.com).'),
  ('flights',  4.0, '4X miles on eligible American Airlines purchases (5X after $150,000 in a calendar year).'),
  ('base',     1.0, '1X miles on all other purchases.')
) as c(category, multiplier, notes) where slug='citi-aadvantage-executive';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('flights',      2.0, '2X miles on eligible American Airlines purchases.'),
  ('gas',          2.0, '2X miles at gas stations and car rental merchants.'),
  ('telecom',      2.0, '2X miles at telecommunications merchants and cable/satellite providers.'),
  ('base',         1.0, '1X miles on all other purchases.')
) as c(category, multiplier, notes) where slug='citi-aadvantage-business';

-- =============================== benefits ===============================
-- MileUp
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://creditcards.aa.com/credit-cards/citi-mileup-card-american-airlines-direct/', now()
from credit_cards, (values
  ('other','airline','other','25% Inflight Savings','25% savings on inflight food and drink purchases on American Airlines flights.',1),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage mile from purchases, toward elite status.',2)
) as b(cat,fam,bt,name,descr,sort) where slug='citi-aadvantage-mileup';

-- Platinum Select
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://creditcards.aa.com/credit-cards/citi-platinum-card-american-airlines-direct/', now()
from credit_cards, (values
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries for you and up to 4 companions on the same reservation.',1),
  ('other','airline','priority_boarding','Preferred Boarding','Preferred boarding on American Airlines flights.',2),
  ('spend_unlock','airline','flight_credit','$125 American Airlines Flight Discount','$125 American Airlines flight discount after you spend $20,000 in a card membership year.',3),
  ('other','airline','other','25% Inflight Savings','25% savings on inflight food and drink purchases on American Airlines flights.',4),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage mile from purchases, toward elite status.',5),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',6)
) as b(cat,fam,bt,name,descr,sort) where slug='citi-aadvantage-platinum-select';

-- Executive
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://creditcards.aa.com/credit-cards/citi-executive-card-american-airlines-direct/', now()
from credit_cards, (values
  ('lounge_access','airline','lounge_admirals_club','Admirals Club Membership','Complimentary Admirals Club membership - the only AAdvantage card that includes it.',1),
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries.',2),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage mile from purchases, toward elite status.',3),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',4)
) as b(cat,fam,bt,name,descr,sort) where slug='citi-aadvantage-executive';

-- CitiBusiness
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/', now()
from credit_cards, (values
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries.',1),
  ('other','airline','priority_boarding','Preferred Boarding','Preferred boarding on American Airlines flights.',2),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage mile from purchases, toward elite status.',3),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',4)
) as b(cat,fam,bt,name,descr,sort) where slug='citi-aadvantage-business';
