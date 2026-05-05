-- Step 5.5 partner_redemptions seeding for Frontier Miles.
--
-- Required per SKILL.md Step 5.5 for every airline / loyalty_program page.
-- The Partner Booking Tool reads from partner_redemptions to surface
-- "which programs can book this route" in destination spins. Without a
-- row, Frontier doesn't appear in any results.
--
-- Frontier is a fully-dynamic carrier with no alliance and no partner
-- award redemptions - all Frontier Miles awards book Frontier-operated
-- metal only. So coverage is the simplest possible case: one row, with
-- frontier as both currency_program_id and operating_carrier_id, marked
-- as dynamic pricing.

update programs
set partner_chart_url = 'https://www.flyfrontier.com/frontiermiles/'
where slug = 'frontier' and partner_chart_url is null;

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Economy', 'All Frontier routes (dynamic pricing)', 'dynamic',
  'Frontier Miles awards book Frontier-operated metal only. No alliance, no partner network. Three booking tiers: Value (5K+ miles starting domestic / 15K+ Mexico-Caribbean), Standard, Last Seat (Elite-only, not guaranteed). Award costs vary by route, date, and live demand. See flyfrontier.com/frontiermiles/ for current pricing.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'frontier'
on conflict do nothing;
