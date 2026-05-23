-- NL2a — Sweet Spot alert picker.
--
-- Mirrors the Big Story picker pattern (migration set 222 + later NL1a
-- behavior in code): a nullable ref_id pointing to the alert the editor
-- locked as the Sweet Spot anchor. When set, the bulk generator skips
-- selecting one itself and writes the Sweet Spot prose around the locked
-- alert. When null, current behavior is preserved (Sonnet picks).
--
-- ref_type kept open for parity with big_story_ref_type even though
-- Sweet Spot only takes alerts for now.
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS sweet_spot_ref_id uuid;

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS sweet_spot_ref_type text;

COMMENT ON COLUMN newsletters.sweet_spot_ref_id IS
  'NL2a — alert id locked by editor as the Sweet Spot anchor. NULL = Sonnet picks.';
COMMENT ON COLUMN newsletters.sweet_spot_ref_type IS
  'NL2a — kind of locked Sweet Spot ref. Currently only "alert"; field kept open for future intel/program-level Sweet Spots.';
