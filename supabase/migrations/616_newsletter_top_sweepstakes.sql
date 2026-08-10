-- Newsletter "Top Sweepstakes to Enter" section.
--
-- Auto-filled from the `sweepstakes` table: the sweeps Jill has marked posted to
-- social (posted_social) that are still running, soonest deadline first, top 3.
-- The editor pulls + trims them (like top_experiences); the email + public
-- archive render the section and link to the public /sweepstakes page.

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS top_sweepstakes jsonb;

COMMENT ON COLUMN newsletters.top_sweepstakes IS
  'Newsletter "Top Sweepstakes to Enter" cards (TopSweepstakesItem[]). Auto-pulled from sweepstakes where posted_social + running.';
