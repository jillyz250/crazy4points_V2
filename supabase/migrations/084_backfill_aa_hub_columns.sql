-- 084_backfill_aa_hub_columns.sql
-- Pattern-based backfill of complexity_score + route_buckets for every AA-
-- related row in partner_redemptions (forward + reverse direction). Also
-- seeds availability_reality on a small set of HIGH-confidence rows where
-- industry consensus is clear; everything else stays NULL.
--
-- Strategy: instead of hardcoded per-row UPDATEs (fragile), use pattern
-- matches on region_or_route and the existing structured columns
-- (bookable_online, fuel_surcharges, pricing_model). Robust to new rows
-- following similar conventions.

do $$
declare
  aa_id uuid;
begin
  select id into aa_id from programs where slug = 'aa';
  if aa_id is null then raise exception 'aa missing'; end if;

  -- ==========================================================================
  -- complexity_score (every AA-touching row)
  -- ==========================================================================
  update partner_redemptions
     set complexity_score = case
       when region_or_route ilike '%multi-carrier%'
         or region_or_route ilike '%stopover%'
         or region_or_route ilike '%multiple oneworld%'
         then 'nerd_stuff'
       when bookable_online = false then 'annoying'
       when fuel_surcharges = 'high' then 'annoying'
       when region_or_route ilike '%phone%' then 'annoying'
       when region_or_route ilike '%round-trip%' then 'annoying'
       when region_or_route ilike '%per-segment%' then 'annoying'
       when routing_rules ilike '%per-segment%' then 'annoying'
       when routing_rules ilike '%phone%' then 'annoying'
       when routing_rules ilike '%round-trip required%' then 'annoying'
       else 'easy'
     end
   where complexity_score is null
     and (operating_carrier_id = aa_id or currency_program_id = aa_id);

  -- ==========================================================================
  -- route_buckets (every AA-touching row, multi-bucket where chart spans)
  -- ==========================================================================

  -- Distance bands (Avios family + Aer Lingus)
  update partner_redemptions
     set route_buckets = array['us-short']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 1%'
       or region_or_route ilike '%0-650%'
       or region_or_route ilike '%0-700%'
       or region_or_route ilike '%<750%'
       or region_or_route ilike '%AA short-haul%'
     )
     and route_buckets is null;

  update partner_redemptions
     set route_buckets = array['us-medium']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 2%'
       or region_or_route ilike '%651-1150%'
       or region_or_route ilike '%701-1400%'
       or region_or_route ilike '%750-2750%'
       or region_or_route ilike '%AA medium-haul%'
     )
     and route_buckets is null;

  update partner_redemptions
     set route_buckets = array['us-medium', 'us-long']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 3%'
       or region_or_route ilike '%1151-2000%'
       or region_or_route ilike '%transcon%'
     )
     and route_buckets is null;

  update partner_redemptions
     set route_buckets = array['us-long']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 4%'
       or region_or_route ilike '%2001-3000%'
     )
     and route_buckets is null;

  -- Within North America (single chart cell spanning all US buckets)
  update partner_redemptions
     set route_buckets = array['us-short', 'us-medium', 'us-long']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike 'Within North America%'
       or region_or_route ilike 'AA domestic%'
       or region_or_route ilike 'AA US domestic%'
       or region_or_route ilike '%US domestic via American%'
       or region_or_route ilike '%US domestic one-way%'
     )
     and route_buckets is null;

  -- Transatlantic — East Coast
  update partner_redemptions
     set route_buckets = array['us-eu-east']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 5%'
       or region_or_route ilike '%3001-4000%'
       or region_or_route ilike '%East Coast to Europe%'
     )
     and route_buckets is null;

  -- Transatlantic — West Coast
  update partner_redemptions
     set route_buckets = array['us-eu-west']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%distance band 6%'
       or region_or_route ilike '%4001-5500%'
       or region_or_route ilike '%West Coast to Europe%'
     )
     and route_buckets is null;

  -- Generic "Europe" (no east/west specified) → both
  update partner_redemptions
     set route_buckets = array['us-eu-east', 'us-eu-west']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%North America to Europe%'
       or region_or_route ilike 'US to Europe%'
       or region_or_route ilike '%AA US to Europe%'
       or region_or_route ilike '%to MAD%'
     )
     and route_buckets is null;

  -- Asia: Japan / Korea
  update partner_redemptions
     set route_buckets = array['us-japan']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%Japan%'
       or region_or_route ilike '%Korea%'
       or region_or_route ilike '%Asia (Japan%'
     )
     and route_buckets is null;

  -- Asia: SE Asia / China
  update partner_redemptions
     set route_buckets = array['us-se-asia']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%SE Asia%'
       or region_or_route ilike '%China%'
       or region_or_route ilike '%Hong Kong%'
       or region_or_route ilike '%HKG%'
       or region_or_route ilike '%Asia 2%'
     )
     and route_buckets is null;

  -- Generic AA long-haul (Cathay etc.)
  update partner_redemptions
     set route_buckets = array['us-japan', 'us-se-asia']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike 'AA long-haul%'
       or region_or_route ilike '%Long-haul (US to Asia%'
     )
     and route_buckets is null;

  -- Middle East / India
  update partner_redemptions
     set route_buckets = array['us-me-india']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%Middle East%'
       or region_or_route ilike '%India%'
       or region_or_route ilike '%ME / India%'
     )
     and route_buckets is null;

  -- Africa
  update partner_redemptions
     set route_buckets = array['us-africa']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and region_or_route ilike '%Africa%'
     and route_buckets is null;

  -- South Pacific
  update partner_redemptions
     set route_buckets = array['us-pacific']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%South Pacific%'
       or region_or_route ilike '%Australia%'
       or region_or_route ilike '%NZ%'
       or region_or_route ilike '%Fiji%'
       or region_or_route ilike '%Tahiti%'
       or region_or_route ilike '%PPT%'
     )
     and route_buckets is null;

  -- South America
  update partner_redemptions
     set route_buckets = array['us-samerica']
   where (operating_carrier_id = aa_id or currency_program_id = aa_id)
     and (
       region_or_route ilike '%South America%'
       or region_or_route ilike '%intra-Chile%'
       or region_or_route ilike '%intra-Argentina%'
       or region_or_route ilike '%Cross-border South America%'
     )
     and route_buckets is null;

  -- ==========================================================================
  -- availability_reality (SPARSE — only HIGH-confidence industry-consensus
  -- cases. NULL elsewhere. No fuzzy "good" default.)
  -- ==========================================================================

  -- UNICORN: famously rare First-class redemptions
  update partner_redemptions
     set availability_reality = 'unicorn'
   where currency_program_id = aa_id
     and operating_carrier_id in (
       select id from programs
       where slug in ('qantas', 'jal', 'japan_airlines', 'japan-airlines', 'cathay', 'cathay_pacific', 'cathay-pacific', 'etihad')
     )
     and cabin = 'First';

  -- RARE: hard-to-find premium long-haul
  update partner_redemptions
     set availability_reality = 'rare'
   where currency_program_id = aa_id
     and operating_carrier_id in (
       select id from programs
       where slug in ('qantas', 'cathay_pacific', 'cathay-pacific', 'japan_airlines', 'japan-airlines')
     )
     and cabin = 'Business';

  -- EXCELLENT: AAdvantage own metal short-haul saver, Iberia transatlantic
  update partner_redemptions
     set availability_reality = 'excellent'
   where currency_program_id = aa_id
     and operating_carrier_id = aa_id
     and cabin = 'Economy'
     and region_or_route ilike '%short-haul%';

  update partner_redemptions
     set availability_reality = 'excellent'
   where currency_program_id = aa_id
     and operating_carrier_id in (select id from programs where slug = 'iberia')
     and cabin in ('Economy', 'Business')
     and region_or_route ilike '%Europe%';

  -- GOOD: Atmos AA short-haul, BA Avios short-haul, AAdvantage own Y transcon
  update partner_redemptions
     set availability_reality = 'good'
   where operating_carrier_id = aa_id
     and currency_program_id in (
       select id from programs where slug in ('atmos', 'ba_avios', 'ba-avios')
     )
     and region_or_route ilike '%distance band 1%';

  update partner_redemptions
     set availability_reality = 'good'
   where operating_carrier_id = aa_id
     and currency_program_id in (select id from programs where slug = 'atmos')
     and region_or_route ilike '%short-haul%';

  -- GOOD: Qatar Qsuite (improved availability post-2024)
  update partner_redemptions
     set availability_reality = 'good'
   where currency_program_id = aa_id
     and operating_carrier_id in (select id from programs where slug = 'qatar_airways')
     and cabin = 'Business'
     and region_or_route ilike '%Middle East%';
end $$;
