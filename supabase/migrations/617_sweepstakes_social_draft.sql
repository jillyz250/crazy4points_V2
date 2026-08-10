-- On-demand Facebook draft per sweepstakes.
--
-- Instead of auto-drafting a post for every sweep the watcher finds (wasteful —
-- most never get posted), the admin clicks "Draft FB post" on the ones worth
-- promoting. The generated draft (brand-voice post + first-comment link) is
-- stored here so it persists and can be regenerated.

ALTER TABLE sweepstakes
  ADD COLUMN IF NOT EXISTS social_draft    text,
  ADD COLUMN IF NOT EXISTS social_draft_at timestamptz;

COMMENT ON COLUMN sweepstakes.social_draft IS
  'Last generated Facebook post draft (post body + first-comment link) for this sweep. On-demand via /admin/sweepstakes.';
