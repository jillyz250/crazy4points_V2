-- Add new enum values for joint loyalty programs and alliances.
--
-- BACKGROUND
-- ----------
-- Migration 058 added separate carrier rows for joint-loyalty-program situations:
--   • flying_blue (program) + air_france (carrier) + klm (carrier)
--   • atmos       (program) + alaska     (carrier) + hawaiian (carrier)
--
-- But the program rows (flying_blue, atmos) were left as type='airline' because
-- the program_type enum didn't yet recognize a separate program type. That
-- meant the admin "Airlines" tab showed both real airlines (Air France, KLM)
-- AND loyalty programs (Flying Blue, Atmos) mixed together — confusing for
-- editors and conceptually wrong.
--
-- 'alliance' is added now (no rows yet) to future-proof for SkyTeam,
-- Star Alliance, oneworld pages once the US carrier section is done.
--
-- IMPORTANT: Postgres requires ALTER TYPE ADD VALUE to commit before the
-- new value can be used. Run this file FIRST (alone), then run
-- 059b_reclassify_joint_programs.sql to update the rows.

alter type program_type add value if not exists 'loyalty_program';
alter type program_type add value if not exists 'alliance';
