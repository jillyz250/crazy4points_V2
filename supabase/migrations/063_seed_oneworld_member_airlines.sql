-- Seed oneworld member airline program rows that don't exist yet.
--
-- BACKGROUND
-- ----------
-- Authoring the oneworld alliance page (migration 061 seeded the alliance
-- row; migration 062 added the member_programs jsonb column). The alliance
-- page links each member to its program page via slug. Confirmed missing
-- as of April 2026: aa, british_airways, cathay_pacific, finnair, iberia,
-- japan_airlines, qantas, qatar_airways.
--
-- Already seeded (no-op via on conflict): alaska, hawaiian, atmos, fiji,
-- malaysia, oman_air, royal_air_maroc, royal_jordanian, srilankan.
--
-- Each row represents the carrier and its house loyalty program in one
-- entry, matching the standalone-airline pattern (Delta, United style).
-- If a future split is needed (e.g. Avios as a shared currency across
-- BA / Iberia / Aer Lingus / Vueling / Qatar Privilege Club / Finnair),
-- that's a follow-up migration following the carrier_vs_loyalty pattern
-- from migration 058.

insert into programs (slug, name, type, is_active) values
  ('aa',              'American Airlines',  'airline', true),
  ('british_airways', 'British Airways',    'airline', true),
  ('cathay_pacific',  'Cathay Pacific',     'airline', true),
  ('finnair',         'Finnair',            'airline', true),
  ('iberia',          'Iberia',             'airline', true),
  ('japan_airlines',  'Japan Airlines',     'airline', true),
  ('qantas',          'Qantas',             'airline', true),
  ('qatar_airways',   'Qatar Airways',      'airline', true)
on conflict (slug) do nothing;
