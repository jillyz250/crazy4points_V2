-- Seed remaining commercial airlines so every program a US-based traveler
-- might encounter exists in the programs table and can be tagged on alerts.
-- 34 airlines were already seeded (aa, delta, ana, lufthansa, etc); this
-- migration adds the rest — 4 US carriers + 49 international.
--
-- Naming convention follows existing rows: "Carrier Name FFP-brand"
-- (e.g. "Air Canada Aeroplan", "British Airways Avios"). Where the carrier
-- has no distinct FFP brand, the carrier name alone is used.
--
-- Slug convention also follows existing rows:
--   - FFP-brand slug when the FFP is iconic (krisflyer, aeroplan, ba_avios)
--   - Carrier-name slug otherwise (delta, qatar, swiss)
-- All new rows use carrier-name slugs since the existing 34 already cover
-- the well-known FFP-branded ones.
--
-- Notably NOT seeded:
--   - 'alaska' (Mileage Plan) and 'hawaiian' (HawaiianMiles) — both fully
--     replaced by Atmos Rewards (existing 'atmos' row). HawaiianMiles members
--     migrated on 2025-10-01; Mileage Plan members migrated automatically.
--     Source: news.alaskaair.com/loyalty/introducing-atmos-rewards
--
-- ON CONFLICT (slug) DO NOTHING — safe to re-run; skips anything already
-- present. is_active defaults to true; faq_content / faq_updated_at left
-- null so the admin UI flags each one as "Never" (yellow ⚠) until pasted.

insert into programs (slug, name, type, is_active) values
  -- US carriers (4 — Alaska + Hawaiian intentionally omitted, replaced by Atmos)
  ('allegiant',         'Allegiant Allways Rewards',     'airline', true),
  ('avelo',             'Avelo Airlines',                'airline', true),
  ('breeze',            'Breeze Airways',                'airline', true),
  ('sun_country',       'Sun Country Rewards',           'airline', true),

  -- International carriers (49)
  ('aegean',            'Aegean Miles+Bonus',            'airline', true),
  ('aer_lingus',        'Aer Lingus AerClub',            'airline', true),
  ('air_china',         'Air China PhoenixMiles',        'airline', true),
  ('air_europa',        'Air Europa SUMA',               'airline', true),
  ('air_india',         'Air India Maharaja Club',       'airline', true),
  ('air_tahiti_nui',    'Air Tahiti Nui',                'airline', true),
  ('asiana',            'Asiana Club',                   'airline', true),
  ('austrian',          'Austrian Miles & More',         'airline', true),
  ('bamboo',            'Bamboo Airways Club',           'airline', true),
  ('brussels',          'Brussels Airlines Miles & More','airline', true),
  ('china_airlines',    'China Airlines Dynasty Flyer',  'airline', true),
  ('china_eastern',     'China Eastern Eastern Miles',   'airline', true),
  ('croatia',           'Croatia Airlines Miles & More', 'airline', true),
  ('egyptair',          'EgyptAir Plus',                 'airline', true),
  ('el_al',             'El Al Matmid',                  'airline', true),
  ('ethiopian',         'Ethiopian ShebaMiles',          'airline', true),
  ('fiji',              'Fiji Airways Tabua Club',       'airline', true),
  ('garuda',            'Garuda GarudaMiles',            'airline', true),
  ('gulf_air',          'Gulf Air FalconFlyer',          'airline', true),
  ('hong_kong_airlines','Hong Kong Airlines Fortune Wings','airline', true),
  ('indigo',            'IndiGo BluChip',                'airline', true),
  ('ita',               'ITA Airways Volare',            'airline', true),
  ('kenya_airways',     'Kenya Airways Asante Rewards',  'airline', true),
  ('lot',               'LOT Polish Miles & More',       'airline', true),
  ('malaysia',          'Malaysia Airlines Enrich',      'airline', true),
  ('mea',               'MEA Cedar Miles',               'airline', true),
  ('norse',             'Norse Atlantic Airways',        'airline', true),
  ('norwegian',         'Norwegian Reward',              'airline', true),
  ('oman_air',          'Oman Air Sindbad',              'airline', true),
  ('philippine',        'Philippine Mabuhay Miles',      'airline', true),
  ('porter',            'Porter VIPorter',               'airline', true),
  ('riyadh_air',        'Riyadh Air',                    'airline', true),
  ('royal_air_maroc',   'Royal Air Maroc Safar Flyer',   'airline', true),
  ('royal_jordanian',   'Royal Jordanian Royal Plus',    'airline', true),
  ('ryanair',           'Ryanair',                       'airline', true),
  ('saa',               'South African Airways Voyager', 'airline', true),
  ('saudia',            'Saudia Alfursan',               'airline', true),
  ('scoot',             'Scoot',                         'airline', true),
  ('srilankan',         'SriLankan FlySmiLes',           'airline', true),
  ('swiss',             'Swiss Miles & More',            'airline', true),
  ('tarom',             'TAROM Smart Miles',             'airline', true),
  ('thai',              'Thai Royal Orchid Plus',        'airline', true),
  ('vietnam_airlines',  'Vietnam Airlines Lotusmiles',   'airline', true),
  ('virgin_australia',  'Virgin Australia Velocity',     'airline', true),
  ('volaris',           'Volaris vClub',                 'airline', true),
  ('westjet',           'WestJet Rewards',               'airline', true),
  ('wizz',              'Wizz Air',                      'airline', true),
  ('zipair',            'ZIPAIR Mileage Bank',           'airline', true)
on conflict (slug) do nothing;
