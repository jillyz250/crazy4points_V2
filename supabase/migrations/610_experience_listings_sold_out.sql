-- Experiences finder: flag listings that are sold out but still listed.
--
-- The watch scrapes each program's CATALOG page and tracks a listing's
-- lifecycle (active / closed / archived) by whether it still appears there and
-- whether its event has passed. But a listing can remain in the catalog while
-- its DETAIL page shows every package "Sold out" (common on Marriott Bonvoy
-- Moments). Those surfaced in the finder as bookable, so users clicked through
-- to a dead end.
--
-- A daily availability re-check (/api/cron/experiences-availability) fetches
-- each active redeem/access listing's detail page and sets sold_out. sold_out is
-- orthogonal to status: a sold-out listing is still "active" (still listed), we
-- just flag it, sort it last, and let the finder filter it out.

ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS sold_out boolean NOT NULL DEFAULT false;

ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS availability_checked_at timestamptz;

COMMENT ON COLUMN experience_listings.sold_out IS
  'True when the detail page shows no redeemable package (fully sold out) at the last availability check. Orthogonal to status: sold-out rows stay active/listed but are flagged and sorted last in the finder. As fresh as availability_checked_at.';

COMMENT ON COLUMN experience_listings.availability_checked_at IS
  'When /api/cron/experiences-availability last fetched this listing''s detail page to set sold_out. NULL = never checked.';
