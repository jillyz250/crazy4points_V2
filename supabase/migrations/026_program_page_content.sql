-- Public airline page content. Adds editorial fields to the programs table
-- so each program can render a points-focused cheat sheet at /programs/[slug]
-- (Phase 2 ships the route; this migration is Phase 1 — backend only).
--
-- Five columns:
--   intro              — voicey "why this program matters" (markdown)
--   transfer_partners  — array of {from_slug, ratio, notes, bonus_active}
--   sweet_spots        — curated redemptions with mile cost (markdown)
--   quirks             — expiry, family pooling, stopovers, oddities (markdown)
--   content_updated_at — set on every write so admin shows staleness pill
--
-- Notably distinct from faq_content (manual-paste FAQ for writer grounding):
-- this content is PUBLIC-FACING; faq_content is private writer context.
-- Phase 2+ may unify them; for now they coexist.
--
-- Full plan: plans/airline-pages.md

alter table programs
  add column if not exists intro              text,
  add column if not exists transfer_partners  jsonb,
  add column if not exists sweet_spots        text,
  add column if not exists quirks             text,
  add column if not exists content_updated_at timestamptz;

comment on column programs.intro is
  'Public-facing 1-2 paragraph intro. Markdown. Brand voice survives here.';
comment on column programs.transfer_partners is
  'Array of {from_slug, ratio, notes, bonus_active}. Rendered as a clean table on the public page.';
comment on column programs.sweet_spots is
  'Curated redemption examples with mile cost. Markdown.';
comment on column programs.quirks is
  'Expiry rules, family pooling, stopovers, anything weird points-relevant. Markdown.';
comment on column programs.content_updated_at is
  'Set on every page-content write. Admin shows a staleness warning when > 60 days old.';
