-- Fix brand inference for Marriott properties whose names didn't match
-- the original patterns in scripts/scrape-properties.mjs.
--
-- Two classes of misses:
--   1. "<City> Marriott" or "<City> Marriott <Descriptor>" - the original
--      regex only matched "Marriott" at the start of the name. Adding a
--      generic Marriott-anywhere fallback as the LAST inference step
--      so more specific patterns (JW Marriott, Marriott Vacation Club)
--      still win.
--   2. Newer brands missing entirely: Postcard Cabins (acquired Getaway
--      House 2024), StudioRes (extended-stay launched 2024), citizenM
--      (added to Bonvoy 2025), Walt Disney World Dolphin/Swan (Marriott-
--      managed Disney conference hotels).

update hotel_properties set brand = 'Postcard Cabins',
  category = '1-4 (estimated)', off_peak_points = 5000, standard_points = 28000, peak_points = 65000
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand is null and name ilike '%Postcard Cabins%';

update hotel_properties set brand = 'StudioRes',
  category = '1-4 (estimated)', off_peak_points = 5000, standard_points = 28000, peak_points = 65000
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand is null and name ilike '%StudioRes%';

update hotel_properties set brand = 'citizenM',
  category = '3-6 (estimated)', off_peak_points = 15000, standard_points = 55000, peak_points = 105000
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand is null and name ilike '%citizenM%';

update hotel_properties set brand = 'Walt Disney World',
  category = '4-7 (estimated)', off_peak_points = 22000, standard_points = 76000, peak_points = 125000
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand is null and (name ilike '%Walt Disney World Dolphin%' or name ilike '%Walt Disney World Swan%');

-- Generic Marriott-anywhere fallback (Premium tier 4-7)
-- Run AFTER the above so more-specific patterns win.
update hotel_properties set brand = 'Marriott',
  category = '4-7 (estimated)', off_peak_points = 22000, standard_points = 76000, peak_points = 125000
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand is null and name ~ '\mMarriott\M';

-- Add notes for the newly-tagged rows
update hotel_properties set
  notes = 'Brand-tier estimate: ' || brand || ' typically falls in this category band. Marriott does not publish static categories; verify nightly cost on marriott.com before booking.'
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and notes is null and brand is not null;
