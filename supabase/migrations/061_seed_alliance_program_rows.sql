-- Seed the three global airline alliances as program rows.
--
-- BACKGROUND
-- ----------
-- Migration 059 added 'alliance' to the program_type enum. This migration
-- inserts the three rows that use it:
--
--   * oneworld       (Alaska, AA, BA, Cathay, Finnair, Iberia, JAL,
--                     Malaysia, Qantas, Qatar, Royal Air Maroc,
--                     Royal Jordanian, SriLankan)
--   * skyteam        (Aerolineas Argentinas, AeroMexico, Air Europa,
--                     Air France, China Airlines, China Eastern,
--                     Delta, Garuda, ITA, Kenya, KLM, Korean Air,
--                     MEA, Saudia, TAROM, Vietnam, Virgin Atlantic,
--                     Xiamen)
--   * star_alliance  (Aegean, Air Canada, Air China, Air India,
--                     Air New Zealand, ANA, Asiana, Austrian, Avianca,
--                     Brussels, Copa, Croatia, EgyptAir, Ethiopian,
--                     EVA Air, LOT, Lufthansa, SAS, Shenzhen, Singapore,
--                     South African, SWISS, TAP, Thai, Turkish, United)
--
-- Editorial fields (intro, lounge_access, quirks, member_programs) are
-- filled in via /admin/programs once the alliance schema work lands.
-- Seed is intentionally minimal so the rows can be edited without conflict.
--
-- ON CONFLICT DO NOTHING -- safe to re-run.

insert into programs (slug, name, type, is_active) values
  ('oneworld',      'oneworld',       'alliance', true),
  ('skyteam',       'SkyTeam',        'alliance', true),
  ('star_alliance', 'Star Alliance',  'alliance', true)
on conflict (slug) do nothing;
