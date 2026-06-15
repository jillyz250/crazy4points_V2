-- Author the new Citi / AAdvantage Globe ($350) card + add the Turo credit
-- missed on Platinum Select. Sourced from official Citi T&C (verified 2026-06-15).

-- ---- Platinum Select: add Up to $180 Turo credit ----
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, 'statement_credit','credit','travel_credit_annual','Up to $180 Turo Credit','Up to $30 in statement credits per completed Turo trip, up to $180 a year (through Oct 18, 2026).',180,'USD',7,'https://creditcards.aa.com/credit-cards/citi-platinum-card-american-airlines-direct/',now()
from credit_cards where slug='citi-aadvantage-platinum-select'
  and not exists (select 1 from credit_card_benefits b2 join credit_cards c2 on c2.id=b2.card_id where c2.slug='citi-aadvantage-platinum-select' and b2.name='Up to $180 Turo Credit');

-- ---- Globe: insert card row ----
insert into credit_cards (
  slug, name, issuer_id, card_type, card_tier,
  currency_program_id, co_brand_program_id,
  annual_fee_usd, foreign_transaction_fee_pct,
  network, network_level, transfer_eligibility,
  official_url, intro, good_to_know,
  is_active, status, benefits_human_curated, requires_manual_paste, last_verified
)
select
  'citi-aadvantage-globe',
  'Citi / AAdvantage Globe World Elite Mastercard',
  (select issuer_id from credit_cards where slug='citi-aadvantage-platinum-select'),
  'personal', 'airline_cobrand',
  '7815e862-c7f7-4106-8890-6b4243df3254', '7815e862-c7f7-4106-8890-6b4243df3254',
  350, 0,
  'mastercard', 'world_elite', 'none',
  'https://creditcards.aa.com/',
  'The Citi / AAdvantage Globe is American''s new mid-tier card ($350), built to replace the old Barclays Aviator Silver. It pairs a deep everyday-credit stack - up to $240 Turo, $100 inflight, and $100 Splurge - with 4 Admirals Club day passes a year, an automatic annual $99 companion certificate, 6X on AAdvantage hotels, and a Flight Streak bonus that hands you Loyalty Points for flying. It slots between the $99 Platinum Select and the $595 Executive.',
  E'- 4 Admirals Club day passes each year (full membership-level access is on the $595 Executive).\n- Automatic annual $99 companion certificate on renewal - no spend requirement, unlike the business card''s $30,000 threshold.\n- Credit stack: up to $240 Turo, up to $100 inflight, up to $100 Splurge (you pick the merchants), and a Global Entry/TSA credit.\n- Earn 3X on American, 6X on AAdvantage hotels, and 2X at restaurants and on transit/rideshare (Rides & Rails).\n- Flight Streak: 5,000 bonus Loyalty Points per 4 American flight segments, up to 15,000 a year toward status.\n- First checked bag free and Group 5 boarding (you and up to 8 companions). No foreign transaction fees. $350 annual fee.',
  true, 'active', true, false, '2026-06-15'
on conflict (slug) do update set
  name=excluded.name, annual_fee_usd=excluded.annual_fee_usd, foreign_transaction_fee_pct=excluded.foreign_transaction_fee_pct,
  network=excluded.network, network_level=excluded.network_level, transfer_eligibility=excluded.transfer_eligibility,
  card_tier=excluded.card_tier, currency_program_id=excluded.currency_program_id, co_brand_program_id=excluded.co_brand_program_id,
  official_url=excluded.official_url, intro=excluded.intro, good_to_know=excluded.good_to_know,
  status=excluded.status, benefits_human_curated=excluded.benefits_human_curated, last_verified=excluded.last_verified, updated_at=now();

-- ---- Globe: child rows (idempotent) ----
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug='citi-aadvantage-globe');
delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug='citi-aadvantage-globe');
delete from credit_card_benefits         where card_id in (select id from credit_cards where slug='citi-aadvantage-globe');

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, is_elevated, baseline_bonus_amount, extras, source_url, last_verified, verified_at)
select id, 90000, 'AAdvantage miles', 5000, 120, true, true, 60000, 'Limited-time elevated offer (standard 60,000).', 'https://creditcards.aa.com/', '2026-06-15', now() from credit_cards where slug='citi-aadvantage-globe';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel',   6.0, '6X miles on hotels booked at aadvantagehotels.com.'),
  ('flights', 3.0, '3X miles on eligible American Airlines purchases.'),
  ('dining',  2.0, '2X miles at restaurants (incl. delivery and takeout).'),
  ('transit', 2.0, '2X miles on Rides & Rails (rideshare, taxis, transit, tolls, parking).'),
  ('base',    1.0, '1X miles on all other purchases.')
) as c(category, multiplier, notes) where slug='citi-aadvantage-globe';

insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://creditcards.aa.com/', now()
from credit_cards, (values
  ('lounge_access','airline','lounge_admirals_club','4 Admirals Club Day Passes','Four Admirals Club day passes each year for the primary cardmember and accompanying adults.',null::numeric,null::text,1),
  ('other','airline','companion_pass','$99 Companion Certificate','Automatic $99 domestic economy companion certificate each year on account renewal (no spend requirement).',99,'USD',2),
  ('statement_credit','credit','travel_credit_annual','Up to $240 Turo Credit','Up to $30 per completed Turo trip, up to $240 a year.',240,'USD',3),
  ('statement_credit','credit','airline_credit','Up to $100 Inflight Credit','Up to $100 a year back on American Airlines inflight purchases.',100,'USD',4),
  ('statement_credit','credit','entertainment_credit','Up to $100 Splurge Credit','Up to $100 a year in statement credits on purchases at merchants you activate.',100,'USD',5),
  ('statement_credit','credit','global_entry_credit','Global Entry / TSA PreCheck Credit','Up to $120 statement credit for Global Entry or TSA PreCheck application fee, every 4 years.',120,'USD',6),
  ('spend_unlock','airline','other','Flight Streak Bonus','5,000 bonus Loyalty Points after every 4 American flight segments, up to 15,000 a year.',null,null,7),
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries for you and up to 8 companions.',null,null,8),
  ('other','airline','priority_boarding','Preferred Boarding','Group 5 preferred boarding on American flights for you and up to 8 companions.',null,null,9),
  ('other','airline','other','AA Vacations 10% Discount','10% discount on non-flight components of American Airlines Vacations packages.',null,null,10),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage base mile from purchases, toward elite status.',null,null,11),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,12)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='citi-aadvantage-globe';

-- ---- Globe: mark extracted/saved ----
delete from credit_card_extractions where model='manual' and card_id in (select id from credit_cards where slug='citi-aadvantage-globe');
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, raw_markdown, saved_at, created_at)
select id, 'https://creditcards.aa.com/', '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb,
  'Authored manually from official Citi T&C (migration 397). Verified 2026-06-15.', now(), now()
from credit_cards where slug='citi-aadvantage-globe';
