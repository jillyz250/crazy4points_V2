-- Editorial curation flag for sweepstakes, mirroring experience_listings.featured
-- (mig 636). Jill ⭐-picks the standout giveaways in /admin/sweepstakes and they
-- lead the "Featured" section of the redesigned /sweepstakes page.

ALTER TABLE sweepstakes
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

CREATE INDEX IF NOT EXISTS sweepstakes_featured_idx
  ON sweepstakes (featured)
  WHERE featured = true;
