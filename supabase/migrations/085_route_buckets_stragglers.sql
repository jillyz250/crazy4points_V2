-- 085_route_buckets_stragglers.sql
-- Migration 084's patterns missed two AAdvantage-as-currency rows because
-- the row text starts with "US " instead of "AA ":
--   - "US short-haul (saver + Web Specials)"
--   - "US-LHR / DUB via American partner award one-way"
-- Patch both. Meta-descriptor rows (e.g., "oneworld + Avios partners") stay
-- NULL by design - they describe a chart's structure, not a specific route.

do $$
declare
  aa_id uuid;
begin
  select id into aa_id from programs where slug = 'aa';

  update partner_redemptions
     set route_buckets = array['us-short']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and region_or_route ilike 'US short-haul%'
     and route_buckets is null;

  update partner_redemptions
     set route_buckets = array['us-eu-east']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%LHR%'
       or region_or_route ilike '%DUB%'
       or region_or_route ilike '%MAD%'
     )
     and route_buckets is null;
end $$;
