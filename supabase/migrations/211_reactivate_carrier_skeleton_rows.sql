-- Reactivate 39 program rows that were over-deactivated by migration 210.
--
-- Migration 210 deactivated all rows where last_verified IS NULL + intro <100 chars.
-- That caught ~110 rows, but ~39 of them are legitimate carrier-reference
-- skeletons used as operating_carrier_id or currency_program_id targets in
-- partner_redemptions rows (per the carrier-vs-loyalty-program pattern -
-- e.g. cathay-pacific is the airline carrier referenced by Cathay-operated
-- award rows even though Asia Miles loyalty program lives at slug=cathay).
--
-- Re-activating these so they serve their FK-target role and surface in the
-- refresh queue as "needs authoring" - which is the correct admin signal.

update programs
set is_active = true,
    updated_at = now()
where is_active = false
  and id in (
    select distinct operating_carrier_id from partner_redemptions where is_active = true
    union
    select distinct currency_program_id from partner_redemptions where is_active = true
  );
