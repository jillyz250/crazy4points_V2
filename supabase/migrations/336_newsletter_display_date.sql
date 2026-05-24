-- Editor-set display date for the newsletter header.
--
-- Without this, the rendered email always shows TODAY (or sent_at for
-- already-sent newsletters). That's wrong when an editor is preparing a
-- draft today to send tomorrow — they want the email header to say
-- tomorrow's date, not today's.
--
-- formatNewsletterDate() picks this up first:
--   display_date (editor override) → sent_at (archive) → now()
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS display_date date;

COMMENT ON COLUMN newsletters.display_date IS
  'Editor-set send date for the email header. NULL = use sent_at or NOW().';
