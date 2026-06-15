-- Author the four Amex Hilton Honors cards (Card, Surpass, Aspire, Business).
-- Sourced from Hilton's official card-comparison page (the loyalty-partner page,
-- plain-HTML SUBs) + Amex pages. Verified 2026-06-15. Hilton points are co-brand
-- earn-only -> transfer_eligibility='none'. All four: 0% FTF (Amex Hilton).
-- NOTE: Business 6X categories + Aspire lounge access pending T&C verification.

-- ============================================ Hilton Honors Card ($0)
update credit_cards set
  intro = 'The no-annual-fee Hilton Honors American Express Card is the easy entry into Hilton: automatic Silver status, 7X points on Hilton stays, and 5X at U.S. restaurants, supermarkets, and gas stations - all for $0. It is the most-awarded no-fee co-brand card, and a low-commitment way to rack up Hilton points on everyday spend.',
  good_to_know = E'- No annual fee, with automatic Hilton Honors Silver status.\n- Spend $20,000 in a calendar year to upgrade to Gold status through the next year.\n- 7X points on Hilton stays; 5X at U.S. restaurants, supermarkets, and gas stations; 3X on everything else.\n- No free weekend night (that starts at the Surpass), but also no fee to carry it.\n- No foreign transaction fees.',
  annual_fee_usd = 0, foreign_transaction_fee_pct = 0,
  network = 'amex', card_tier = 'hotel_cobrand', transfer_eligibility = 'none',
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'amex-hilton-honors';

-- ============================================ Surpass ($0 yr1, then $150)
update credit_cards set
  intro = 'The Hilton Honors American Express Surpass Card is the value sweet spot of the lineup: automatic Gold status, 12X on Hilton, a free weekend night after $15,000 of spend, and up to $200 a year in Hilton statement credits. With a $0 intro annual fee the first year (then $150), Gold''s free breakfast and room upgrades alone can cover the fee for anyone who stays at Hilton a few times a year.',
  good_to_know = E'- Automatic Hilton Honors Gold status (free breakfast/food credit + space-available room upgrades).\n- Free Night Reward after you spend $15,000 in a calendar year.\n- Spend $40,000 in a calendar year to reach Diamond status.\n- Up to $200 a year in Hilton statement credits ($50 per quarter).\n- 12X on Hilton; 6X at U.S. restaurants, supermarkets, and gas stations; 4X on U.S. online retail; 3X on everything else.\n- $0 intro annual fee the first year, then $150. No foreign transaction fees.',
  annual_fee_usd = 150, foreign_transaction_fee_pct = 0,
  network = 'amex', card_tier = 'hotel_cobrand', transfer_eligibility = 'none',
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-surpass/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'amex-hilton-honors-surpass';

-- ============================================ Aspire ($550)
update credit_cards set
  intro = 'The Hilton Honors American Express Aspire Card is Hilton''s top card: automatic Diamond status, 14X on Hilton, a free night every year (plus more after $30,000 and $60,000 of spend), and a deep credit stack - up to $400 in Hilton resort credits, $200 in airline credits, and a CLEAR Plus credit. At $550 the annual credits alone can outrun the fee for anyone who stays at Hilton resorts.',
  good_to_know = E'- Automatic Hilton Honors Diamond status - top-tier breakfast, upgrades, and bonus points.\n- One Free Night Reward every year, plus another after $30,000 and a third after $60,000 of spend in a calendar year.\n- Up to $400 a year in Hilton resort statement credits ($200 semi-annual).\n- Up to $200 a year in airline credits ($50 per quarter) and up to $209 a year toward CLEAR Plus.\n- Up to $100 property credit on 2-night Waldorf Astoria / Conrad stays booked via the Aspire benefit rate.\n- 14X on Hilton; 7X on flights, car rentals, and U.S. restaurants; 3X on everything else.\n- $550 annual fee. No foreign transaction fees.',
  annual_fee_usd = 550, foreign_transaction_fee_pct = 0,
  network = 'amex', card_tier = 'hotel_cobrand', transfer_eligibility = 'none',
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-aspire/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'hilton-honors-aspire';

