-- Author the three Barclays JetBlue cards (Card, Plus, Business).
-- All data sourced from official issuer pages:
--   JetBlue comparison page: https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison
--   Barclays card pages:     https://cards.barclaycardus.com/banking/cards/jetblue-card|jetblue-plus-card|jetblue-business-card/
-- Verified 2026-06-15. ASCII-only. TrueBlue points are a co-brand earning
-- currency (not transferable out) -> transfer_eligibility = 'none'.
-- NOTE: 0% foreign transaction fee confirmed on Card + Plus from Barclays pages;
-- Business FTF set to 0 (family-consistent) - flag for spot-check.

-- ============================================================ JetBlue Card ($0)
update credit_cards set
  intro = 'The JetBlue Card is the no-annual-fee way into the TrueBlue ecosystem. It earns 3X points on JetBlue purchases and 2X at restaurants and grocery stores, with no foreign transaction fees - a low-commitment pick for occasional JetBlue flyers who still want to rack up TrueBlue points on everyday spend. The trade-off versus the Plus card is no free checked bag and no anniversary points.',
  good_to_know = E'- No annual fee, so the points you earn on everyday spend are pure upside.\n- 50% off eligible inflight food and drink on JetBlue-operated flights.\n- No free checked bag - if you check bags, the Plus card''s free first bag usually outweighs its $99 fee in a single round trip.\n- No foreign transaction fees, which is unusual for a no-fee card.\n- TrueBlue points do not expire and have no blackout dates.',
  annual_fee_usd = 0,
  foreign_transaction_fee_pct = 0,
  network = 'mastercard',
  network_level = 'world',
  card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://cards.barclaycardus.com/banking/cards/jetblue-card/',
  benefits_human_curated = true,
  requires_manual_paste = false,
  status = 'active',
  last_verified = '2026-06-15',
  updated_at = now()
where slug = 'barclays-jetblue';

-- ======================================================= JetBlue Plus Card ($99)
update credit_cards set
  intro = 'The JetBlue Plus Card is the workhorse JetBlue co-brand: a free first checked bag, 6X points on JetBlue spend, 5,000 anniversary points each year, and 10% of your points back on award flights. For anyone who flies JetBlue even a couple of times a year and checks a bag, the free-bag benefit alone tends to cover the $99 annual fee. Every purchase also earns toward Mosaic elite status.',
  good_to_know = E'- Free first checked bag for you and up to 3 companions on the same reservation - often pays the $99 fee back in one round trip.\n- 6X points on JetBlue, JetBlue Vacations, and TrueBlue Travel purchases.\n- 5,000 anniversary bonus points each year after your account anniversary.\n- Get 10% of your points back after you redeem for and travel on a JetBlue-operated award flight.\n- Every purchase earns toward Mosaic elite status.\n- No foreign transaction fees.\n- The 60,000-point welcome offer requires paying the $99 annual fee within the first 90 days, on top of the $1,000 spend.',
  annual_fee_usd = 99,
  foreign_transaction_fee_pct = 0,
  network = 'mastercard',
  network_level = 'world_elite',
  card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://cards.barclaycardus.com/banking/cards/jetblue-plus-card/',
  benefits_human_curated = true,
  requires_manual_paste = false,
  status = 'active',
  last_verified = '2026-06-15',
  updated_at = now()
where slug = 'barclays-jetblue-plus';

-- =================================================== JetBlue Business Card ($99)
update credit_cards set
  intro = 'The JetBlue Business Card brings the Plus card''s best perks - free first checked bag, 6X on JetBlue, 5,000 anniversary points, and 10% points back on awards - to business owners, swapping the 2X grocery category for 2X at office supply stores and adding Group 3 boarding. For a JetBlue-loyal small business that checks bags, the $99 fee is easy to justify.',
  good_to_know = E'- Free first checked bag for you and up to 3 companions on JetBlue-operated flights.\n- Group 3 boarding for you and up to 4 travel companions.\n- 6X on JetBlue spend; 2X at restaurants and office supply stores (note: office supply, not grocery like the personal Plus card).\n- 5,000 anniversary bonus points each year after your account anniversary.\n- Get 10% of your points back after you redeem for and travel on a JetBlue-operated award flight.\n- No foreign transaction fees.\n- The 50,000-point welcome offer requires $2,000 spend plus paying the $99 annual fee within the first 90 days.',
  annual_fee_usd = 99,
  foreign_transaction_fee_pct = 0,
  network = 'mastercard',
  network_level = 'world_elite',
  card_tier = 'airline_cobrand',
  transfer_eligibility = 'none',
  official_url = 'https://cards.barclaycardus.com/banking/cards/jetblue-business-card/',
  benefits_human_curated = true,
  requires_manual_paste = false,
  status = 'active',
  last_verified = '2026-06-15',
  updated_at = now()
where slug = 'barclays-jetblue-business';

-- =============================== reset child rows (idempotent) ===============================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug in ('barclays-jetblue','barclays-jetblue-plus','barclays-jetblue-business'));
delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug in ('barclays-jetblue','barclays-jetblue-plus','barclays-jetblue-business'));
delete from credit_card_benefits         where card_id in (select id from credit_cards where slug in ('barclays-jetblue','barclays-jetblue-plus','barclays-jetblue-business'));

