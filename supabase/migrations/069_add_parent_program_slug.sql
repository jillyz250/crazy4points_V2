-- Add parent_program_slug to programs.
--
-- BACKGROUND
-- ----------
-- Some airlines share a single loyalty program with another carrier:
--
--   Alaska Airlines + Hawaiian Airlines → Atmos
--   Air France + KLM                    → Flying Blue
--
-- Per migration 058, the carriers and the loyalty program each get
-- their own row. But there's no foreign key linking the carrier to its
-- loyalty program — the relationship was previously editorial-only.
--
-- This column makes that link explicit so the Resources nav (and other
-- callers) can render "Loyalty program: Atmos →" pointers on carrier
-- cards that lack their own transfer partners.
--
-- For standalone airlines (Delta, United, AA, etc.) the column stays
-- null — they ARE the loyalty program.

alter table programs
  add column if not exists parent_program_slug text;

comment on column programs.parent_program_slug is
  'For carrier rows in a joint loyalty program (e.g. alaska→atmos, air_france→flying_blue): the slug of the loyalty program where transfer partners and status content live. Null for standalone programs.';

-- Backfill known joint-program carriers.
update programs set parent_program_slug = 'atmos'       where slug = 'alaska';
update programs set parent_program_slug = 'atmos'       where slug = 'hawaiian';
update programs set parent_program_slug = 'flying_blue' where slug = 'air_france';
update programs set parent_program_slug = 'flying_blue' where slug = 'klm';
