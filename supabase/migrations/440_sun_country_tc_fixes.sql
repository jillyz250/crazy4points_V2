-- Sun Country Visa Signature corrections after verifying the official Synchrony
-- page (pasted 2026-06-15). FX = $0 confirmed (was set by convention).
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'priority_boarding', 'Preferred Boarding (Zone 2)', null, null, 'airline', null, 'Preferred Boarding in Zone 2 on Sun Country flights (Plus status upgrades this to Zone 1).', 7),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'other', 'Points Do Not Expire', null, null, 'perk', null, 'Sun Country Rewards points earned with the card never expire while you remain a cardmember in good standing.', 8);
