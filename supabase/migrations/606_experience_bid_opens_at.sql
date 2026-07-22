-- Phase 2 of the experiences finder: capture when bidding OPENS.
--
-- Many Marriott listings show "Packages Available In 56 Days" - bidding has not
-- started yet. Without this, the finder showed those as "Experience Oct 28",
-- hiding that you cannot bid yet, and labelled the starting bid as a current
-- bid. This column lets the status line say "Bidding opens ~Oct 15" instead.
--
-- Nullable: null means bidding is already open (the common case) or the open
-- date is unknown. Only future-dated rows change the render.

ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS bid_opens_at timestamptz;

COMMENT ON COLUMN experience_listings.bid_opens_at IS
  'When bidding/redemption opens, derived from the source "available in" countdown at scrape time. NULL = already open or unknown. Approximate: only as fresh as the last scrape.';
