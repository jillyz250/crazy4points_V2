-- Backfill category + points for Marriott brands added to the inference
-- patcher in mig 125 (MGM Collection, Walt Disney World, StudioRes,
-- citizenM, Postcard Cabins) but not in mig 122's CASE expression.
--
-- Mig 125's UPDATEs only ran on rows where brand was null at the time,
-- so any rows scraped AFTER mig 125 (e.g. Texas + Georgia retries) had
-- the brand correctly inferred by the script but missed mig 122's
-- category mapping (which only knew about the original brand list).
--
-- This migration covers the gap. Re-runnable.

update hotel_properties set
  category = case brand
    when 'MGM Collection' then '6-8 (estimated)'
    when 'Walt Disney World' then '4-7 (estimated)'
    when 'StudioRes' then '1-4 (estimated)'
    when 'citizenM' then '3-6 (estimated)'
    when 'Postcard Cabins' then '1-4 (estimated)'
  end,
  off_peak_points = case brand
    when 'MGM Collection' then 40000
    when 'Walt Disney World' then 22000
    when 'StudioRes' then 5000
    when 'citizenM' then 15000
    when 'Postcard Cabins' then 5000
  end,
  standard_points = case brand
    when 'MGM Collection' then 105000
    when 'Walt Disney World' then 76000
    when 'StudioRes' then 28000
    when 'citizenM' then 55000
    when 'Postcard Cabins' then 28000
  end,
  peak_points = case brand
    when 'MGM Collection' then 175000
    when 'Walt Disney World' then 125000
    when 'StudioRes' then 65000
    when 'citizenM' then 55000  -- placeholder; revise once Postcard Cabins data settles
    when 'Postcard Cabins' then 65000
  end,
  notes = coalesce(notes, 'Brand-tier estimate: ' || brand || ' typically falls in this category band. Marriott does not publish static categories; verify nightly cost on marriott.com before booking.'),
  updated_at = now()
where program_id = (select id from programs where slug = 'marriott-bonvoy')
  and brand in ('MGM Collection', 'Walt Disney World', 'StudioRes', 'citizenM', 'Postcard Cabins')
  and category is null;
