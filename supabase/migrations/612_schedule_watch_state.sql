-- Airline schedule-open watcher.
--
-- Some carriers (Southwest, and to a lesser extent Alaska) release their flight
-- schedule in CHUNKS on an irregular cadence, and Southwest pre-announces the
-- date. Each opening is a high-engagement "book now" moment worth a Facebook
-- post + boost. This table remembers the last-seen booking horizon per airline
-- so a daily watcher can detect two events and drop a reminder:
--   1. ANNOUNCEMENT — next_extension_date newly published (heads-up)
--   2. OPENING — current_through_date jumps forward (post + boost, draft ready)
--
-- Dates are stored as ISO text (YYYY-MM-DD) extracted from the source page.

CREATE TABLE IF NOT EXISTS schedule_watch_state (
  airline_slug text PRIMARY KEY,
  airline_name text NOT NULL,
  source_url text,
  current_through_date text,     -- furthest date currently bookable
  next_extension_date text,      -- announced date the NEXT chunk drops
  next_extension_target text,    -- date that next chunk will open through
  last_checked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE schedule_watch_state IS
  'Per-airline booking-horizon memory for the schedule-open watcher (/api/cron/schedule-watch). Detects schedule openings and pre-announcements to prompt a FB post + boost.';
