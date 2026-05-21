-- Phase 3 Wave 1 — schema additions needed for alerts → variants backfill + dual-write.
--
-- Two surgical additions, both idempotent:
--   1. topics.metadata jsonb — catch-all for editorial_scores, source markers,
--      and any per-topic facts that don't have a dedicated column.
--   2. content_variants.archived_at timestamptz — set when a variant flips to
--      'archived' so we can audit *when* and tell soft-rejects from manual
--      archives.
--
-- No data is touched. Trigger ships in migration 318 (after backfill runs).

alter table topics
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column topics.metadata is
  'Catch-all jsonb for cross-format topic facts. Reserved keys: editorial_scores (impact/value/rarity/computed scores, why_this_matters, is_hot, impact_justification), source (provenance marker e.g. "alerts_backfill" for Phase 3 Wave 1 rows). Per-format facts live on content_variants.metadata.';

alter table content_variants
  add column if not exists archived_at timestamptz;

comment on column content_variants.archived_at is
  'Timestamp set when status flipped to archived. Distinguishes soft-rejects (set by alerts dual-write trigger) from manual archives. Null while variant is active.';
