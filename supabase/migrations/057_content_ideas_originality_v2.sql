-- Phase 5 — originality v2: confidence score + per-passage flags + threshold.
--
-- The original originality_pass boolean was a coarse signal — "did Sonnet
-- find a near-duplicate." It didn't tell the editor:
--   • How confident the model was overall (60% confident? 95%?)
--   • Which passages specifically tripped it
--   • What threshold was applied (so the editor can re-run with a stricter
--     bar if they want)
--   • What the matched URL was (so the editor can verify themselves)
--
-- Three new nullable columns. All optional so existing rows keep working
-- with the boolean `originality_pass` from migration 015. Renderers
-- gracefully fall back to the legacy boolean when the new fields are NULL.
--
-- Threshold convention: pass = confidence_score >= threshold. Default
-- threshold is 70 (chosen because anything below is genuinely concerning;
-- 60-70 zone catches paraphrase-without-attribution risks; <60 = clear
-- duplicate). Editor can override per-idea by setting the column directly.

alter table content_ideas
  add column if not exists originality_confidence_score smallint,
  add column if not exists originality_threshold smallint default 70,
  add column if not exists originality_flagged_passages jsonb;

comment on column content_ideas.originality_confidence_score is
  'Sonnet-judged overall originality confidence, 0-100. NULL = legacy check (only the boolean originality_pass is set).';

comment on column content_ideas.originality_threshold is
  'Threshold applied at last check. pass = confidence_score >= threshold. Default 70.';

comment on column content_ideas.originality_flagged_passages is
  'Array of FlaggedPassage objects: { text, matched_url, matched_excerpt, confidence, why }. See utils/ai/originalityCheck.ts for schema.';
