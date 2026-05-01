-- Seed SkyTeam member airline program rows that don't exist yet.
--
-- BACKGROUND
-- ----------
-- Authoring the SkyTeam alliance page (migration 061 seeded the alliance
-- row; migration 062 added the member_programs jsonb column). The alliance
-- page links each member to its program page via slug.
--
-- SkyTeam has 18 full members as of April 2026 (Aeroflot suspended).
-- Confirmed missing from DB: aerolineas, aeromexico, delta, korean_air,
-- sas, virgin_atlantic, xiamen.
--
-- Already seeded (no-op via on conflict): air_europa, air_france,
-- china_airlines, china_eastern, garuda, kenya_airways, klm, mea,
-- saudia, tarom, vietnam_airlines, flying_blue (the loyalty program).
--
-- Note: Air France, KLM, and TAROM all share Flying Blue as their FFP.
-- The carrier rows (air_france, klm, tarom) point to /programs/flying_blue
-- for loyalty content per the carrier-vs-loyalty split established in
-- migration 058.
--
-- Note: SAS joined SkyTeam Sept 1, 2024 (left Star Alliance Aug 31, 2024).
-- It is the alliance's newest full member.

insert into programs (slug, name, type, is_active) values
  ('aerolineas',     'Aerolineas Argentinas',           'airline', true),
  ('aeromexico',     'Aeromexico',                      'airline', true),
  ('delta',          'Delta Air Lines',                 'airline', true),
  ('korean_air',     'Korean Air',                      'airline', true),
  ('sas',            'Scandinavian Airlines (SAS)',     'airline', true),
  ('virgin_atlantic','Virgin Atlantic',                 'airline', true),
  ('xiamen',         'XiamenAir',                       'airline', true)
on conflict (slug) do nothing;
