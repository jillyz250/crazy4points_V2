-- Mirror the Amex protection suite onto personal Platinum + Reserve, verified
-- 2026-06-15 against the official Amex card pages (americanexpress.com):
--   Personal Reserve carries the SAME full suite as Reserve Business.
--   Personal Platinum carries the SAME set as Platinum Business.

-- Personal Platinum (= Platinum Business protections)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order) values
((select id from credit_cards where slug='amex-delta-platinum'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 'protection', 'Up to $800 per claim (2/year, $50 deductible) for a stolen or damaged phone when the prior month''s wireless bill was paid with the Card.', 30),
((select id from credit_cards where slug='amex-delta-platinum'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 'insurance', 'Up to $500 per trip for covered delays over 6 hours when the round-trip is paid with the Card (secondary; 2 claims/year).', 31),
((select id from credit_cards where slug='amex-delta-platinum'), 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 32),
((select id from credit_cards where slug='amex-delta-platinum'), 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 33),
((select id from credit_cards where slug='amex-delta-platinum'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 'insurance', 'Up to $1,250 carry-on / $500 checked for lost, damaged, or stolen baggage when the fare is paid with the Card.', 34),
((select id from credit_cards where slug='amex-delta-platinum'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 35),
((select id from credit_cards where slug='amex-delta-platinum'), 'insurance', 'travel_emergency_assistance', 'Global Assist Hotline', 'insurance', '24/7 emergency coordination when traveling more than 100 miles from home (third-party costs are your responsibility).', 36);

-- Personal Reserve (= Reserve Business protections, full suite)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order) values
((select id from credit_cards where slug='amex-delta-reserve'), 'protection', 'cellphone_protection', 'Cell Phone Protection', 'protection', 'Up to $800 per claim (2/year, $50 deductible) for a stolen or damaged phone when the prior month''s wireless bill was paid with the Card.', 30),
((select id from credit_cards where slug='amex-delta-reserve'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', 'insurance', 'Up to $500 per trip for covered delays over 6 hours when the round-trip is paid with the Card (secondary; 2 claims/year).', 31),
((select id from credit_cards where slug='amex-delta-reserve'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation & Interruption Insurance', 'insurance', 'Up to $10,000 per trip ($20,000/year) for non-refundable expenses when a covered reason cancels or interrupts a round-trip paid with the Card.', 32),
((select id from credit_cards where slug='amex-delta-reserve'), 'protection', 'purchase_protection', 'Purchase Protection', 'protection', 'Covers eligible new purchases against damage or theft for a limited time.', 33),
((select id from credit_cards where slug='amex-delta-reserve'), 'protection', 'extended_warranty', 'Extended Warranty', 'protection', 'Extends eligible U.S. manufacturer warranties.', 34),
((select id from credit_cards where slug='amex-delta-reserve'), 'protection', 'return_protection', 'Return Protection', 'protection', 'Reimbursement if a merchant won''t take back an eligible item within 90 days of purchase.', 35),
((select id from credit_cards where slug='amex-delta-reserve'), 'insurance', 'lost_luggage_insurance', 'Baggage Insurance Plan', 'insurance', 'Up to $1,250 carry-on / $500 checked for lost, damaged, or stolen baggage when the fare is paid with the Card.', 36),
((select id from credit_cards where slug='amex-delta-reserve'), 'insurance', 'rental_car_cdw_secondary', 'Car Rental Loss & Damage Insurance', 'insurance', 'Secondary collision/theft coverage on eligible rentals paid with the Card.', 37),
((select id from credit_cards where slug='amex-delta-reserve'), 'insurance', 'travel_emergency_assistance', 'Premium Global Assist Hotline', 'insurance', '24/7 emergency assistance; emergency medical transportation may be covered when coordinated by the hotline.', 38),
((select id from credit_cards where slug='amex-delta-reserve'), 'other', 'concierge', 'Concierge', 'perk', 'American Express Concierge for reservations, tickets, travel and shopping requests.', 39),
((select id from credit_cards where slug='amex-delta-reserve'), 'other', 'other', 'Global Dining Access by Resy', 'perk', 'Exclusive reservations, Priority Notify, and special events at participating Resy restaurants.', 40);
