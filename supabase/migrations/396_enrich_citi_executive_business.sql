-- Enrich Citi AAdvantage Executive + CitiBusiness with benefits missed in the
-- initial scrape (below the fold). Sourced from the official Citi T&C
-- (creditcards.aa.com / citi.com), verified 2026-06-15.

-- Executive: refreshed good_to_know highlighting the credit stack.
update credit_cards set
  good_to_know = E'- Complimentary Admirals Club membership (plus lounge access for authorized users) - the only AAdvantage card that includes it.\n- Up to $360 a year in everyday credits: up to $120 each in Lyft, Grubhub, and Avis/Budget statement credits, plus a Global Entry or TSA PreCheck credit (up to $120 every 4 years).\n- 10X miles on hotels (aadvantagehotels.com) and car rentals (aadvantagecars.com); 4X on American (5X after $150,000 in a calendar year).\n- First checked bag free (you and up to 8 companions) and priority check-in, screening, and boarding (Group 4).\n- Earn up to 20,000 bonus Loyalty Points a year (10,000 at 50,000 and another 10,000 at 90,000), accelerating AAdvantage status.\n- No foreign transaction fees. $595 annual fee; authorized users $175 each.',
  last_verified='2026-06-15', updated_at=now()
where slug='citi-aadvantage-executive';

-- Business: refreshed good_to_know.
update credit_cards set
  good_to_know = E'- First checked bag free (you and up to 4 companions) and preferred boarding (Group 5).\n- 2X miles on American, gas, car rentals, telecom, and cable/satellite.\n- $99 American Airlines companion certificate after you spend $30,000 in a cardmembership year.\n- 25% savings on inflight food, beverage, and Wi-Fi purchases on American.\n- No foreign transaction fees, and the $99 annual fee is waived the first year.\n- Earns Loyalty Points 1:1 toward AAdvantage status.',
  last_verified='2026-06-15', updated_at=now()
where slug='citi-aadvantage-business';

-- Rebuild benefit sets (complete this time).
delete from credit_card_benefits where card_id in (select id from credit_cards where slug in ('citi-aadvantage-executive','citi-aadvantage-business'));

-- Executive
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://creditcards.aa.com/credit-cards/citi-executive-card-american-airlines-direct/', now()
from credit_cards, (values
  ('lounge_access','airline','lounge_admirals_club','Admirals Club Membership','Complimentary Admirals Club membership - the only AAdvantage card that includes it. Authorized users get lounge access too.',null::numeric,null::text,1),
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries for you and up to 8 companions on the same reservation.',null,null,2),
  ('other','airline','priority_boarding','Priority Check-in, Screening & Boarding','Priority check-in, airport screening, and Group 4 boarding on American flights (you and up to 8 companions).',null,null,3),
  ('statement_credit','credit','global_entry_credit','Global Entry / TSA PreCheck Credit','Up to $120 statement credit for Global Entry or TSA PreCheck application fee, every 4 years.',120,'USD',4),
  ('statement_credit','credit','lyft_credit','Up to $120 Lyft Credits','$10 Lyft credit after 3 rides in a calendar month, up to $120 a year.',120,'USD',5),
  ('statement_credit','credit','dining_credit','Up to $120 Grubhub Credit','Up to $10 per monthly statement in Grubhub credits, up to $120 a year.',120,'USD',6),
  ('statement_credit','credit','travel_credit_annual','Up to $120 Avis/Budget Credit','Up to $120 a year in statement credits on prepaid Avis or Budget car rentals.',120,'USD',7),
  ('spend_unlock','airline','other','Up to 20,000 Bonus Loyalty Points','Earn 10,000 bonus Loyalty Points at 50,000 Loyalty Points and another 10,000 at 90,000 in a qualifying year.',null,null,8),
  ('other','airline','other','25% Inflight Savings','25% savings on inflight food and beverage purchases on American flights.',null,null,9),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every AAdvantage base mile from purchases, toward elite status.',null,null,10),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,11)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='citi-aadvantage-executive';

-- Business
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, value_amount, value_unit, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.val, b.unit, b.sort, 'https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/', now()
from credit_cards, (values
  ('other','airline','free_checked_bag','Free First Checked Bag','First checked bag free on domestic American itineraries for you and up to 4 companions on the same reservation.',null::numeric,null::text,1),
  ('other','airline','priority_boarding','Preferred Boarding','Group 5 preferred boarding on American flights for you and up to 4 companions.',null,null,2),
  ('spend_unlock','airline','companion_pass','$99 Companion Certificate','$99 domestic economy companion certificate after you spend $30,000 in a cardmembership year.',99,'USD',3),
  ('other','airline','other','25% Inflight Savings','25% savings on inflight food, beverage, and Wi-Fi purchases on American flights.',null,null,4),
  ('other','airline','other','Loyalty Points','Earn 1 Loyalty Point for every $1 on purchases, toward elite status.',null,null,5),
  ('other',null,'other','No Foreign Transaction Fees','No foreign transaction fees on purchases made outside the US.',null,null,6)
) as b(cat,fam,bt,name,descr,val,unit,sort) where slug='citi-aadvantage-business';
