-- Seed Star Alliance member airline program rows that don't exist yet.
--
-- BACKGROUND
-- ----------
-- Authoring the Star Alliance alliance page (migration 061 seeded the alliance
-- row; migration 062 added the member_programs jsonb column).
--
-- Star Alliance has 26 full members as of April 2026. Confirmed missing
-- carrier rows: air_canada, air_new_zealand, ana, avianca, copa, eva_air,
-- lufthansa, shenzhen, singapore_airlines, tap, turkish_airlines, united.
--
-- Already seeded (no-op via on conflict): aegean, air_china, air_india,
-- asiana, austrian, brussels, croatia, egyptair, ethiopian, ita, lot,
-- saa, swiss, thai.
--
-- 2024-2026 churn captured here:
--   * SAS departed Star Alliance Aug 31, 2024 → joined SkyTeam Sept 1, 2024
--     (NOT seeded as Star Alliance member)
--   * ITA Airways officially joined Star Alliance April 2026
--   * Asiana Airlines remains a member as of April 2026 but is in transition
--     to SkyTeam over 2-3 years following the Korean Air merger close
--     (Dec 2024)
--
-- Also seeds the miles_and_more loyalty_program row, shared across six
-- Star Alliance carriers (Lufthansa, Austrian, SWISS, Brussels, LOT,
-- Croatia) — same pattern as flying_blue / atmos.

insert into programs (slug, name, type, is_active) values
  ('air_canada',         'Air Canada',                          'airline',         true),
  ('air_new_zealand',    'Air New Zealand',                     'airline',         true),
  ('ana',                'All Nippon Airways (ANA)',            'airline',         true),
  ('avianca',            'Avianca',                             'airline',         true),
  ('copa',               'Copa Airlines',                       'airline',         true),
  ('eva_air',            'EVA Air',                             'airline',         true),
  ('lufthansa',          'Lufthansa',                           'airline',         true),
  ('shenzhen',           'Shenzhen Airlines',                   'airline',         true),
  ('singapore_airlines', 'Singapore Airlines',                  'airline',         true),
  ('tap',                'TAP Air Portugal',                    'airline',         true),
  ('turkish_airlines',   'Turkish Airlines',                    'airline',         true),
  ('united',             'United Airlines',                     'airline',         true),
  ('miles_and_more',     'Miles & More',                        'loyalty_program', true)
on conflict (slug) do nothing;
