-- Content fingerprinting on extractions.
--
-- Cost-reduction goal: when a refresh-cycle scrape returns markdown
-- IDENTICAL to the last extraction's markdown, we can skip the Sonnet
-- extraction + verification calls entirely. The page hasn't changed —
-- the existing extraction is still correct — we just need to bump
-- last_verified.
--
-- Stores a SHA-256 of the scraped markdown alongside each extraction row.
-- On the next refresh, the pipeline compares the new scrape's hash to
-- the most-recent extraction's hash for the same entity. Match → skip
-- Sonnet, save ~$0.30 per card / ~$0.20 per program field group.
--
-- Estimated savings: 50-80% on auto-refresh cron runs (most refreshes
-- find unchanged content). Manual extractions still always run because
-- the editor explicitly clicked "Run extraction" intending to re-verify.

alter table credit_card_extractions
  add column if not exists markdown_hash text;

alter table program_extractions
  add column if not exists markdown_hash text;

create index if not exists credit_card_extractions_hash_idx
  on credit_card_extractions (card_id, markdown_hash);

create index if not exists program_extractions_hash_idx
  on program_extractions (program_id, markdown_hash);

comment on column credit_card_extractions.markdown_hash is
  'SHA-256 of raw_markdown. Used by the auto-refresh pipeline to skip Sonnet when scraped content matches the last extraction (no changes since last refresh).';

comment on column program_extractions.markdown_hash is
  'SHA-256 of raw_markdown. Same purpose as credit_card_extractions.markdown_hash.';

-- Extend the status enum to include 'skipped_unchanged' — used when auto-refresh
-- detects the markdown hash matches the last extraction and skips Sonnet.
alter table credit_card_extractions
  drop constraint if exists credit_card_extractions_status_check;
alter table credit_card_extractions
  add constraint credit_card_extractions_status_check
  check (status in ('extracted', 'saved', 'rejected', 'failed', 'skipped_unchanged'));

alter table program_extractions
  drop constraint if exists program_extractions_status_check;
alter table program_extractions
  add constraint program_extractions_status_check
  check (status in ('extracted', 'reviewing', 'completed', 'rejected', 'failed', 'skipped_unchanged'));
