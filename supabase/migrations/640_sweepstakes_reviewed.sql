-- "Reviewed" curation flag for sweepstakes, mirroring experience_listings'
-- editorial_reviewed_at. Jill works the /admin/sweepstakes list top-to-bottom;
-- marking a sweep Reviewed (whether or not she Features it) drops it out of the
-- "still to look at" view so the board shrinks as she curates, exactly like the
-- Experiences review flow. featured/posted_social are separate signals.

ALTER TABLE sweepstakes
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS sweepstakes_reviewed_idx
  ON sweepstakes (reviewed_at)
  WHERE reviewed_at IS NULL;
