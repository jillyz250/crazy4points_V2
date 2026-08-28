-- Custom hero image for a sweepstakes (a designed graphic), separate from the
-- watcher-managed `image_url` (a favicon it overwrites every run). SweepCard and
-- the newsletter prefer hero_image_url when set; the watcher never touches it.
ALTER TABLE sweepstakes ADD COLUMN IF NOT EXISTS hero_image_url text;
