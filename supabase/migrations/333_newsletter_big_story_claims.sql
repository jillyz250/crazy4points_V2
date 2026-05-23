-- NL1b — Big Story fact-check storage.
--
-- After the Big Story article is generated via writeBigStoryHtml,
-- verifyBigStoryDraft runs (Haiku) and produces a per-claim verdict against
-- the source alert's prose + verified_terms. Persist the claim list so the
-- editor can render green/red chips on reload without re-running the call.
--
-- Nullable: rows that pre-date NL1b stay clean; the editor treats null as
-- "no fact-check has been run yet."
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS big_story_claims jsonb;

COMMENT ON COLUMN newsletters.big_story_claims IS
  'NL1b — VerifyClaim[] from verifyBigStoryDraft. Each claim: claim text, supported (true|false|"unsupported"), severity, source_excerpt.';
