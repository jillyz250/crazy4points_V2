-- Editorial curation flag for experiences.
--
-- Until now, the /experiences "featured" galleries were gated purely on whether
-- the scraper happened to grab an image_url (77% of listings have one, so it
-- picked almost everything) plus a keyword-in-title guess. There was no signal
-- for "this experience is genuinely special." This adds one: a human (Jill) ticks
-- ⭐ Feature in the new /admin/experiences review screen, and the public page's
-- featured galleries drive off THIS flag instead of image luck.
--
-- featured_at records when it was promoted (for ordering / auditing). Featuring a
-- listing also implies it's been reviewed, so the app stamps editorial_reviewed_at
-- at the same time.

ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

-- Fast lookup for the public featured galleries (active + featured).
CREATE INDEX IF NOT EXISTS experience_listings_featured_idx
  ON experience_listings (featured)
  WHERE featured = true;
