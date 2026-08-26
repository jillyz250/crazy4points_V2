-- 633_official_sources_tier.sql
-- Multi-source verification for login-gated facts (Jill, 2026-08-26).
-- Some facts (Chase/Amex transfer ratios) have no PUBLIC official page. For those
-- we register a GROUP of reliable sources and treat the fact as soft-verified when
-- they mostly agree. This is for VERIFICATION/monitoring only — published content
-- still cites official/issuer sources.
--
-- tier:
--   official      = the issuer's/program's own page (highest authority; one is enough)
--   corroborating = a reliable third-party source, used only as a consensus group

alter table public.official_sources
  add column if not exists tier text not null default 'official';

-- Allow MULTIPLE sources per (entity, fact) — distinguished by URL.
drop index if exists official_sources_key_idx;
create unique index if not exists official_sources_key_idx
  on public.official_sources (entity_type, entity_slug, coalesce(fact_type, ''), canonical_url);
