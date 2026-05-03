-- 075_tighten_atmos_aa_rates.sql
-- Tighten Atmos -> AA partner award rates from overcautious ranges to the
-- single published values verified by AwardWallet's 2026 partner-pricing
-- guide (https://awardwallet.com/airlines/book-american-flights-with-partner-miles/).
--
-- The original migration 071 captured the rates as ranges to reflect the
-- "chart fragmented post-2023" framing, but AwardWallet confirms specific
-- single values for the short-haul and medium-haul economy bands. The
-- premium-cabin rows stay as ranges where the chart genuinely varies.

do $$
declare
  atmos_id uuid;
  aa_id    uuid;
  upd      integer;
begin
  select id into atmos_id from programs where slug = 'atmos';
  select id into aa_id    from programs where slug = 'aa';

  if atmos_id is null or aa_id is null then
    raise exception 'atmos or aa program row missing';
  end if;

  -- Short-haul Y: 4,500 (was 4,500-12,500)
  -- Also clear the unclear "partial support post-2023" routing_rules note —
  -- stopovers are not relevant for domestic short-haul anyway.
  update partner_redemptions
     set cost_miles_low  = 4500,
         cost_miles_high = 4500,
         confidence      = 'HIGH',
         routing_rules   = null,
         verified_by     = coalesce(verified_by, '') || ' | atmos-tighten-2026-05-03'
   where currency_program_id = atmos_id
     and operating_carrier_id = aa_id
     and cabin = 'Economy'
     and region_or_route = 'AA short-haul (~0-700 mi)';
  get diagnostics upd = row_count;
  raise notice 'Atmos short-haul Y: % rows updated', upd;

  -- Medium-haul Y: 7,500 (was 7,500-15,000)
  update partner_redemptions
     set cost_miles_low  = 7500,
         cost_miles_high = 7500,
         confidence      = 'HIGH',
         verified_by     = coalesce(verified_by, '') || ' | atmos-tighten-2026-05-03'
   where currency_program_id = atmos_id
     and operating_carrier_id = aa_id
     and cabin = 'Economy'
     and region_or_route = 'AA medium-haul (~701-1400 mi)';
  get diagnostics upd = row_count;
  raise notice 'Atmos medium-haul Y: % rows updated', upd;

  -- Domestic Business: stays a range (chart less consistently published)
  -- Domestic First: stays a range (chart less consistently published)
end $$;
