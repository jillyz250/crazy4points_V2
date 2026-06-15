-- Corrections for Bilt Card 2.0 after verifying against the full official Offer
-- Terms + per-card pages (pasted 2026-06-15). ASCII-only.
-- Earn rates now match the official per-card comparison: card category rates plus
-- the Bilt Travel Portal / Lyft / Bilt Dining enhanced rates Bilt advertises.

-- ============================================================
-- EARN RATES (re-do all three to match the official comparison table)
-- ============================================================
delete from credit_card_earn_rates where card_id in (select id from credit_cards where slug in ('bilt-blue','bilt-obsidian','bilt-palladium'));

-- Blue
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bilt-blue'), 'dining', 4.00, null, null, 'any', 'Up to 4X at 20,000+ Bilt partner restaurants (Bilt Dining).'),
((select id from credit_cards where slug='bilt-blue'), 'hotels', 3.00, null, null, 'portal', '3X on hotels booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-blue'), 'lyft', 3.00, null, null, 'any', '3X on Lyft rides after linking your Bilt and Lyft accounts.'),
((select id from credit_cards where slug='bilt-blue'), 'flights', 2.00, null, null, 'portal', '2X on flights booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-blue'), 'housing', 1.25, null, null, 'any', 'Up to 1.25X on rent and mortgage (Housing-only option: variable 0-1.25X by Everyday Spend Ratio, 250-point monthly floor; no cap).'),
((select id from credit_cards where slug='bilt-blue'), 'base', 1.00, null, null, 'any', '1X on other everyday purchases.');

-- Obsidian (dining OR grocery is a choice - one earns 3X, the other 1X)
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bilt-obsidian'), 'dining', 6.00, null, null, 'any', 'Up to 6X at Bilt partner restaurants (Bilt Dining) when Dining is your selected 3X category. Dining or grocery is a choice; the non-selected category earns 1X.'),
((select id from credit_cards where slug='bilt-obsidian'), 'grocery', 3.00, 25000, 'annual', 'any', '3X if you select Grocery as your bonus category (up to $25,000/year, then 1X). Dining or grocery is a choice; the non-selected earns 1X.'),
((select id from credit_cards where slug='bilt-obsidian'), 'hotels', 4.00, null, null, 'portal', '4X on hotels booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-obsidian'), 'flights', 3.00, null, null, 'portal', '3X on flights booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-obsidian'), 'lyft', 3.00, null, null, 'any', '3X on Lyft rides after linking your Bilt and Lyft accounts.'),
((select id from credit_cards where slug='bilt-obsidian'), 'travel', 2.00, null, null, 'any', '2X on other travel (airlines, hotels, cruises, car rentals).'),
((select id from credit_cards where slug='bilt-obsidian'), 'housing', 1.25, null, null, 'any', 'Up to 1.25X on rent and mortgage (Housing-only option; no cap).'),
((select id from credit_cards where slug='bilt-obsidian'), 'base', 1.00, null, null, 'any', '1X on other everyday purchases.');

-- Palladium
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bilt-palladium'), 'dining', 5.00, null, null, 'any', 'Up to 5X at 20,000+ Bilt partner restaurants (Bilt Dining).'),
((select id from credit_cards where slug='bilt-palladium'), 'hotels', 4.00, null, null, 'portal', '4X on hotels booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-palladium'), 'lyft', 4.00, null, null, 'any', '4X on Lyft rides after linking your Bilt and Lyft accounts.'),
((select id from credit_cards where slug='bilt-palladium'), 'flights', 3.00, null, null, 'portal', '3X on flights booked through the Bilt Travel Portal.'),
((select id from credit_cards where slug='bilt-palladium'), 'housing', 1.25, null, null, 'any', 'Up to 1.25X on rent and mortgage (Housing-only option; no cap).'),
((select id from credit_cards where slug='bilt-palladium'), 'base', 2.00, null, null, 'any', '2X on other everyday purchases.');

-- ============================================================
-- AUTHORIZED USER FEES
-- ============================================================
update credit_cards set authorized_user_fee_usd=50, authorized_user_fee_structure='$50 per authorized user, per year.', last_verified=current_date, updated_at=now() where slug='bilt-obsidian';
update credit_cards set authorized_user_fee_usd=95, authorized_user_fee_structure='$95 per authorized user, per year.', last_verified=current_date, updated_at=now() where slug='bilt-palladium';

-- ============================================================
-- PALLADIUM welcome bonus: confirmed $4,000 / 90 days
-- ============================================================
update credit_card_welcome_bonuses w set
  spend_required_usd=4000, spend_window_months=3,
  notes='Earn 50,000 Bilt Points plus Bilt Gold Elite status after $4,000 in everyday spend within 90 days of opening (housing payments excluded; 97 days for accounts opened 2026-02-07). PLUS $300 in Bilt Cash on account opening (no spend required). Gold status valid through Jan 15 of the second following year.',
  last_verified=current_date, verified_at=now()
