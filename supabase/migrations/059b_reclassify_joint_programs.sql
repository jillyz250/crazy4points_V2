-- Reclassify joint loyalty programs as type='loyalty_program'.
--
-- Run AFTER 059_add_loyalty_program_type.sql has committed (Postgres
-- requires the new enum value to be committed before it can be used in
-- DML). In Supabase Studio, that means running this file in a separate
-- click of "Run" after the previous file.
--
-- After this migration:
--   • /admin/programs?type=airline shows actual airlines only
--   • /admin/programs?type=loyalty_program shows Flying Blue + Atmos
--   • Public page render at /programs/[slug] is unchanged

update programs set type = 'loyalty_program' where slug in ('flying_blue', 'atmos');
