-- Venture Business: add the two missing annual credits that make up the "up to
-- $220 in credits" headline. Verified 2026-06-15 against the official page:
--   https://www.capitalone.com/small-business/credit-cards/venture-business/
-- Breakdown: $120 Global Entry/TSA (already authored) + $50 annual Capital One
-- Business Travel credit + $50 annual statement credit for advertising/software
-- merchants. (The $50 Lifestyle Collection per-stay experience credit is separate
-- and already authored. Venture Business does NOT get Premier Collection - that
-- $100 reference in the shared footnote applies to Venture X / Venture X Business.)
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='capital-one-venture-business'), 'travel_credit', 'travel_credit_annual', 'Annual Travel Credit', 50, 'USD', 'credit', 'annual', '$50 annual credit for bookings through Capital One Business Travel.', 6),
((select id from credit_cards where slug='capital-one-venture-business'), 'statement_credit', 'other', 'Advertising and Software Statement Credit', 50, 'USD', 'credit', 'annual', '$50 annual statement credit for purchases at qualifying advertising or software merchants.', 7);
