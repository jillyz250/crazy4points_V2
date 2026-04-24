-- Cache of fetched official FAQ / terms pages per program.
-- Populated by enrichIntelContext before the writer runs, so the alert draft
-- has access to real fee tables, exclusions, and tier rules without
-- fabrication. TTL enforced in app code (24h); no pg-level expiry.
--
-- One row per program (pk = program_id). When the admin edits a program's
-- official_faq_url, the next enrichment run detects url mismatch and
-- refetches, overwriting the row.

create table if not exists program_faq_cache (
  program_id  uuid primary key references programs(id) on delete cascade,
  url         text        not null,
  content     text        not null,
  fetched_at  timestamptz not null default now()
);

comment on table program_faq_cache is
  'Cached official FAQ / terms page per program. 24h TTL enforced in app code.';
comment on column program_faq_cache.url is
  'The URL that was fetched. Checked against programs.official_faq_url to detect edits — mismatch triggers refetch.';
