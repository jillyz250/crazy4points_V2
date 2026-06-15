-- Corrections to the Capital One card benefits after verifying against the
-- official cardmember T&Cs (pasted 2026-06-15). Issues found:
--   1. Venture X Hertz status was authored as "Five Star" - the T&C (footnote 7)
--      confirms Venture X and Venture X Business get Hertz PRESIDENT'S CIRCLE;
--      Five Star is for Venture, VentureOne, Venture Business, VentureOne Business.
--   2. Venture X was missing the Premier Collection ($100 + daily breakfast for
--      two) and Lifestyle Collection ($50) experience credits (T&C footnote 5).
--   3. Venture Business and VentureOne Business were missing Hertz Five Star.
--   4. VentureOne had an Auto Rental CDW that the official page does not confirm
--      (protection benefits were not enumerated) - removed to avoid an unverified
--      claim.

-- (1) Venture X: Five Star -> President's Circle
update credit_card_benefits b
set benefit_type = 'status_hertz_presidents_circle',
    name = 'Hertz Presidents Circle Status',
    description = 'Complimentary Hertz Presidents Circle status (Hertz''s top published tier) - skip the counter at select locations and pick from a wider selection of cars. Enrollment required through the Capital One benefits tab.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'capital-one-venture-x' and b.name = 'Hertz Five Star Status';

-- (2) Venture X: add Premier Collection ($100, with daily breakfast for two) and
--     Lifestyle Collection ($50) experience credits.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='capital-one-venture-x'), 'travel_credit', 'hotel_credit', 'Premier Collection Experience Credit', 100, 'USD', 'hotel', 'per_use', '$100 experience credit on every Premier Collection booking through Capital One Travel, plus daily breakfast for two, complimentary Wi-Fi, and room upgrades, early check-in and late checkout when available.', 10),
((select id from credit_cards where slug='capital-one-venture-x'), 'travel_credit', 'hotel_credit', 'Lifestyle Collection Experience Credit', 50, 'USD', 'hotel', 'per_use', '$50 experience credit on every Lifestyle Collection booking through Capital One Travel, plus complimentary Wi-Fi and room upgrades, early check-in and late checkout when available.', 11);

-- (3) Venture X Business: enrich Premier Collection description with breakfast detail.
update credit_card_benefits b
set description = '$100 experience credit on every Premier Collection booking through Capital One Business Travel, plus daily breakfast for two, complimentary Wi-Fi, and room upgrades, early check-in and late checkout when available.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'capital-one-venture-x-business' and b.name = 'Premier Collection Experience Credit';

-- (4) Venture Business + VentureOne Business: add Hertz Five Star status.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, description, sort_order) values
((select id from credit_cards where slug='capital-one-venture-business'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, 'status', 'Complimentary Hertz Five Star status - skip the counter and pick from a wider selection of cars. Enrollment required through the Capital One benefits tab.', 5),
((select id from credit_cards where slug='capital-one-ventureone-business'), 'status_conferred', 'status_other', 'Hertz Five Star Status', null, null, 'status', 'Complimentary Hertz Five Star status - skip the counter and pick from a wider selection of cars. Enrollment required through the Capital One benefits tab.', 3);

-- (5) VentureOne: remove the unconfirmed Auto Rental CDW.
delete from credit_card_benefits b
using credit_cards c
where c.id = b.card_id and c.slug = 'capital-one-ventureone' and b.name = 'Auto Rental Collision Damage Waiver';

-- (6) VentureOne: note the separate "for Good Credit" approval tier (same card,
--     no welcome bonus, no intro APR, flat 28.99% APR) so we capture it without
--     a duplicate tile. Verified against the official T&C pasted 2026-06-15.
update credit_cards
set good_to_know = good_to_know || ' Capital One also offers a VentureOne for Good Credit - same $0 fee and 1.25X/5X rewards, but no welcome bonus, no intro APR, and a flat 28.99% APR. The Excellent-credit version here is the one worth chasing for the bonus.',
    updated_at = now()
where slug = 'capital-one-ventureone';
