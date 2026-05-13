-- Fixup migration for migration 089 — picks up the AA distance-band rows
-- whose region_or_route strings didn't match the original ILIKE patterns.
--
-- BACKGROUND
-- ----------
-- Audit after running 087/088/089 found 60 unmatched rows (50% of active
-- rows), all AA partner_redemptions with strings like:
--   'AA distance band 1 (0-650 mi)'  → 8 rows
--   'AA distance band 2 (651-1150 mi)'  → 8 rows
--   'AA distance band 3 (1151-2000 mi)'  → 8 rows
--   'AA distance band 4 (2001-3000 mi)'  → 8 rows
--   'AA distance band 5 (3001-4000 mi) - US East Coast to Europe'  → 8 rows
--   'AA distance band 6 (4001-5500 mi) - US West Coast to Europe'  → 8 rows
--   'AA domestic' / 'AA domestic / transcon' → 3 rows
--   'AA short-haul' / 'AA short-haul (<750 mi)' / round-trip → 3 rows
--   'AA medium-haul (750-2750 mi)' / 'AA medium-haul / transcon' → 2 rows
--   'AA long-haul' / 'AA long-haul (round-trip)' → 4 rows (DEFERRED — ambiguous)
--
-- Bands 5 + 6 explicitly call out US East Coast / West Coast to Europe, so
-- these rows are HYBRID (both distance band AND region pair). Populate
-- both for those rows.

-- ============================================================
-- AA distance bands 1-4 (intra-North America for 1-3, transcon for 4)
-- ============================================================

update partner_redemptions set
  distance_band_low = 0, distance_band_high = 650,
  origin_region = 'north_america', dest_region = 'north_america'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 1%';

update partner_redemptions set
  distance_band_low = 651, distance_band_high = 1150,
  origin_region = 'north_america', dest_region = 'north_america'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 2%';

update partner_redemptions set
  distance_band_low = 1151, distance_band_high = 2000,
  origin_region = 'north_america', dest_region = 'north_america'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 3%';

update partner_redemptions set
  distance_band_low = 2001, distance_band_high = 3000,
  origin_region = 'north_america', dest_region = 'north_america'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 4%';

-- ============================================================
-- AA distance bands 5-6 (hybrid: distance + transatlantic region pair)
-- ============================================================

update partner_redemptions set
  distance_band_low = 3001, distance_band_high = 4000,
  origin_region = 'north_america', dest_region = 'europe'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 5%';

update partner_redemptions set
  distance_band_low = 4001, distance_band_high = 5500,
  origin_region = 'north_america', dest_region = 'europe'
where is_active and origin_region is null
  and region_or_route ilike '%AA distance band 6%';

-- ============================================================
-- AA short-haul / domestic / transcon (intra-North America patterns)
-- ============================================================

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'north_america',
  distance_band_low = 0, distance_band_high = 750
where is_active and origin_region is null
  and region_or_route ilike 'AA short-haul (<750%';

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'north_america'
where is_active and origin_region is null
  and (
    region_or_route = 'AA domestic'
    or region_or_route = 'AA short-haul'
    or region_or_route = 'AA short-haul (round-trip)'
    or region_or_route = 'AA domestic / transcon'
    or region_or_route = 'AA medium-haul / transcon'
  );

update partner_redemptions set
  origin_region = 'north_america', dest_region = 'north_america',
  distance_band_low = 750, distance_band_high = 2750
where is_active and origin_region is null
  and region_or_route ilike '%AA medium-haul (750-2750%';

-- ============================================================
-- AA long-haul (DEFERRED — too ambiguous to auto-classify)
-- ============================================================
-- "AA long-haul" / "AA long-haul (round-trip)" could be transatlantic OR
-- transpacific OR Africa OR South America. Without per-row context we
-- can't safely auto-fill these. Total: 4 rows. Manual classification path:
--
--   select id, currency_program_id, operating_carrier_id, region_or_route, notes
--   from partner_redemptions
--   where is_active and origin_region is null and region_or_route ilike '%long-haul%';
--
-- Then UPDATE each row individually with the correct origin_region /
-- dest_region based on the operating carrier (e.g. JAL -> asia_1,
-- Cathay -> asia_2, Etihad -> middle_east, BA -> europe, Qantas ->
-- south_pacific). The full set is small enough to handle by hand.
