-- 631_official_sources.sql
-- Source Canonicalization Layer (Accuracy Agent, Phase 2 — right-sized).
-- The registry that tells the fact-checker the CORRECT official page for a fact,
-- so reconciliation stops grabbing the wrong URL (a card ad page instead of the
-- transfer chart). Deliberately small: no confidence scores, no cookie-chains.
--
-- Lookup key: (entity_type, entity_slug, fact_type). fact_type NULL = the
-- general official page for that entity. The fact-checker prefers the most
-- specific match, then the general one.

create table if not exists public.official_sources (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,               -- program | card
  entity_slug text not null,               -- programs.slug / credit_cards.slug
  fact_type text,                          -- transfer_ratio | signup_bonus | benefit | lounge_access | ... (NULL = general)
  canonical_url text not null,
  fetch_method text not null default 'firecrawl',  -- firecrawl | browser | static
  expected_markers text[],                 -- text we expect to see on the page (a fetched-the-right-page sanity check)
  stability text not null default 'volatile',      -- stable | volatile (how often it drifts / is personalized)
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists official_sources_key_idx
  on public.official_sources (entity_type, entity_slug, coalesce(fact_type, ''));

create index if not exists official_sources_entity_idx
  on public.official_sources (entity_type, entity_slug);
