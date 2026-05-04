-- Atmos full partner roster — sourced from the official Atmos page
-- (alaskaair.com/atmos-rewards/partners) on 2026-05-04.
--
-- USER PASTED THE OFFICIAL PAGE. This is canonical. Discovered:
--   - 31 official partner airlines (we had 16 — missing 15)
--   - LATAM is NO LONGER an Atmos partner (was on our list, dropped)
--   - Universal earn rates: 100% economy / 250% business across all
--     global partners (major 2026 program simplification)
--
-- This migration:
--   1. Seeds skeleton airline rows for the 15 missing partner airlines
--   2. Inserts partner_redemptions rows for each new partner (atmos as
--      currency, cabin = Economy default; pricing NULL pending official
--      cabin-specific rates)
--   3. Deactivates LATAM Atmos rows (sets is_active = false; preserves
--      history for audit trail)
--   4. Adds an editorial note about the universal earn rate to atmos.quirks

-- ============================================================
-- 1. Seed missing airline carrier rows
-- ============================================================

insert into programs (slug, name, type, is_active) values
  ('air_tahiti_nui',          'Air Tahiti Nui',                'airline', true),
  ('aleutian_airways',         'Aleutian Airways',              'airline', true),
  ('bahamasair',               'Bahamasair',                    'airline', true),
  ('condor',                   'Condor',                        'airline', true),
  ('contour_airlines',         'Contour Airlines',              'airline', true),
  ('finnair',                  'Finnair',                       'airline', true),
  ('icelandair',               'Icelandair',                    'airline', true),
  ('kenmore_air',              'Kenmore Air',                   'airline', true),
  ('mokulele_airlines',        'Mokulele Airlines',             'airline', true),
  ('oman_air',                 'Oman Air',                      'airline', true),
  ('philippine_airlines',      'Philippine Airlines',           'airline', true),
  ('porter_airlines',          'Porter Airlines',               'airline', true),
  ('southern_airways_express', 'Southern Airways Express',      'airline', true),
  ('srilankan_airlines',       'SriLankan Airlines',            'airline', true)
on conflict (slug) do nothing;

-- Note: 'qatar' already exists (used by AA partner_redemptions).
-- Confirmed via slug lookup: it's there.

-- ============================================================
-- 2. Insert Atmos partner_redemptions rows for the new partners
-- ============================================================

with a as (select id from programs where slug = 'atmos' limit 1)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  pricing_model, notes, confidence, last_verified
)
select a.id, p.partner_id, 'Economy', p.region, 'fixed', p.notes, 'HIGH', date '2026-05-04'
from a,
  (values
    ((select id from programs where slug = 'air_tahiti_nui'),         'US to French Polynesia',                'Universal earn rate: 100% Economy / 250% Business of distance flown. Book on alaskaair.com / hawaiianair.com.'),
    ((select id from programs where slug = 'aleutian_airways'),       'Pacific Northwest / Alaska regional',   'Small regional partner. Universal earn rate. Book on alaskaair.com.'),
    ((select id from programs where slug = 'bahamasair'),             'US East to Bahamas',                    'Universal earn rate. Book on alaskaair.com / hawaiianair.com.'),
    ((select id from programs where slug = 'condor'),                 'US to Frankfurt / Europe',              'German leisure carrier. Universal earn rate. Book on alaskaair.com.'),
    ((select id from programs where slug = 'contour_airlines'),       'US regional',                           'Small US regional partner. Book on alaskaair.com.'),
    ((select id from programs where slug = 'finnair'),                'US to Helsinki / Europe',               'oneworld member. Universal earn rate (100% Economy / 250% Business). Surcharge-free transatlantic alternative to BA. Book on alaskaair.com.'),
    ((select id from programs where slug = 'icelandair'),             'US to Reykjavik / Europe via KEF',      'Universal earn rate. Stopover in Iceland often included. Book on alaskaair.com.'),
    ((select id from programs where slug = 'kenmore_air'),            'Pacific Northwest seaplane',            'Small Pacific Northwest seaplane partner. Book on alaskaair.com.'),
    ((select id from programs where slug = 'mokulele_airlines'),      'Hawaii inter-island regional',          'Hawaii regional partner. Book on hawaiianair.com / alaskaair.com.'),
    ((select id from programs where slug = 'oman_air'),               'US connecting to Middle East / India',  'Universal earn rate. Connects via Muscat. Book on alaskaair.com.'),
    ((select id from programs where slug = 'philippine_airlines'),    'US to Manila / SE Asia',                'Universal earn rate (100% Economy / 250% Business). Book on alaskaair.com.'),
    ((select id from programs where slug = 'porter_airlines'),        'US to Eastern Canada',                  'Toronto-based regional. Book on alaskaair.com.'),
    ((select id from programs where slug = 'qatar'),                  'US to Middle East / Asia (via Doha)',   'oneworld member. Universal earn rate (100% Economy / 250% Business). Book on alaskaair.com / hawaiianair.com. Qatar Qsuites among the strongest premium-cabin redemptions for Atmos.'),
    ((select id from programs where slug = 'southern_airways_express'),'US regional',                           'Small US regional. Book on alaskaair.com.'),
    ((select id from programs where slug = 'srilankan_airlines'),     'US to Colombo / South Asia',            'oneworld member. Universal earn rate. Book on alaskaair.com.')
  ) as p(partner_id, region, notes)
where p.partner_id is not null
on conflict do nothing;

-- ============================================================
-- 3. Deactivate LATAM Atmos rows (no longer a partner per official page)
-- ============================================================

update partner_redemptions
set is_active = false,
    notes = coalesce(notes, '') || ' [DEACTIVATED 2026-05-04: LATAM no longer listed on official Atmos partner page; partnership ended.]'
where currency_program_id = (select id from programs where slug = 'atmos')
  and operating_carrier_id = (select id from programs where slug = 'latam')
  and is_active = true;

-- ============================================================
-- 4. Add universal-earn-rate note to Atmos quirks
-- ============================================================

update programs set
  quirks = coalesce(quirks, '') || E'\n- **Universal earn rates (2026 program simplification).** Previously distance-based with per-partner variation, now 100% of miles flown (Economy) or 250% of distance flown (Business class) across ALL global partners. Book the partner directly on alaskaair.com or hawaiianair.com to maximize earning. This is a major shift from the legacy Mileage Plan partner-by-partner earn-rate chart and one of the cleanest 2026 program structures in points.'
where slug = 'atmos'
  and quirks is not null
  and quirks not like '%Universal earn rates%';

-- ============================================================
-- 5. Touch content_updated_at
-- ============================================================

update programs set content_updated_at = now() where slug = 'atmos';
