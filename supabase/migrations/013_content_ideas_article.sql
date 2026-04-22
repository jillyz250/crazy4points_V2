-- Ship 10b — article body + verification metadata for content_ideas.
-- Four verification pills: written · fact-checked · voice-checked · original.
-- All nullable; an idea starts with nothing stamped and accumulates stamps as
-- subsequent ships (writer, verifier, originality checker) run.

alter table content_ideas
  add column if not exists article_body text,
  add column if not exists written_by text,
  add column if not exists written_at timestamptz,
  add column if not exists fact_checked_at timestamptz,
  add column if not exists fact_check_claims jsonb,
  add column if not exists voice_checked_at timestamptz,
  add column if not exists voice_notes text,
  add column if not exists originality_checked_at timestamptz,
  add column if not exists originality_notes text;
