-- Atmos Rewards partner_redemptions MVP seeding (Partner Booking Tool data).
--
-- BACKGROUND
-- ----------
-- Atmos Rewards (the joint Alaska + Hawaiian loyalty program) preserved the
-- famous distance-based partner award chart from legacy Mileage Plan. Every
-- partner has its own chart — not a single zone chart — but distance bands
-- are similar across most partners.
--
-- This is MVP coverage: one row per (atmos, operating_carrier) pair to
-- unblock the Partner Booking Tool. The `notes` field summarizes the
-- pricing structure with the most-cited sweet-spot price; readers click
-- through to atmos's partner chart URL for the full per-band table.
--
-- SOURCE: editorial content on /programs/atmos (sweet_spots + how_to_spend)
-- + Atmos's own published partner pages.

-- 1. Set the partner_chart_url on Atmos
update programs
set partner_chart_url = 'https://www.alaskaair.com/myaccount/atmos-rewards/partners'
where slug = 'atmos';

-- 2. Insert one row per operating carrier (Economy default)
with a as (select id from programs where slug = 'atmos' limit 1)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  pricing_model, notes, confidence, last_verified
)
select a.id, p.partner_id, 'Economy', p.region, p.pricing, p.notes, 'HIGH', date '2026-05-04'
from a,
  (values
    -- Own metal (Alaska + Hawaiian) — dynamic-ish for own routes, 4,500 inter-island
    ((select id from programs where slug = 'alaska'),    'Alaska-operated routes (own metal)',
        'hybrid',
        'Dynamic-ish pricing on own metal. West Coast to Hawaii starts ~10,000 points one-way Economy. Distance-based legacy pricing preserved on shorter intra-North-America routes.'),
    ((select id from programs where slug = 'hawaiian'),  'Hawaiian-operated routes (own metal)',
        'hybrid',
        'Dynamic on own metal. Inter-island Hawaii fixed at 4,500 points one-way (reduced 25% in 2026). West Coast to Hawaii ~10,000 points one-way Economy.'),
    -- oneworld partners (distance-banded chart preserved from Mileage Plan)
    ((select id from programs where slug = 'aa'),        'AA-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart: 0-700 mi = 4,500 pts / 701-1400 = 7,500 / 1401-2100 = 10,000 / 2101-2750 = 12,500. AA short-haul on Atmos points is one of the program''s strongest sweet spots.'),
    ((select id from programs where slug = 'british_airways'), 'BA-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart with high BA carrier-imposed surcharges on transatlantic awards. Use Finnair codeshare for surcharge-free transatlantic at the same mile cost.'),
    ((select id from programs where slug = 'iberia'),    'Iberia-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Madrid hub provides Europe + South America connectivity.'),
    ((select id from programs where slug = 'aer_lingus'), 'Aer Lingus-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Transatlantic business 45,000 points one-way is among the strongest premium-cabin sweet spots in points.'),
    ((select id from programs where slug = 'japan_airlines'), 'JAL-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. JAL business class to Japan: 60,000 points one-way from US West Coast / 75,000 from East Coast. JAL First class: 90,000-110,000 one-way. Among the best business-class redemptions to Asia in any program.'),
    ((select id from programs where slug = 'cathay_pacific'), 'Cathay Pacific-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Cathay business US-Hong Kong: 75,000 points one-way. Premium space notoriously thin via Atmos; verify availability before transferring points in.'),
    ((select id from programs where slug = 'qantas'),    'Qantas-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. US to Australia/Pacific. Award space tight; book at the 11-month window.'),
    ((select id from programs where slug = 'malaysia_airlines'), 'Malaysia Airlines-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Useful for Southeast Asia routings.'),
    ((select id from programs where slug = 'royal_jordanian'), 'Royal Jordanian-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. US to Middle East via AMM connection.'),
    ((select id from programs where slug = 'royal_air_maroc'), 'Royal Air Maroc-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Royal Air Maroc business US to Africa/Middle East: 55,000 points one-way. The cheap Casablanca-and-onward sweet spot.'),
    ((select id from programs where slug = 'fiji_airways'), 'Fiji Airways-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Fiji Airways business US West Coast to Fiji/New Zealand: 75,000 points one-way. Pacific premium-cabin sweet spot.'),
    -- Non-oneworld legacy partners (carry-overs from Mileage Plan)
    ((select id from programs where slug = 'hainan_airlines'), 'Hainan Airlines-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; useful for US-China routings via Beijing/Shanghai.'),
    ((select id from programs where slug = 'starlux'),   'STARLUX-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; US to Taiwan / SE Asia routings.'),
    ((select id from programs where slug = 'korean_air'), 'Korean Air-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; partnership reduced in scope but still active.'),
    ((select id from programs where slug = 'singapore_airlines'), 'Singapore Airlines-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Limited; restricted award space and routes.'),
    ((select id from programs where slug = 'latam'),     'LATAM-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; US to South America routings.')
  ) as p(partner_id, region, pricing, notes)
where p.partner_id is not null
on conflict do nothing;
