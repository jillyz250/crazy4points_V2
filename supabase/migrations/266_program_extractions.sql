-- Program extraction pipeline — same architecture as credit_card_extractions
-- but for the programs table (airlines, alliances, hotels, currencies).
--
-- 1. program_extractions    — cache of every extraction run (raw markdown,
--                              Claude JSON, status). Audit trail; replay-safe.
-- 2. program_field_history  — per-field snapshot before any UPDATE to programs
--                              (rollback path; ensures we never silently lose
--                              the manually-authored content we have today).
--
-- PER-FIELD APPROVAL ARCHITECTURE
--   Extraction writes to program_extractions.extraction (jsonb).
--   Editor reviews diff in admin → clicks Apply per field.
--   Apply action:
--     a. Snapshots current programs.<field> value to program_field_history
--     b. Updates programs.<field> with the extracted value
--     c. Marks the field in program_extractions.applied_fields jsonb so
--        editor sees what's already been applied across review sessions.
--   No bulk save. No auto-overwrite. Field-by-field, with rollback.

-- ── 1. program_extractions cache ────────────────────────────────────────

create table if not exists program_extractions (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references programs(id) on delete cascade,

  source_url      text not null,
  raw_markdown    text,
  markdown_chars  integer,
  used_interactive boolean not null default false,

  -- Full extracted JSON (the ProgramExtraction schema shape, including
  -- intro, sweet_spots, lounge_access, tier_benefits, hubs, quirks,
  -- award_chart, transfer_partners, alliance, etc.)
  extraction      jsonb not null,

  -- Tracks which extracted fields have been applied to the programs row.
  -- Shape: { "intro": "applied", "sweet_spots": "skipped", "lounge_access": "applied", ... }
  -- Lets the admin view show "Applied" / "Skipped" badges per field across
  -- multiple review sessions.
  applied_fields  jsonb not null default '{}'::jsonb,

  model           text not null,
  input_tokens    integer,
  output_tokens   integer,
  cost_usd        numeric(10,4),

  -- Review-pass audit (two-pass pattern from PR #496)
  review_pass_ran           boolean not null default false,
  review_pass_added_count   integer not null default 0,

  status          text not null default 'extracted'
    check (status in ('extracted', 'reviewing', 'completed', 'rejected', 'failed')),
  error_message   text,

  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists program_extractions_program_idx
  on program_extractions (program_id, created_at desc);

create index if not exists program_extractions_status_idx
  on program_extractions (status);

alter table program_extractions enable row level security;
drop policy if exists "program_extractions are publicly readable" on program_extractions;
create policy "program_extractions are publicly readable"
  on program_extractions for select to anon, authenticated using (true);

comment on table program_extractions is
  'One row per Firecrawl + Claude extraction run for a program. Cache so re-applying fields does not re-burn API credits; audit trail of model output vs. editor approval; source for diffing weekly re-scrapes.';

comment on column program_extractions.applied_fields is
  'Per-field application state. Keyed by field name (intro, sweet_spots, lounge_access, etc.). Values: applied | skipped | edited. UI shows badges per field across review sessions.';

-- ── 2. program_field_history (rollback safety net) ───────────────────────
-- Every UPDATE that the extract pipeline writes to programs.<field> first
-- snapshots the current value here. Editor can roll back any field if
-- Sonnet's version turns out worse than the manually-authored original.

create table if not exists program_field_history (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references programs(id) on delete cascade,
  field_name      text not null,

  -- Previous and new values stored as jsonb so we can handle any column type
  -- (text, text[], jsonb) uniformly.
  previous_value  jsonb,
  new_value       jsonb,

  -- Which extraction triggered this update (FK for audit)
  extraction_id   uuid references program_extractions(id) on delete set null,

  -- Editor who applied it (when we add user tracking)
  applied_by      text,

  -- Whether this change has been rolled back
  rolled_back     boolean not null default false,
  rolled_back_at  timestamptz,

  created_at      timestamptz not null default now()
);

create index if not exists program_field_history_program_idx
  on program_field_history (program_id, created_at desc);

create index if not exists program_field_history_extraction_idx
  on program_field_history (extraction_id) where extraction_id is not null;

alter table program_field_history enable row level security;
drop policy if exists "program_field_history is publicly readable" on program_field_history;
create policy "program_field_history is publicly readable"
  on program_field_history for select to anon, authenticated using (true);

comment on table program_field_history is
  'Rollback safety net for the program extraction pipeline. Every UPDATE to programs.<field> from an extraction first snapshots the prior value here, so the editor can revert to manually-authored content if Sonnet''s version is worse.';

-- ── 3. Add extraction source URL to programs ─────────────────────────────
-- Per-program URL that the extraction pipeline points at. Set once per
-- program; pre-fills on every future extraction (same pattern as
-- credit_cards.official_url + credit_cards.guide_to_benefits_url).

alter table programs
  add column if not exists extraction_source_url text;

comment on column programs.extraction_source_url is
  'Per-program URL the extraction pipeline scrapes. e.g., united.com/mileageplus, oneworld.com/about. Set once, pre-fills every future run. Editorial flexibility — when the official page moves, update this column and the next extraction picks up the new URL.';
