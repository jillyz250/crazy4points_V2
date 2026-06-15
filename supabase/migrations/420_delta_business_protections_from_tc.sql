-- Add the Amex protection suite + premium perks documented in the official Delta
-- business-card benefit T&Cs (pasted 2026-06-15) for Platinum Business and
-- Reserve Business. Confirms migration 419's $250 Reserve Business Delta Stays
-- inference was correct. Protections per the per-card benefit-terms disclosures.

-- Platinum Business protections
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order) values
((select id from credit_cards where slug='amex-delta-platinum-business'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 'protection', 'Reimbursement for a stolen or damaged phone when you pay your wireless bill with the Card (secondary; limits apply).', 30),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 'insurance', 'Secondary trip delay coverage when you buy your fare with the Card; limits apply.', 31),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 32),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 33),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 'insurance', 'Coverage for lost, damaged, or stolen baggage when you buy your fare with the Card.', 34),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 35),
((select id from credit_cards where slug='amex-delta-platinum-business'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', 'insurance', '24/7 emergency coordination and assistance when traveling more than 100 miles from home (third-party costs are your responsibility).', 36);

-- Reserve Business: everything Platinum Business has, plus more
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order) values
((select id from credit_cards where slug='amex-delta-reserve-business'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 'protection', 'Reimbursement for a stolen or damaged phone when you pay your wireless bill with the Card (secondary; limits apply).', 30),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 'insurance', 'Secondary trip delay coverage when you buy your fare with the Card; limits apply.', 31),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation & Interruption Insurance', 'insurance', 'Secondary coverage for non-refundable trips cancelled or interrupted for covered reasons.', 32),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 33),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 34),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'protection', 'return_protection', 'Return Protection', 'protection', 'Reimbursement if a merchant won''t take back an eligible item within the coverage window.', 35),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 'insurance', 'Coverage for lost, damaged, or stolen baggage when you buy your fare with the Card.', 36),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 37),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'insurance', 'travel_emergency_assistance', 'Premium Global Assist Hotline', 'insurance', '24/7 emergency assistance; may cover emergency medical transportation when coordinated by the hotline.', 38),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'other', 'concierge', 'Concierge', 'perk', 'American Express Concierge for reservations, tickets, travel and shopping requests.', 39),
((select id from credit_cards where slug='amex-delta-reserve-business'), 'other', 'other', 'Global Dining Access by Resy', 'perk', 'Exclusive reservations, Priority Notify, and special events at participating Resy restaurants.', 40);

-- Reserve Business: enrich the lounge access description (Escape + Sidecar)
update credit_card_benefits b
set description = 'Access to The Centurion Lounge, Sidecar by The Centurion Lounge, and Escape Lounges when you book your same-day Delta flight on the Card.',
    name = 'Centurion, Escape & Sidecar Lounge Access',
    updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='amex-delta-reserve-business' and b.benefit_type='lounge_centurion';
