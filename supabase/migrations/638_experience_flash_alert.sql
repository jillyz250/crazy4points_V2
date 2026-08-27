-- Tracks when a flash-drop email alert was sent for a listing, so Jill gets each
-- ultra-cheap drop (United 100-mile / Marriott 1-point) emailed exactly once.
-- NULL = not yet alerted (candidate); set to the send time once emailed.

ALTER TABLE experience_listings
  ADD COLUMN IF NOT EXISTS flash_alert_sent_at timestamptz;
