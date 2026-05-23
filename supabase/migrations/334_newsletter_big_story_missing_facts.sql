-- NL1b completeness — store the "facts the source has that the article
-- omits" list alongside the supported/unsupported claim list.
--
-- The first verifier pass (migration 333) catches articles that say wrong
-- things. This pass catches articles that forget to say important things
-- (event dates, multiple cities, eligibility constraints, etc.). Stored
-- separately so the editor can render two distinct sections in admin.
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS big_story_missing_facts jsonb;

COMMENT ON COLUMN newsletters.big_story_missing_facts IS
  'NL1b completeness — MissingFact[] from verifyBigStoryDraft: facts present in source but absent from article. Each: fact text, severity, source_excerpt.';
