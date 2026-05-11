-- 225_backfill_ua_legacy_rows.sql
-- Pattern-based backfill for the 20 UA-as-operator rows authored BEFORE the
-- Hub columns existed (route_buckets, complexity_score). Same approach as
-- migration 084 used for AA.
--
-- After this, all 57 UA-as-operator rows are queryable via route_bucket and
-- have a complexity tag for the Hub UI.

do $$
declare
  ua_id uuid;
begin
  select id into ua_id from programs where slug = 'united';

  -- ==========================================================================
  -- complexity_score (every UA-as-operator row still missing one)
  -- ==========================================================================
  update partner_redemptions
     set complexity_score = case
       when region_or_route ilike '%multi-carrier%' or region_or_route ilike '%stopover%' then 'nerd_stuff'
       when bookable_online = false then 'annoying'
       when fuel_surcharges = 'high' then 'annoying'
       when region_or_route ilike '%round-trip%' then 'annoying'
       when region_or_route ilike '%phone%' then 'annoying'
       else 'easy'
     end
   where operating_carrier_id = ua_id
     and complexity_score is null;

  -- ==========================================================================
  -- route_buckets (pattern matches against region_or_route text)
  -- ==========================================================================

  -- "US domestic own-metal" / "Within North America (single-zone)" - spans all 3 US buckets
  update partner_redemptions
     set route_buckets = array['us-short', 'us-medium', 'us-long']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and (
       region_or_route ilike 'US domestic own-metal%'
       or region_or_route ilike 'US domestic via United%'
       or region_or_route ilike 'Within North America (single-zone)%'
     );

  -- "US domestic short-haul" / "Within North America short-haul" - short only
  update partner_redemptions
     set route_buckets = array['us-short']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and (
       region_or_route ilike '%domestic short-haul%'
       or region_or_route ilike '%North America short-haul%'
     );

  -- "US transcon and domestic" - JetBlue style, mostly medium-haul
  update partner_redemptions
     set route_buckets = array['us-medium', 'us-long']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and region_or_route ilike '%transcon%';

  -- US to Europe (any phrasing)
  update partner_redemptions
     set route_buckets = array['us-eu-east', 'us-eu-west']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and region_or_route ilike '%US to Europe%';

  -- US to Asia (own-metal generic) - spans Japan + SE Asia
  update partner_redemptions
     set route_buckets = array['us-japan', 'us-se-asia']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and region_or_route ilike '%US to Asia%';

  -- US to Australia / NZ / Pacific
  update partner_redemptions
     set route_buckets = array['us-pacific']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and (
       region_or_route ilike '%US to Australia%'
       or region_or_route ilike '%Pacific%'
     );

  -- Azul Brazil routes - South America
  update partner_redemptions
     set route_buckets = array['us-samerica']
   where operating_carrier_id = ua_id
     and route_buckets is null
     and region_or_route ilike '%Azul%';
end $$;