-- =============================== welcome bonuses ===============================
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 10000, 'TrueBlue points', 1000, 90, true, null, 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', '2026-06-15', now() from credit_cards where slug='barclays-jetblue';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 60000, 'TrueBlue points', 1000, 90, true, 'Must also pay the $99 annual fee in full within the first 90 days.', 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', '2026-06-15', now() from credit_cards where slug='barclays-jetblue-plus';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 50000, 'TrueBlue points', 2000, 90, true, 'Must also pay the $99 annual fee in full within the first 90 days.', 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', '2026-06-15', now() from credit_cards where slug='barclays-jetblue-business';

-- =============================== earn rates ===============================
-- JetBlue Card
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('flights', 3.0, '3X points per $1 on eligible JetBlue, JetBlue Vacations, and TrueBlue Travel purchases.'),
  ('dining',  2.0, '2X points per $1 at restaurants.'),
  ('grocery', 2.0, '2X points per $1 at eligible grocery stores.'),
  ('base',    1.0, '1X points per $1 on all other purchases.')
) as c(category, multiplier, notes) where slug='barclays-jetblue';

-- JetBlue Plus Card
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('flights', 6.0, '6X points per $1 on eligible JetBlue, JetBlue Vacations, and TrueBlue Travel purchases.'),
  ('dining',  2.0, '2X points per $1 at restaurants.'),
  ('grocery', 2.0, '2X points per $1 at eligible grocery stores.'),
  ('base',    1.0, '1X points per $1 on all other purchases.')
) as c(category, multiplier, notes) where slug='barclays-jetblue-plus';

-- JetBlue Business Card
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('flights',       6.0, '6X points per $1 on eligible JetBlue, JetBlue Vacations, and TrueBlue Travel purchases.'),
  ('dining',        2.0, '2X points per $1 at restaurants.'),
  ('office_supply', 2.0, '2X points per $1 at office supply stores.'),
  ('base',          1.0, '1X points per $1 on all other purchases.')
) as c(category, multiplier, notes) where slug='barclays-jetblue-business';

-- =============================== benefits ===============================
-- JetBlue Card
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.category, b.fam, b.btype, b.name, b.descr, b.sort, 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', now()
from credit_cards, (values
  ('other','airline','other','50% Inflight Savings','50% savings on eligible inflight food and drink purchases on JetBlue-operated flights.',1),
  ('other','airline','other','Earn Toward Mosaic','Every purchase earns toward JetBlue Mosaic elite status.',2),
  ('other','airline','other','Points Payback','Redeem points for a statement credit on purchases of $25 or more.',3),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',4)
) as b(category,fam,btype,name,descr,sort) where slug='barclays-jetblue';

-- JetBlue Plus Card
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.category, b.fam, b.btype, b.name, b.descr, b.sort, 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', now()
from credit_cards, (values
  ('other','airline','free_checked_bag','Free First Checked Bag','Free first checked bag for the primary cardmember and up to 3 travel companions on JetBlue-operated flights when you pay with the card.',1),
  ('other','airline','other','5,000 Anniversary Bonus Points','Earn 5,000 bonus points every year after your account anniversary.',2),
  ('other','airline','other','10% Points Back on Award Flights','Get 10% of your points back after you redeem for and travel on a JetBlue-operated award flight.',3),
  ('other','airline','other','Earn Toward Mosaic','Every purchase earns toward JetBlue Mosaic elite status.',4),
  ('statement_credit','credit','travel_credit_annual','JetBlue Vacations Statement Credit','$100 statement credit after a JetBlue Vacations package of $100 or more. Limit one per calendar year.',5),
  ('other','airline','other','Points Payback','Redeem points for a statement credit on purchases of $25 or more.',6),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',7)
) as b(category,fam,btype,name,descr,sort) where slug='barclays-jetblue-plus';

-- JetBlue Business Card
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.category, b.fam, b.btype, b.name, b.descr, b.sort, 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', now()
from credit_cards, (values
  ('other','airline','free_checked_bag','Free First Checked Bag','Free first checked bag for the primary cardmember and up to 3 travel companions on JetBlue-operated flights when you pay with the card.',1),
  ('other','airline','priority_boarding','Group 3 Boarding','Group 3 boarding on JetBlue-operated flights for the primary cardmember and up to 4 eligible travel companions.',2),
  ('other','airline','other','5,000 Anniversary Bonus Points','Earn 5,000 bonus points every year after your account anniversary.',3),
  ('other','airline','other','10% Points Back on Award Flights','Get 10% of your points back after you redeem for and travel on a JetBlue-operated award flight.',4),
  ('statement_credit','credit','travel_credit_annual','JetBlue Vacations Statement Credit','$100 statement credit after a JetBlue Vacations package of $100 or more. Limit one per calendar year.',5),
  ('other','airline','other','Points Payback','Redeem points for a statement credit on purchases of $25 or more.',6),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',7)
) as b(category,fam,btype,name,descr,sort) where slug='barclays-jetblue-business';