-- ============================================ Business ($0 yr1, then $195)
update credit_cards set
  intro = 'The Hilton Honors American Express Business Card brings automatic Gold status, 12X on Hilton, free weekend nights, and complimentary National Car Rental Emerald Club Executive status to business owners. With a $0 intro annual fee the first year (then $195), it is a strong pick for a Hilton-loyal business.',
  good_to_know = E'- Automatic Hilton Honors Gold status; spend $40,000 in a calendar year for Diamond.\n- Free Night Reward after you spend $15,000 in a calendar year.\n- Complimentary National Car Rental Emerald Club Executive status.\n- 12X on Hilton; 6X at U.S. restaurants, gas stations, and supermarkets; 3X on everything else (additional 6X business categories - verify on the T&C).\n- $0 intro annual fee the first year, then $195. No foreign transaction fees.',
  annual_fee_usd = 195, foreign_transaction_fee_pct = 0,
  network = 'amex', card_tier = 'hotel_cobrand', transfer_eligibility = 'none',
  official_url = 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-business/',
  benefits_human_curated = true, requires_manual_paste = false, status = 'active', last_verified = '2026-06-15', updated_at = now()
where slug = 'amex-hilton-honors-business';

-- =============================== reset child rows ===============================
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug in ('amex-hilton-honors','amex-hilton-honors-surpass','hilton-honors-aspire','amex-hilton-honors-business'));
delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug in ('amex-hilton-honors','amex-hilton-honors-surpass','hilton-honors-aspire','amex-hilton-honors-business'));
delete from credit_card_benefits         where card_id in (select id from credit_cards where slug in ('amex-hilton-honors','amex-hilton-honors-surpass','hilton-honors-aspire','amex-hilton-honors-business'));

-- =============================== welcome bonuses ===============================
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 100000, 'Hilton Honors points', 2000, 180, true, 'Plus a $100 statement credit. Offer ends 7/29/26.', 'https://www.hilton.com/en/hilton-honors/credit-cards/', '2026-06-15', now() from credit_cards where slug='amex-hilton-honors';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 130000, 'Hilton Honors points', 3000, 180, true, '$0 intro annual fee the first year, then $150. Offer ends 7/29/26.', 'https://www.hilton.com/en/hilton-honors/credit-cards/', '2026-06-15', now() from credit_cards where slug='amex-hilton-honors-surpass';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 175000, 'Hilton Honors points', 6000, 180, true, 'Offer ends 7/29/26.', 'https://www.hilton.com/en/hilton-honors/credit-cards/', '2026-06-15', now() from credit_cards where slug='hilton-honors-aspire';

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 130000, 'Hilton Honors points', 8000, 180, true, '$0 intro annual fee the first year, then $195. Offer ends 7/29/26.', 'https://www.hilton.com/en/hilton-honors/credit-cards/', '2026-06-15', now() from credit_cards where slug='amex-hilton-honors-business';

-- =============================== earn rates ===============================
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel', 7.0, '7X points on purchases made directly with Hilton portfolio hotels and resorts.'),
  ('dining', 5.0, '5X points at U.S. restaurants, U.S. supermarkets, and U.S. gas stations.'),
  ('base', 3.0, '3X points on all other eligible purchases.')
) as c(category, multiplier, notes) where slug='amex-hilton-honors';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel', 12.0, '12X points on purchases made directly with Hilton portfolio hotels and resorts.'),
  ('dining', 6.0, '6X points at U.S. restaurants, U.S. supermarkets, and U.S. gas stations.'),
  ('online_retail', 4.0, '4X points on U.S. online retail purchases.'),
  ('base', 3.0, '3X points on all other eligible purchases.')
) as c(category, multiplier, notes) where slug='amex-hilton-honors-surpass';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel', 14.0, '14X points on purchases made directly with Hilton portfolio hotels and resorts.'),
  ('travel', 7.0, '7X points on flights booked directly or via Amex Travel, car rentals from select companies, and at U.S. restaurants.'),
  ('base', 3.0, '3X points on all other eligible purchases.')
) as c(category, multiplier, notes) where slug='hilton-honors-aspire';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel', 12.0, '12X points on purchases made directly with Hilton portfolio hotels and resorts.'),
  ('dining', 6.0, '6X points at U.S. restaurants, U.S. gas stations, and U.S. supermarkets.'),
  ('base', 3.0, '3X points on all other eligible purchases.')
) as c(category, multiplier, notes) where slug='amex-hilton-honors-business';

