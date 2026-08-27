-- Quantity remaining on a listing (e.g. "Quantity available: 26"), parsed from
-- the detail page during enrichment. Powers the "N left" line in flash-drop
-- alerts and on the experiences cards. NULL = unknown.
ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS quantity_available integer;
