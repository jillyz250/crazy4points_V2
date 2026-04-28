-- Multi-program source support for content_ideas.
--
-- Until now, an idea could only have one `primary_program_slug` — fine for
-- single-program articles ("Hyatt 80K in Europe") but breaks comparison or
-- stacking pieces that span multiple programs ("Chase Hyatt Personal vs
-- Business" needs both Chase and Hyatt as source data).
--
-- This adds a nullable text array of secondary slugs. The fact-check and
-- writer pipelines combine primary + secondary into a single program-source
-- block, deduped by slug. Empty array / null means "no extras," same as
-- today's behavior.

alter table content_ideas
  add column if not exists secondary_program_slugs text[];

-- No backfill needed; null/empty array is correct for existing rows.
-- No CHECK constraint on values — same as primary_program_slug, validated
-- in app code at save time.

create index if not exists content_ideas_secondary_programs_idx
  on content_ideas using gin (secondary_program_slugs)
  where type = 'blog' and status = 'published';
