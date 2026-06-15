-- Enrich Surpass + Aspire with benefits confirmed in the official Amex T&Cs
-- (verified 2026-06-15) but missed in the comparison-page scrape.

-- Surpass: add National Car Rental Emerald Club Executive status.
delete from credit_card_benefits where name='National Emerald Club Executive'
  and card_id=(select id from credit_cards where slug='amex-hilton-honors-surpass');
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id,'status_conferred','status','status_national_executive_elite','National Emerald Club Executive','Complimentary National Car Rental Emerald Club Executive status.',6,'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-surpass/',now()
from credit_cards where slug='amex-hilton-honors-surpass';

-- Aspire: add the marquee perks missed in the scrape.
delete from credit_card_benefits where card_id=(select id from credit_cards where slug='hilton-honors-aspire')
  and name in ('Global Dining Access by Resy','Cell Phone Protection','Concierge','Trip Delay Insurance','Trip Cancellation & Interruption Insurance','Premium Global Assist Hotline');
insert into credit_card_benefits (card_id, category, benefit_family, benefit_type, name, description, sort_order, source_url, verified_at)
select id, b.cat, b.fam, b.bt, b.name, b.descr, b.sort, 'https://www.americanexpress.com/us/credit-cards/card/hilton-honors-aspire/', now()
from credit_cards, (values
  ('other','perk','other','Global Dining Access by Resy','Exclusive reservations, Priority Notify, and events at participating Resy restaurants.',11),
  ('protection','protection','cellphone_protection','Cell Phone Protection','Cell phone protection (secondary) when you pay your wireless bill with the Card.',12),
  ('other','perk','concierge','Concierge','American Express Concierge for reservations, tickets, and travel requests.',13),
  ('insurance','insurance','trip_delay_insurance','Trip Delay Insurance','Secondary trip delay insurance on eligible travel.',14),
  ('insurance','insurance','trip_cancellation_insurance','Trip Cancellation & Interruption Insurance','Secondary trip cancellation and interruption coverage on eligible travel.',15),
  ('other','insurance','travel_emergency_assistance','Premium Global Assist Hotline','24/7 Premium Global Assist Hotline, including emergency medical transport when coordinated.',16)
) as b(cat,fam,bt,name,descr,sort) where slug='hilton-honors-aspire';