-- =============================== benefits ===============================
-- Base
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://www.hilton.com/en/hilton-honors/credit-cards/', now()
from credit_cards, (values
  ('status_conferred','hotel','status_hilton_silver','Hilton Honors Silver Status','Automatic Hilton Honors Silver status.',1),
  ('status_conferred','hotel','status_hilton_gold','Gold Status After $20k Spend','Upgrade to Hilton Honors Gold status after $20,000 in purchases in a calendar year.',2),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',3)
) as b(cat,fam,bt,name,descr,sort) where slug='amex-hilton-honors';

-- Surpass
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://www.hilton.com/en/hilton-honors/credit-cards/', now()
from credit_cards, (values
  ('status_conferred','hotel','status_hilton_gold','Hilton Honors Gold Status','Automatic Hilton Honors Gold status (free breakfast/food credit + room upgrades).',null::numeric,null::text,1),
  ('free_night','hotel','free_night_after_spend','Free Night After $15k','Free Night Reward after $15,000 in purchases in a calendar year.',null,null,2),
  ('status_conferred','hotel','status_hilton_diamond','Diamond After $40k Spend','Upgrade to Hilton Honors Diamond status after $40,000 in purchases in a calendar year.',null,null,3),
  ('statement_credit','hotel','hotel_credit','Up to $200 Hilton Credit','Up to $50 per quarter (up to $200/year) in statement credits on Hilton purchases.',200,'USD',4),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,5)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='amex-hilton-honors-surpass';

-- Aspire
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-aspire/', now()
from credit_cards, (values
  ('status_conferred','hotel','status_hilton_diamond','Hilton Honors Diamond Status','Automatic top-tier Hilton Honors Diamond status.',null::numeric,null::text,1),
  ('free_night','hotel','free_night_award','Annual Free Night Reward','One Free Night Reward every year of Card Membership.',null,null,2),
  ('free_night','hotel','free_night_after_spend','Free Night After $30k','Additional Free Night Reward after $30,000 in purchases in a calendar year.',null,null,3),
  ('free_night','hotel','free_night_after_spend','Free Night After $60k','Additional Free Night Reward after $60,000 in purchases in a calendar year.',null,null,4),
  ('statement_credit','hotel','hotel_credit','Up to $400 Hilton Resort Credit','Up to $200 semi-annually (up to $400/year) in statement credits at participating Hilton resorts.',400,'USD',5),
  ('statement_credit','airline','airline_credit','Up to $200 Airline Credit','Up to $50 per quarter (up to $200/year) in flight statement credits.',200,'USD',6),
  ('statement_credit','credit','clear_credit','CLEAR Plus Credit','Up to $209/year in statement credits toward a CLEAR Plus membership.',209,'USD',7),
  ('statement_credit','hotel','hotel_credit','$100 Waldorf/Conrad Credit','Up to $100 property credit on 2-night stays at Waldorf Astoria / Conrad via the Aspire benefit rate.',100,'USD',8),
  ('status_conferred','status','status_national_executive_elite','National Emerald Club Executive','Complimentary National Car Rental Emerald Club Executive status.',null,null,9),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,10)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='hilton-honors-aspire';

-- Business
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-business/', now()
from credit_cards, (values
  ('status_conferred','hotel','status_hilton_gold','Hilton Honors Gold Status','Automatic Hilton Honors Gold status.',1),
  ('free_night','hotel','free_night_after_spend','Free Night After $15k','Free Night Reward after $15,000 in purchases in a calendar year.',2),
  ('status_conferred','hotel','status_hilton_diamond','Diamond After $40k Spend','Upgrade to Hilton Honors Diamond status after $40,000 in purchases in a calendar year.',3),
  ('status_conferred','status','status_national_executive_elite','National Emerald Club Executive','Complimentary National Car Rental Emerald Club Executive status.',4),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',5)
) as b(cat,fam,bt,name,descr,sort) where slug='amex-hilton-honors-business';

-- =============================== mark extracted/saved ===============================
delete from credit_card_extractions where model='manual' and card_id in (select id from credit_cards where slug in ('amex-hilton-honors','amex-hilton-honors-surpass','hilton-honors-aspire','amex-hilton-honors-business'));
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, raw_markdown, saved_at, created_at)
select c.id, coalesce(c.official_url,'https://www.hilton.com/en/hilton-honors/credit-cards/'), '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb,
  'Authored manually from Hilton + Amex official pages (migration 400). Verified 2026-06-15.', now(), now()
from credit_cards c where c.slug in ('amex-hilton-honors','amex-hilton-honors-surpass','hilton-honors-aspire','amex-hilton-honors-business');
