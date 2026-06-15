-- Corrections after verifying Double Cash + Citi Strata against the full official
-- pages + pricing/terms (pasted 2026-06-15). FX 3% on both was already correct.

-- Double Cash: add the 0% intro APR (balance transfers only).
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='citi-double-cash'), 'other', 'other', '0% Intro APR for 18 Months (Balance Transfers Only)', null, null, 'perk', null, '0% intro APR on balance transfers for 18 months (purchases are NOT included), then a variable 17.49%-27.49% APR. Intro balance transfer fee is 3% (min $5) for transfers in the first 4 months, then 5%.', 4);

-- Strata: no authorized-user fee.
update credit_cards set
  authorized_user_fee_usd = 0,
  authorized_user_fee_structure = 'No authorized user fee.',
  last_verified = current_date, updated_at = now()
where slug = 'citi-strata';

-- Strata: replace the unconfirmed "World Elite" benefit with the documented Mastercard ID Theft Protection.
update credit_card_benefits b set
  name = 'Mastercard ID Theft Protection',
  description = 'Free identity-theft monitoring and alerts through Mastercard (enrollment required).',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='citi-strata' and b.name='World Elite Mastercard Benefits';

-- Strata: enrich the self-select benefit with the default + quarterly-change detail.
update credit_card_benefits b set
  description = 'Pick one 3X category - fitness clubs, select streaming, live entertainment, salons/barbers/cosmetic stores, or pet supply stores. Defaults to Select Streaming Services; you can change it once per calendar quarter at citi.com/selfselect.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='citi-strata' and b.name='Self-Select 3X Category';

-- Strata: add the documented Choose-Your-Payment-Due-Date convenience perk.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='citi-strata'), 'other', 'other', 'Choose Your Payment Due Date', null, null, 'perk', null, 'Pick a payment due date at the beginning, middle, or end of the month.', 6);
