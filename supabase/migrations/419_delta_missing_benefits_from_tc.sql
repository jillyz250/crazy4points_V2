-- Add benefits missed in migration 418, found by verifying against the full
-- official Delta SkyMiles Amex T&Cs (2026-06-15). Sources: the per-card benefit
-- terms on delta.com (Reserve/Platinum/Gold + business equivalents).

-- (1) Platinum Business: missing 3X Hotels earn rate.
insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes)
select id, 'hotels', 3, 'any', '3X miles on purchases made directly with hotels worldwide.'
from credit_cards where slug='amex-delta-platinum-business';

-- (2) TakeOff 15 (all cards except Blue)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'other', 'other', 'TakeOff 15 (15% off award flights)', 'airline',
  '15% off the miles price of Delta award tickets booked on delta.com or the Fly Delta app. Excludes partner-operated flights and taxes/fees.', 20
from credit_cards where slug in ('amex-delta-gold','amex-delta-platinum','amex-delta-reserve','amex-delta-gold-business','amex-delta-platinum-business','amex-delta-reserve-business');

-- (3) Global Entry / TSA PreCheck credit (Platinum, Reserve, Platinum Business, Reserve Business)
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, description, sort_order)
select id, 'statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Credit', 120, 'USD', 'credit',
  'Up to $120 statement credit for a Global Entry application fee (or up to $85 for TSA PreCheck), once every 4 years.', 21
from credit_cards where slug in ('amex-delta-platinum','amex-delta-reserve','amex-delta-platinum-business','amex-delta-reserve-business');

-- (4) Hertz Five Star (Platinum, Platinum Business)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'status_conferred', 'status_other', 'Hertz Five Star Status', 'status',
  'Complimentary Hertz Five Star status. Enrollment through the Delta/Hertz Gold+ link required.', 22
from credit_cards where slug in ('amex-delta-platinum','amex-delta-platinum-business');

-- (5) Hertz Presidents Circle (Reserve, Reserve Business)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'status_conferred', 'status_hertz_presidents_circle', 'Hertz Presidents Circle Status', 'status',
  'Complimentary Hertz Presidents Circle status (Hertz''s top published tier). Enrollment required.', 22
from credit_cards where slug in ('amex-delta-reserve','amex-delta-reserve-business');

-- (6) Centurion Lounge for PERSONAL Reserve (business Reserve already had it)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'lounge_access', 'lounge_centurion', 'Centurion Lounge Access', 'lounge',
  'Complimentary access to The Centurion Lounge when you book your same-day Delta flight on the Card.', 23
from credit_cards where slug='amex-delta-reserve';

-- (7) Upgrade Priority (Reserve, Reserve Business)
insert into credit_card_benefits (card_id, category, benefit_type, name, benefit_family, description, sort_order)
select id, 'other', 'other', 'Complimentary Upgrades + Upgrade Priority', 'airline',
  'Added to the Complimentary Upgrade list; with Medallion status, priority over others at the same tier on Delta flights.', 24
from credit_cards where slug in ('amex-delta-reserve','amex-delta-reserve-business');

-- (8) Reserve Business: the rideshare/Delta Stays/Resy credit stack (omitted in 418).
--     Delta Stays $250 is INFERRED from the official "$610 in statement credits"
--     headline ($120 rideshare + $250 stays + $240 Resy = $610) - confirm against
--     the expanded Reserve Business T&C.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order)
select id, 'statement_credit', 'other', 'Rideshare Credit', 120, 'USD', 'credit', 'annual',
  'Up to $10/month in statement credits on U.S. rideshare with select providers. Enrollment required.', 12
from credit_cards where slug='amex-delta-reserve-business';
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order)
select id, 'travel_credit', 'hotel_credit', 'Delta Stays Credit', 250, 'USD', 'hotel', 'annual',
  'Up to $250/year as a statement credit on prepaid hotels/vacation rentals booked through Delta Stays on delta.com.', 13
from credit_cards where slug='amex-delta-reserve-business';
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order)
select id, 'statement_credit', 'dining_credit', 'Resy Credit', 240, 'USD', 'credit', 'annual',
  'Up to $20/month in statement credits on eligible U.S. Resy restaurant purchases. Resy account required.', 14
from credit_cards where slug='amex-delta-reserve-business';

-- (9) Sky Club description: add the 4 One-Time Guest Passes (Reserve + Reserve Business)
update credit_card_benefits b
set description = '15 Delta Sky Club visits each Medallion Year when flying Delta; unlock unlimited access after spending $75,000 on the Card in a calendar year. Plus 4 One-Time Guest Passes each year.',
    updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug in ('amex-delta-reserve','amex-delta-reserve-business') and b.benefit_type='lounge_skyclub';
