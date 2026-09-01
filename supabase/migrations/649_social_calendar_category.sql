-- Editorial category for social posts (the content THEME, distinct from source_type
-- which is where it came from). Drives the category colors + the variety view so Jill
-- can rotate content types across days (experience -> sweepstakes -> sweet spot ->
-- program news ...). Also a `dedupe_key` so conceptual repeats (a reminder + its
-- recurring anchor about the same thing) collapse instead of showing twice.
ALTER TABLE social_calendar
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('experience','sweepstakes','sweet_spot','program_news','deal','guide','recurring','other')),
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE INDEX IF NOT EXISTS social_calendar_dedupe_key_idx ON social_calendar (dedupe_key);
