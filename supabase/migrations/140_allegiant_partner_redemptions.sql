-- Step 5.5 partner_redemptions seeding for Allways Rewards.
--
-- Allegiant is fully standalone: no alliance, no codeshare partners, no
-- partner award redemptions. Allways points only redeem on Allegiant
-- metal, priced like cash (1 pt = $0.01). Coverage is the simplest
-- possible case: one row, allegiant as both currency and operating
-- carrier, marked as dynamic / cash-equivalent.

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Economy', 'All Allegiant routes (cash-equivalent)', 'dynamic',
  'Allways Rewards points redeem at a fixed 1 point = $0.01 toward any Allegiant purchase, including base fare, taxes, fees, bags, seats, and vacation packages. No award chart, no zones, no blackout dates, no fuel surcharges. No partner redemptions - Allways points only redeem on Allegiant. See allegiantair.com/rewards-faqs for details.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'allegiant'
on conflict do nothing;
