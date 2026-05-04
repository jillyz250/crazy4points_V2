-- Backfill structured origin_region / dest_region / distance_band columns
-- on existing partner_redemptions rows by parsing the free-form
-- region_or_route text. This unblocks the Partner Booking Tool's
-- structured-query layer without any manual re-entry.
--
-- BACKGROUND
-- ----------
-- Migrations 071-077 + 081 + 085 seeded partner_redemptions with
-- region_or_route values like:
--   'Within North America'
--   'North America to Europe'
--   'North America to Asia (Japan / Korea)'
--   'AA short-haul (~0-700 mi)'
--   'US transcon and domestic'
--   'New England / Caribbean regional'
--
-- We map each existing pattern to the controlled region vocab.
-- region_or_route stays unchanged as a human-readable label; the new
-- columns drive structured queries.

-- ============================================================
-- Region-pair mappings (most common patterns)
-- ============================================================

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'north_america'
where origin_region is null
  and (
    region_or_route ilike '%within north america%'
    or region_or_route ilike '%us transcon%'
    or region_or_route ilike '%us short-haul%'
    or region_or_route ilike '%us short haul%'
    or region_or_route ilike '%us domestic%'
    or region_or_route ilike '%intra-north america%'
    or region_or_route = 'US transcon and domestic'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'europe'
where origin_region is null
  and (
    region_or_route ilike '%north america to europe%'
    or region_or_route ilike '%us to europe%'
    or region_or_route ilike '%transatlantic%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'asia_1'
where origin_region is null
  and (
    region_or_route ilike '%north america to asia (japan%'
    or region_or_route ilike '%us to japan%'
    or region_or_route ilike '%us to korea%'
    or region_or_route ilike '%us to asia 1%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'asia_2'
where origin_region is null
  and (
    region_or_route ilike '%north america to asia (se asia%'
    or region_or_route ilike '%north america to asia (china%'
    or region_or_route ilike '%north america to hong kong%'
    or region_or_route ilike '%us to taiwan%'
    or region_or_route ilike '%us to asia 2%'
    or region_or_route ilike '%us to taiwan / asia%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'middle_east'
where origin_region is null
  and (
    region_or_route ilike '%north america to middle east%'
    or region_or_route ilike '%us to middle east%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'india_south_asia'
where origin_region is null
  and (
    region_or_route ilike '%north america to india%'
    or region_or_route ilike '%us to india%'
    or (region_or_route ilike '%middle east%' and region_or_route ilike '%india%')
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'caribbean'
where origin_region is null
  and (
    region_or_route ilike '%north america to caribbean%'
    or region_or_route ilike '%us to caribbean%'
    or region_or_route ilike '%new england / caribbean%'
    or region_or_route ilike '%caribbean regional%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'mexico'
where origin_region is null
  and region_or_route ilike '%north america to mexico%';

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'central_america'
where origin_region is null
  and region_or_route ilike '%central america%';

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'south_america_1'
where origin_region is null
  and (
    region_or_route ilike '%south america region 1%'
    or region_or_route ilike '%south america 1%'
    or region_or_route ilike '%north america to south america (north%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'south_america_2'
where origin_region is null
  and (
    region_or_route ilike '%south america region 2%'
    or region_or_route ilike '%south america 2%'
    or region_or_route ilike '%north america to south america (south%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'south_pacific'
where origin_region is null
  and (
    region_or_route ilike '%south pacific%'
    or region_or_route ilike '%north america to australia%'
    or region_or_route ilike '%us to australia%'
    or region_or_route ilike '%us to new zealand%'
    or region_or_route ilike '%us west to fiji%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'sub_saharan_africa'
where origin_region is null
  and (
    region_or_route ilike '%north america to africa%'
    or region_or_route ilike '%us to africa%'
    or region_or_route ilike '%north america to africa / middle east%'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'hawaii'
where origin_region is null
  and (
    region_or_route ilike '%us to hawaii%'
    or region_or_route ilike '%north america to hawaii%'
  );

-- ============================================================
-- Distance bands (AA chart + similar distance-banded programs)
-- ============================================================

update partner_redemptions set
  distance_band_low = 0, distance_band_high = 700
where distance_band_low is null
  and region_or_route ilike '%(~0-700 mi)%';

update partner_redemptions set
  distance_band_low = 701, distance_band_high = 1400
where distance_band_low is null
  and region_or_route ilike '%(~701-1400 mi)%';

update partner_redemptions set
  distance_band_low = 1401, distance_band_high = 2125
where distance_band_low is null
  and region_or_route ilike '%(~1401-2125 mi)%';

update partner_redemptions set
  distance_band_low = 2126, distance_band_high = 3000
where distance_band_low is null
  and region_or_route ilike '%(~2126-3000 mi)%';

update partner_redemptions set
  distance_band_low = 3001, distance_band_high = 4000
where distance_band_low is null
  and region_or_route ilike '%(~3001-4000 mi)%';

update partner_redemptions set
  distance_band_low = 4001, distance_band_high = 5500
where distance_band_low is null
  and region_or_route ilike '%(~4001-5500 mi)%';

update partner_redemptions set
  distance_band_low = 5501, distance_band_high = 7000
where distance_band_low is null
  and region_or_route ilike '%(~5501-7000 mi)%';

update partner_redemptions set
  distance_band_low = 7001, distance_band_high = 10000
where distance_band_low is null
  and (region_or_route ilike '%(~7001-10000 mi)%' or region_or_route ilike '%long-haul (us to asia / eu)%');

-- Avios-specific distance bands (per BA's published 2026 chart)
-- Band 1: 1-650, Band 2: 651-1151, Band 3: 1152-2000, Band 4: 2001-3000,
-- Band 5: 3001-4000, Band 6: 4001-5500, Band 7: 5501-6500, Band 8: 6501+
update partner_redemptions set
  distance_band_low = 1, distance_band_high = 650
where distance_band_low is null and region_or_route ilike '%avios band 1%';

update partner_redemptions set
  distance_band_low = 651, distance_band_high = 1151
where distance_band_low is null and region_or_route ilike '%avios band 2%';

update partner_redemptions set
  distance_band_low = 1152, distance_band_high = 2000
where distance_band_low is null and region_or_route ilike '%avios band 3%';

update partner_redemptions set
  distance_band_low = 2001, distance_band_high = 3000
where distance_band_low is null and region_or_route ilike '%avios band 4%';

update partner_redemptions set
  distance_band_low = 3001, distance_band_high = 4000
where distance_band_low is null and region_or_route ilike '%avios band 5%';

update partner_redemptions set
  distance_band_low = 4001, distance_band_high = 5500
where distance_band_low is null and region_or_route ilike '%avios band 6%';

update partner_redemptions set
  distance_band_low = 5501, distance_band_high = 6500
where distance_band_low is null and region_or_route ilike '%avios band 7%';

update partner_redemptions set
  distance_band_low = 6501, distance_band_high = 99999
where distance_band_low is null and region_or_route ilike '%avios band 8%';

-- Audit / sanity check helper view: rows where neither structured field
-- got populated. After running this migration, query this in Supabase
-- Studio to find the gap; remaining rows need manual classification.
--   select id, currency_program_id, operating_carrier_id, region_or_route
--   from partner_redemptions
--   where is_active
--     and origin_region is null
--     and dest_region is null
--     and distance_band_low is null
--     and distance_band_high is null;
