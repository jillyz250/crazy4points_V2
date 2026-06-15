-- Final completeness pass: add the Amex Assurance protections to Gold (personal +
-- business) and Blue, verified 2026-06-15 against the official Amex card pages.
-- Gold carries Baggage/Car Rental/Extended Warranty/Purchase Protection/Global
-- Assist (no cell phone or trip delay - those start at Platinum). Blue carries
-- Car Rental/Extended Warranty/Purchase Protection/Global Assist (no baggage).

-- Blue
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order) values
((select id from credit_cards where slug='amex-delta-blue'), 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 30),
((select id from credit_cards where slug='amex-delta-blue'), 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 31),
((select id from credit_cards where slug='amex-delta-blue'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 32),
((select id from credit_cards where slug='amex-delta-blue'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', 'insurance', '24/7 emergency coordination when traveling more than 100 miles from home (third-party costs are your responsibility).', 33);

-- Gold (personal) + Gold Business share the same set
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 'insurance', 'Coverage for lost, damaged, or stolen baggage when you buy your fare with the Card.', 30
from credit_cards where slug in ('amex-delta-gold','amex-delta-gold-business');
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 31
from credit_cards where slug in ('amex-delta-gold','amex-delta-gold-business');
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 32
from credit_cards where slug in ('amex-delta-gold','amex-delta-gold-business');
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 33
from credit_cards where slug in ('amex-delta-gold','amex-delta-gold-business');
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', 'insurance', '24/7 emergency coordination when traveling more than 100 miles from home (third-party costs are your responsibility).', 34
from credit_cards where slug in ('amex-delta-gold','amex-delta-gold-business');
