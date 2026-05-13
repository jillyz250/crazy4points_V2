-- Credit card extractions cache.
--
-- Stores the raw Firecrawl markdown + structured Claude response for each
-- card-extraction run. Lets us re-run the save step without re-burning a
-- Firecrawl credit + Claude tokens, and gives us an audit trail of what
-- the model returned vs. what the editor approved.
--
-- One row per (card_id, run). Keep history — the weekly Firecrawl re-scrape
-- will append new rows, and the comparison vs. previous run is what powers
-- the welcome_bonus_record_high alert.

create table if not exists credit_card_extractions (
  id              uuid primary key default gen_random_uuid(),
  card_id         uuid not null references credit_cards(id) on delete cascade,

  source_url      text not null,
  raw_markdown    text,
  markdown_chars  integer,

  -- Full JSON response from Claude (the cardExtractionSchema shape).
  -- Stored verbatim so we can diff runs, replay save logic, or audit
  -- any field decision later.
  extraction      jsonb not null,

  model           text not null,
  input_tokens    integer,
  output_tokens   integer,
  cost_usd        numeric(10,4),

  status          text not null default 'extracted'
    check (status in ('extracted', 'saved', 'rejected', 'failed')),
  error_message   text,

  saved_at        timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists credit_card_extractions_card_idx
  on credit_card_extractions (card_id, created_at desc);

create index if not exists credit_card_extractions_status_idx
  on credit_card_extractions (status);

alter table credit_card_extractions enable row level security;
drop policy if exists "credit_card_extractions are publicly readable" on credit_card_extractions;
create policy "credit_card_extractions are publicly readable"
  on credit_card_extractions for select to anon, authenticated using (true);

comment on table credit_card_extractions is
  'One row per Firecrawl + Claude extraction run for a credit card. Cache so re-running the save step does not re-burn API credits; audit trail of model output vs. editor approval; source for diffing weekly re-scrapes.';

comment on column credit_card_extractions.extraction is
  'Full structured JSON from Claude matching utils/cards/cardExtractionSchema.ts shape. Source quotes inline per field for traceability.';

comment on column credit_card_extractions.status is
  'extracted = Claude returned data, awaiting save; saved = approved + written to credit_card_benefits/welcome_bonuses; rejected = editor rejected without saving; failed = Firecrawl/Claude error.';
