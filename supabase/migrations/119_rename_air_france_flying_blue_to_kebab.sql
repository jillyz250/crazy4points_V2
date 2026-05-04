-- Normalize the two remaining underscore-slug program rows to kebab-case
-- per feedback_program_slug_convention: air_france -> air-france and
-- flying_blue -> flying-blue. Same shape as mig 102 which fixed
-- marriott_bonvoy -> marriott-bonvoy.
--
-- Cascading updates:
--   1. programs.slug (the rename itself)
--   2. programs.parent_program_slug (air-france and klm both point to flying-blue)
--   3. programs.member_programs JSONB on skyteam (air_france entry needs
--      program_slug + carrier_slugs + notes references to /programs/flying_blue)
--
-- NOT touching the many other underscore refs in skyteam/oneworld/star_alliance
-- member_programs JSONB (china_airlines, korean_air, kenya_airways, etc.) -
-- those reference programs not yet authored. They'll get normalized when each
-- program is authored.
--
-- URL redirect added in next.config.ts in the same change so old indexed URLs
-- (/programs/air_france, /programs/flying_blue) 308 to the new kebab paths.

-- ============================================================
-- 1. Rename programs.slug
-- ============================================================
update programs set slug = 'air-france' where slug = 'air_france';
update programs set slug = 'flying-blue' where slug = 'flying_blue';

-- ============================================================
-- 2. Update parent_program_slug references
-- ============================================================
update programs set parent_program_slug = 'flying-blue'
where parent_program_slug = 'flying_blue';

-- ============================================================
-- 3. Fix skyteam.member_programs JSONB references
-- ============================================================
-- This rewrites the air_france member entry in-place using regex to swap
-- the slug values. The text-level replace is safe because both
-- "air_france" and "flying_blue" are unique enough strings inside the
-- JSON not to collide with prose (the only places they appear are slug
-- fields and notes references).
update programs set
  member_programs = (member_programs::text)::jsonb
where slug = 'skyteam';

update programs set
  member_programs = replace(replace(
    member_programs::text,
    '"air_france"', '"air-france"'
  ), '/programs/flying_blue', '/programs/flying-blue')::jsonb
where slug = 'skyteam' and member_programs::text ~ 'air_france|flying_blue';

-- ============================================================
-- 4. Verify
-- ============================================================
-- After this migration:
--   * programs has rows for slug = 'air-france' and 'flying-blue'
--   * NO programs row has slug containing underscore for air_france/flying_blue
--   * skyteam.member_programs uses kebab program_slug and carrier_slugs