from credit_cards c where c.id=w.card_id and c.slug='bilt-palladium';

-- ============================================================
-- HOTEL CREDIT descriptions (semiannual split)
-- ============================================================
update credit_card_benefits b set description='Up to $100/year in Bilt Travel hotel credits, applied as two $50 statement credits (Jan-Jun and Jul-Dec) on Bilt Travel Portal hotel bookings of 2+ nights.', updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='bilt-obsidian' and b.name='$100 Bilt Travel Hotel Credit';
update credit_card_benefits b set description='Up to $400/year in Bilt Travel hotel credits, applied as two $200 statement credits (Jan-Jun and Jul-Dec) on Bilt Travel Portal hotel bookings of 2+ nights.', updated_at=now()
from credit_cards c where c.id=b.card_id and c.slug='bilt-palladium' and b.name='$400 Bilt Travel Hotel Credit';

-- ============================================================
-- PROTECTION SUITES
-- ============================================================
-- Obsidian (Trip Delay already present)
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-obsidian'), 'protection', 'cellphone_protection', 'Cellular Wireless Telephone Protection', null, null, 'protection', null, 'Coverage for a damaged or stolen cell phone when you pay your wireless bill with the card (see Guide to Benefits for limits).', 8),
((select id from credit_cards where slug='bilt-obsidian'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation and Interruption Protection', null, null, 'insurance', null, 'Reimbursement for non-refundable trip costs when a covered reason cancels or interrupts your trip (see Guide to Benefits).', 9),
((select id from credit_cards where slug='bilt-obsidian'), 'protection', 'purchase_protection', 'Purchase Assurance', null, null, 'protection', null, 'Covers eligible new purchases against damage or theft for a limited period (see Guide to Benefits).', 10),
((select id from credit_cards where slug='bilt-obsidian'), 'insurance', 'rental_car_cdw_secondary', 'MasterRental Coverage', null, null, 'insurance', null, 'Rental car loss and damage coverage when you pay with the card and decline the counter CDW (see Guide to Benefits).', 11),
((select id from credit_cards where slug='bilt-obsidian'), 'protection', 'extended_warranty', 'Extended Warranty', null, null, 'protection', null, 'Extends an eligible manufacturer warranty (see Guide to Benefits).', 12);
-- Palladium (Priority Pass + Purchase Protection already present)
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-palladium'), 'protection', 'cellphone_protection', 'Cellular Wireless Telephone Protection', null, null, 'protection', null, 'Coverage for a damaged or stolen cell phone when you pay your wireless bill with the card (see Guide to Benefits for limits).', 11),
((select id from credit_cards where slug='bilt-palladium'), 'insurance', 'trip_cancellation_insurance', 'Trip Cancellation and Interruption Protection', null, null, 'insurance', null, 'Reimbursement for non-refundable trip costs when a covered reason cancels or interrupts your trip (see Guide to Benefits).', 12),
((select id from credit_cards where slug='bilt-palladium'), 'insurance', 'trip_delay_insurance', 'Trip Delay Reimbursement', null, null, 'insurance', null, 'Reimbursement for certain expenses when a covered trip is delayed (see Guide to Benefits).', 13),
((select id from credit_cards where slug='bilt-palladium'), 'insurance', 'rental_car_cdw_secondary', 'MasterRental Coverage', null, null, 'insurance', null, 'Rental car loss and damage coverage when you pay with the card and decline the counter CDW (see Guide to Benefits).', 14),
((select id from credit_cards where slug='bilt-palladium'), 'protection', 'extended_warranty', 'Extended Warranty', null, null, 'protection', null, 'Extends an eligible manufacturer warranty (see Guide to Benefits).', 15),
((select id from credit_cards where slug='bilt-palladium'), 'insurance', 'baggage_delay_insurance', 'Baggage Delay Insurance', null, null, 'insurance', null, 'Reimbursement for essentials when checked baggage is delayed (see Guide to Benefits).', 16),
((select id from credit_cards where slug='bilt-palladium'), 'insurance', 'lost_luggage_insurance', 'Lost or Damaged Luggage Insurance', null, null, 'insurance', null, 'Coverage for lost or damaged luggage (see Guide to Benefits).', 17),
((select id from credit_cards where slug='bilt-palladium'), 'protection', 'other', 'Price Drop Protection', null, null, 'protection', null, 'Refund of the difference if an eligible purchase drops in price within the coverage window (see Guide to Benefits).', 18);
