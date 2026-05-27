-- Facts Ledger Phase 2 — prose_fact_links table.
--
-- Maps content sections (program fields like intro / tier_benefits) back to
-- the verified facts they depend on. Enables:
--   1. Drift detection: when a fact changes, find affected paragraphs
--   2. Inline fact markers in admin editor (footnote-style citations)
--   3. Voice-preservation guard: warn editor when they introduce a claim
--      not backed by any ledger fact
--
-- Phase 2b ships this table + scripts/draft-program.mjs (which writes the
-- links as it drafts prose from verified facts). Phase 4 reads from it for
-- drift detection in the weekly cron.
--
-- Granularity: paragraph-level (Copilot validated this as the sweet spot
-- between sentence-level brittle and section-level too-coarse).

create table if not exists prose_fact_links (
  id              uuid primary key default gen_random_uuid(),

  -- The program whose prose is being annotated.
  program_slug    text not null,

  -- Which field this link applies to.
  -- Examples: 'intro', 'tier_benefits', 'sweet_spots', 'quirks',
  -- 'lounge_access', 'how_to_spend', 'award_chart'
  field_name      text not null,

  -- Paragraph-level anchor within the field. For prose fields, this is a
  -- sequence number (0-indexed) of the paragraph. For JSONB fields like
  -- tier_benefits, this is "<tier_index>.<benefit_index>" or similar
  -- (e.g. "2.3" = third tier, fourth benefit).
  fragment_anchor text not null,

  -- The fact this fragment cites. Multiple links per fragment if the
  -- paragraph references multiple facts.
  fact_id         uuid not null references program_facts(id) on delete cascade,

  -- Free-text snippet of the fragment so we can show inline context in
  -- admin even if the source prose changes slightly between renders.
  fragment_snippet text,

  created_at      timestamptz not null default now()
);

-- Lookup: for a program + field, find all linked facts
create index if not exists prose_fact_links_program_field_idx
  on prose_fact_links (program_slug, field_name);

-- Reverse lookup: for a fact, find every paragraph that depends on it
-- (drift detection: when fact X changes, query "what prose cites it?")
create index if not exists prose_fact_links_fact_idx
  on prose_fact_links (fact_id);

alter table prose_fact_links enable row level security;
drop policy if exists "prose_fact_links admin only" on prose_fact_links;
create policy "prose_fact_links admin only"
  on prose_fact_links for select to authenticated using (true);

comment on table prose_fact_links is
  'Maps program-page paragraphs back to verified facts in program_facts. Enables drift detection + inline fact markers. See plans/facts-ledger.md Phase 2b.';

comment on column prose_fact_links.fragment_anchor is
  'Paragraph-level anchor. For prose fields = sequence number (0-indexed). For JSONB fields = composite (e.g. "2.3" = tier 2, benefit 3).';
