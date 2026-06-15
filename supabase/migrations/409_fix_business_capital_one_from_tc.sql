-- Business-card corrections after verifying against the official T&Cs (pasted
-- 2026-06-15):
--   1. Venture X Business gets BOTH Premier Collection ($100 + daily breakfast
--      for two) and Lifestyle Collection ($50) experience credits (footnote 7).
--      Only Premier Collection was authored - add Lifestyle Collection.
--   2. VentureOne Business 5X earn applies to "hotel and car rental only" per the
--      binding Rewards Program terms (no vacation rentals, unlike its siblings).
--      The marketing banner says otherwise; the legal text wins. Narrow the note.

-- (1) Venture X Business: add Lifestyle Collection $50 experience credit.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='capital-one-venture-x-business'), 'travel_credit', 'hotel_credit', 'Lifestyle Collection Experience Credit', 50, 'USD', 'hotel', 'per_use', '$50 experience credit on every Lifestyle Collection booking through Capital One Business Travel, plus complimentary Wi-Fi and room upgrades, early check-in and late checkout when available.', 10);

-- (2) VentureOne Business: 5X is hotels and rental cars only (no vacation rentals).
update credit_card_earn_rates e
set notes = '5X miles on hotels and rental cars booked through Capital One Business Travel.',
    updated_at = now()
from credit_cards c
where c.id = e.card_id and c.slug = 'capital-one-ventureone-business'
  and e.category = 'hotels_cars_attractions_portal';
