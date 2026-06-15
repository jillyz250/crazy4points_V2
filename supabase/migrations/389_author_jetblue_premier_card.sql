-- Add + author the JetBlue Premier Card (Barclays), launched 2025 - the 4th
-- JetBlue card, not previously in the DB.
-- Sourced from official issuer pages (verified 2026-06-15):
--   https://cards.barclaycardus.com/banking/cards/jetblue-premier-card/
--   https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison
-- TrueBlue is co-brand earn-only -> transfer_eligibility='none'.
-- barclays issuer id: fbf8639f-f920-463f-aac3-80306c1b6a32
-- JetBlue TrueBlue program id: 9fe2600c-1adf-4561-9d95-308f634e943f

insert into credit_cards (
  slug, name, issuer_id, card_type, card_tier,
  currency_program_id, co_brand_program_id,
  annual_fee_usd, authorized_user_fee_usd, foreign_transaction_fee_pct,
  network, network_level, transfer_eligibility,
  official_url, intro, good_to_know,
  is_active, status, benefits_human_curated, requires_manual_paste, last_verified
) values (
  'barclays-jetblue-premier',
  'JetBlue Premier Card',
  'fbf8639f-f920-463f-aac3-80306c1b6a32',
  'personal',
  'airline_cobrand',
  '9fe2600c-1adf-4561-9d95-308f634e943f',
  '9fe2600c-1adf-4561-9d95-308f634e943f',
  499, 150, 0,
  'mastercard', 'world_elite', 'none',
  'https://cards.barclaycardus.com/banking/cards/jetblue-premier-card/',
  'The JetBlue Premier Card is Barclays'' premium JetBlue card, launched in 2025. It stacks lounge access (Priority Pass plus JetBlue''s own BlueHouse), a Global Entry / TSA PreCheck credit, up to $300 in annual TrueBlue Travel credits, and a 25-tile Mosaic head start on top of the usual JetBlue perks - free checked bag, 6X on JetBlue, and 15% points back on awards. It is built for frequent JetBlue flyers who want lounge access and a fast track to Mosaic status; the $499 fee (plus $150 per authorized user) only makes sense if you will actually use the lounge and travel credits.',
  E'- $499 annual fee, plus $150 for each authorized user - this is a premium card, not a casual pickup.\n- Lounge access two ways: Priority Pass (1,800+ lounges worldwide) and complimentary BlueHouse access on eligible fares.\n- Up to $300 a year in statement credits on TrueBlue Travel bookings, plus a Global Entry or TSA PreCheck credit (up to $120 every 4 years).\n- Annual 25-tile bonus fast-tracks you toward Mosaic elite status.\n- 15% of your points back after you redeem for and travel on a JetBlue-operated award flight - the richest rebate in the JetBlue lineup.\n- Companion pass statement credits: up to $500 after $15,000 spend and up to $1,500 more after $75,000 spend in a calendar year.\n- The 100,000-point welcome offer requires $5,000 spend plus paying the $499 fee within the first 90 days.\n- No foreign transaction fees.',
  true, 'active', true, false, '2026-06-15'
)
on conflict (slug) do update set
  name = excluded.name, issuer_id = excluded.issuer_id, card_type = excluded.card_type,
  card_tier = excluded.card_tier, currency_program_id = excluded.currency_program_id,
  co_brand_program_id = excluded.co_brand_program_id, annual_fee_usd = excluded.annual_fee_usd,
  authorized_user_fee_usd = excluded.authorized_user_fee_usd,
  foreign_transaction_fee_pct = excluded.foreign_transaction_fee_pct, network = excluded.network,
  network_level = excluded.network_level, transfer_eligibility = excluded.transfer_eligibility,
  official_url = excluded.official_url, intro = excluded.intro, good_to_know = excluded.good_to_know,
  is_active = excluded.is_active, status = excluded.status,
  benefits_human_curated = excluded.benefits_human_curated,
  requires_manual_paste = excluded.requires_manual_paste, last_verified = excluded.last_verified,
  updated_at = now();

-- child rows (idempotent)
delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug='barclays-jetblue-premier');
delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug='barclays-jetblue-premier');
delete from credit_card_benefits         where card_id in (select id from credit_cards where slug='barclays-jetblue-premier');

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_days, is_current, extras, source_url, last_verified, verified_at)
select id, 100000, 'TrueBlue points', 5000, 90, true, 'Must also pay the $499 annual fee in full within the first 90 days.', 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison', '2026-06-15', now() from credit_cards where slug='barclays-jetblue-premier';

insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('flights', 6.0, '6X points per $1 on eligible JetBlue, JetBlue Vacations, and TrueBlue Travel purchases.'),
  ('dining',  2.0, '2X points per $1 at restaurants.'),
  ('grocery', 2.0, '2X points per $1 at eligible grocery stores.'),
  ('base',    1.0, '1X points per $1 on all other purchases.')
) as c(category, multiplier, notes) where slug='barclays-jetblue-premier';

insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.category, b.fam, b.btype, b.name, b.descr, b.sort, 'https://cards.barclaycardus.com/banking/cards/jetblue-premier-card/', now()
from credit_cards, (values
  ('lounge_access','airline','lounge_priority_pass','Priority Pass Lounge Access','Access to 1,800+ Priority Pass lounges and travel experiences across 700+ airports in 146 countries.',1),
  ('lounge_access','airline','lounge_other','BlueHouse Access','Complimentary access to JetBlue''s BlueHouse for cardmembers with eligible fares.',2),
  ('spend_unlock','airline','companion_pass','Companion Pass Statement Credits','Up to $2,000 in companion pass statement credits: up to $500 after $15,000 in purchases and up to $1,500 more after $75,000 in purchases in a calendar year.',3),
  ('statement_credit','credit','travel_credit_annual','TrueBlue Travel Credit','Up to $300 in statement credits on TrueBlue Travel purchases per calendar year.',4),
  ('statement_credit','credit','global_entry_credit','Global Entry / TSA PreCheck Credit','Up to $120 application fee statement credit every 4 years for Global Entry or TSA PreCheck.',5),
  ('other','airline','free_checked_bag','Free First Checked Bag','Free first checked bag for the primary cardmember and up to 3 travel companions on JetBlue-operated flights.',6),
  ('other','airline','priority_boarding','Group 3 Boarding','Group 3 boarding for the primary cardmember, authorized users, and up to 4 eligible travel companions.',7),
  ('other','airline','other','25-Tile Mosaic Bonus','Annual 25-tile bonus after year-end to fast-track Mosaic status for the next year.',8),
  ('other','airline','other','15% Points Back on Award Flights','Get 15% of your points back after you redeem for and travel on a JetBlue-operated award flight.',9),
  ('other','airline','other','5,000 Anniversary Bonus Points','Earn 5,000 bonus points every year after your account anniversary.',10),
  ('other','airline','other','50% Inflight Savings','50% savings on eligible inflight food and drink on JetBlue-operated flights.',11),
  ('other','airline','other','Points Payback','Redeem points for a statement credit on purchases of $25 or more.',12),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',13)
) as b(category,fam,btype,name,descr,sort) where slug='barclays-jetblue-premier';
