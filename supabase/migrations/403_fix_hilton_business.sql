-- Correct the Hilton Honors Business card from its official Amex T&C
-- (verified 2026-06-15). The comparison-page scrape misled the first pass:
--  - Earn is 12X Hilton + 5X on all other purchases (first $100k/yr, then 3X) -
--    NOT the 6X category structure (that was Surpass bleeding in).
--  - The card has NO Free Night Reward (removed); its perk is the $240 Hilton
--    credit ($60/quarter), which was missing.
update credit_cards set
  intro = 'The Hilton Honors American Express Business Card pairs automatic Gold status with strong flat-rate earning for businesses: 12X on Hilton and 5X on everything else for the first $100,000 each calendar year (3X after). It adds up to $240 a year in Hilton statement credits and complimentary National Car Rental Emerald Club Executive status. With a $0 intro annual fee the first year (then $195), it is a clean pick for a Hilton-loyal business with heavy general spend.',
  good_to_know = E'- Automatic Hilton Honors Gold status; spend $40,000 in a calendar year for Diamond.\n- Up to $240 a year in Hilton statement credits ($60 per quarter).\n- Complimentary National Car Rental Emerald Club Executive status.\n- 12X on Hilton; 5X on all other purchases for the first $100,000 each calendar year, then 3X.\n- $0 intro annual fee the first year, then $195. No foreign transaction fees.',
  last_verified='2026-06-15', updated_at=now()
where slug='amex-hilton-honors-business';

delete from credit_card_earn_rates where card_id=(select id from credit_cards where slug='amex-hilton-honors-business');
insert into credit_card_earn_rates (card_id, category, multiplier, notes)
select id, c.category, c.multiplier, c.notes from credit_cards, (values
  ('hotel', 12.0, '12X points on eligible Hilton purchases (direct bookings + on-property charges).'),
  ('base', 5.0, '5X points on all other purchases for the first $100,000 each calendar year, then 3X.')
) as c(category, multiplier, notes) where slug='amex-hilton-honors-business';

delete from credit_card_benefits where card_id=(select id from credit_cards where slug='amex-hilton-honors-business');
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/hilton-honors/', now()
from credit_cards, (values
  ('status_conferred','hotel','status_hilton_gold','Hilton Honors Gold Status','Automatic Hilton Honors Gold status.',null::numeric,null::text,1),
  ('statement_credit','hotel','hotel_credit','Up to $240 Hilton Credit','Up to $60 per quarter (up to $240/year) in statement credits on Hilton purchases.',240,'USD',2),
  ('status_conferred','hotel','status_hilton_diamond','Diamond After $40k Spend','Upgrade to Hilton Honors Diamond status after $40,000 in purchases in a calendar year.',null,null,3),
  ('status_conferred','status','status_national_executive_elite','National Emerald Club Executive','Complimentary National Car Rental Emerald Club Executive status.',null,null,4),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,5)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='amex-hilton-honors-business';
