-- Corrections after verifying all 4 Wells Fargo cards against the full official
-- benefit pages (pasted 2026-06-15).

-- (1) Journey cell phone protection is $1,000 (not $600; Autograph is $600).
update credit_card_benefits b set
  description = 'Up to $1,000 per claim ($25 deductible, 2 claims/year) against damage, theft, or involuntary separation when you pay your monthly phone bill with the Card.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='wells-fargo-autograph-journey' and b.benefit_type='cellphone_protection';

-- Autograph cell phone: clarify $600 / $25 deductible
update credit_card_benefits b set
  description = 'Up to $600 per claim ($25 deductible, 2 claims/year) against damage, theft, or involuntary separation when you pay your monthly phone bill with the Card.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='wells-fargo-autograph' and b.benefit_type='cellphone_protection';

-- (2) Journey: enrich lost luggage ($3,000) + trip cancellation ($15,000)
update credit_card_benefits b set description = 'Up to $3,000 reimbursement for checked or carry-on baggage lost due to theft or misdirection by the common carrier (secondary).', updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='wells-fargo-autograph-journey' and b.benefit_type='lost_luggage_insurance';
update credit_card_benefits b set description = 'Up to $15,000 reimbursement for non-refundable lodging, flights, and activities if a trip is cancelled or interrupted for a covered reason (secondary).', updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='wells-fargo-autograph-journey' and b.benefit_type='trip_cancellation_insurance';

-- (3) Choice (regular): the 10 nights confer automatic Gold Elite
update credit_card_benefits b set
  name='Automatic Gold Elite Status (10 Elite Nights)',
  description='10 Elite Qualifying Nights each calendar year (within 14 days of opening), guaranteeing automatic Choice Privileges Gold Elite status and benefits.',
  updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='wells-fargo-choice-privileges' and b.name='10 Elite Night Credits';

-- (4) Choice Select: 20 EQNs (not 10) = Platinum
update credit_card_benefits b set
  name='20 Elite Night Credits',
  description='20 Elite Qualifying Nights each calendar year (within 14 days of opening), guaranteeing automatic Choice Privileges Platinum Elite status.',
  updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='wells-fargo-choice-privileges-select' and b.name='10 Elite Night Credits';

-- (5) New benefits
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
-- Autograph: Visa Signature suite
((select id from credit_cards where slug='wells-fargo-autograph'), 'insurance', 'rental_car_cdw_secondary', 'Auto Rental Collision Damage Waiver', null, null, 'insurance', null, 'Secondary coverage for damage or theft on eligible rentals paid with the Card (decline the counter CDW).', 10),
((select id from credit_cards where slug='wells-fargo-autograph'), 'insurance', 'travel_emergency_assistance', 'Travel & Emergency Assistance Services', null, null, 'insurance', null, '24/7 emergency assistance and referral worldwide (cardholder pays for actual services/goods).', 11),
((select id from credit_cards where slug='wells-fargo-autograph'), 'other', 'concierge', 'Visa Signature Concierge', null, null, 'perk', null, 'Complimentary 24/7 Visa Signature Concierge for tickets, travel, and reservations.', 12),
((select id from credit_cards where slug='wells-fargo-autograph'), 'other', 'other', 'Visa Signature Luxury Hotel Collection', null, null, 'hotel', null, 'Premium benefits (room upgrades when available, late checkout, complimentary Wi-Fi, and more) at properties in the Visa Signature Luxury Hotel Collection.', 13),
-- Journey: Visa Signature suite
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'insurance', 'travel_accident_insurance', 'Travel Accident Insurance', null, null, 'insurance', null, 'Up to $1,000,000 common carrier travel accident insurance when the fare is paid with the Card.', 10),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'insurance', 'travel_emergency_assistance', 'Travel & Emergency Assistance Services', null, null, 'insurance', null, '24/7 emergency assistance and referral worldwide (cardholder pays for actual services/goods).', 11),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'other', 'concierge', 'Visa Signature Concierge', null, null, 'perk', null, 'Complimentary 24/7 Visa Signature Concierge for tickets, travel, and reservations.', 12),
((select id from credit_cards where slug='wells-fargo-autograph-journey'), 'other', 'other', 'Visa Signature Luxury Hotel Collection', null, null, 'hotel', null, 'Premium benefits at properties in the Visa Signature Luxury Hotel Collection (upgrades, late checkout, Wi-Fi, and more).', 13),
-- Choice: World Elite Mastercard benefits
((select id from credit_cards where slug='wells-fargo-choice-privileges'), 'other', 'other', 'Mastercard World Elite Benefits', null, null, 'perk', null, 'World Elite Mastercard concierge, travel and lifestyle services, security benefits, and exclusive offers.', 10),
-- Choice Select: $120 Global Entry/TSA credit + World Elite benefits
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', 'credit', null, 'Up to $120 statement credit for a Trusted Traveler Program (Global Entry or TSA PreCheck) application/renewal fee, once every 4 years.', 10),
((select id from credit_cards where slug='wells-fargo-choice-privileges-select'), 'other', 'other', 'Mastercard World Elite Benefits', null, null, 'perk', null, 'World Elite Mastercard concierge, travel and lifestyle services, security benefits, and exclusive offers.', 11);
