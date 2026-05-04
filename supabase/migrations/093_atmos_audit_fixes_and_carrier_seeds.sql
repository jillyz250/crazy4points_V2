-- Atmos audit fixes (2026-05-04 evening).
--
-- BACKGROUND
-- ----------
-- Audit on /programs/atmos found:
--   1. Hero pill row shows Bilt + raw "marriott_bonvoy" slug as partners —
--      partner_redemptions has rows where atmos is currency and Bilt /
--      Marriott Bonvoy are operating_carrier. Those are transfer-IN
--      currencies (not airlines you can fly), so the rows are nonsensical
--      and surface confusing UX in the partner-pill row.
--   2. Migration 092 referenced 4 carrier slugs that don't exist as
--      programs rows: malaysia_airlines, fiji_airways, hainan_airlines,
--      starlux. Inserts skipped silently via the WHERE p.partner_id IS
--      NOT NULL guard — so most of Atmos's partners didn't seed.
--   3. Card AF dollar amount ($395) appears 4+ times for the Atmos Summit
--      Visa Infinite — violates feedback_no_card_af_on_program_pages.
--   4. "the best inter-island award rate" / "the best business-class
--      redemptions" — banned comparative claims per
--      feedback_confidence_tag_drafts.
--   5. 1 "Atmos Rewards miles" + 1 "Atmos miles" stale (Atmos uses
--      points since 2025 rebrand).
--   6. Mark content_updated_at = now() so the freshness pill resets.

-- ============================================================
-- 1. Delete bad partner_redemptions rows where Atmos is currency
--    but operating_carrier is NOT an airline (transfer currencies,
--    hotel programs, alliances should never be operating_carrier
--    for an airline-currency redemption).
-- ============================================================

delete from partner_redemptions
where currency_program_id = (select id from programs where slug = 'atmos')
  and operating_carrier_id in (
    select id from programs where type != 'airline'
  );

-- ============================================================
-- 2. Seed skeleton rows for the 4 missing airline carriers
-- ============================================================

insert into programs (slug, name, type, is_active) values
  ('malaysia_airlines', 'Malaysia Airlines',  'airline', true),
  ('fiji_airways',      'Fiji Airways',        'airline', true),
  ('hainan_airlines',   'Hainan Airlines',     'airline', true),
  ('starlux',           'STARLUX Airlines',    'airline', true)
on conflict (slug) do nothing;

-- ============================================================
-- 3. Re-run the Atmos partner_redemptions seed for the 4 carriers
--    that were missing on the original 092 run.
-- ============================================================

with a as (select id from programs where slug = 'atmos' limit 1)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  pricing_model, notes, confidence, last_verified
)
select a.id, p.partner_id, 'Economy', p.region, p.pricing, p.notes, 'HIGH', date '2026-05-04'
from a,
  (values
    ((select id from programs where slug = 'malaysia_airlines'), 'Malaysia Airlines-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Useful for Southeast Asia routings.'),
    ((select id from programs where slug = 'fiji_airways'),     'Fiji Airways-operated, Atmos as currency',
        'fixed',
        'Distance-banded partner chart. Fiji Airways business US West Coast to Fiji/New Zealand: 75,000 points one-way. Pacific premium-cabin sweet spot.'),
    ((select id from programs where slug = 'hainan_airlines'),  'Hainan Airlines-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; useful for US-China routings via Beijing/Shanghai.'),
    ((select id from programs where slug = 'starlux'),          'STARLUX-operated, Atmos as currency',
        'fixed',
        'Legacy non-oneworld partner. Distance-banded; US to Taiwan / SE Asia routings.')
  ) as p(partner_id, region, pricing, notes)
where p.partner_id is not null
on conflict do nothing;

-- ============================================================
-- 4. Strip $395 AF references from text fields (per no-AF rule)
-- ============================================================

update programs set
  intro         = replace(coalesce(intro, ''),         '(Bank of America, $395 annual fee)', '(Bank of America)'),
  how_to_spend  = replace(coalesce(how_to_spend, ''),  '(Bank of America, $395 annual fee)', '(Bank of America)'),
  sweet_spots   = replace(coalesce(sweet_spots, ''),   '(Bank of America, $395 annual fee)', '(Bank of America)'),
  quirks        = replace(coalesce(quirks, ''),        '(Bank of America, $395 annual fee)', '(Bank of America)'),
  lounge_access = replace(coalesce(lounge_access, ''), '(Bank of America, $395 annual fee)', '(Bank of America)'),
  award_chart   = replace(coalesce(award_chart, ''),   '(Bank of America, $395 annual fee)', '(Bank of America)')
where slug = 'atmos';

update programs set
  quirks        = replace(coalesce(quirks, ''),        'the $395 annual fee on the Summit becomes the cost of entry', 'the Summit''s annual fee becomes the cost of entry'),
  lounge_access = replace(coalesce(lounge_access, ''), 'the $395 annual fee on the Summit becomes the cost of entry', 'the Summit''s annual fee becomes the cost of entry')
where slug = 'atmos';

-- ============================================================
-- 5. Soften "the best" comparative claims (banned words rule)
-- ============================================================

update programs set
  sweet_spots = replace(coalesce(sweet_spots, ''),
                         'the best inter-island award rate in points',
                         'one of the strongest inter-island award rates in points'),
  quirks      = replace(coalesce(quirks, ''),
                         'the best inter-island award rate in points',
                         'one of the strongest inter-island award rates in points')
where slug = 'atmos';

update programs set
  sweet_spots = replace(coalesce(sweet_spots, ''),
                         'Among the best business-class redemptions to Asia in any program',
                         'Among the standout business-class redemptions to Asia for points hobbyists'),
  intro       = replace(coalesce(intro, ''),
                         'Among the best business-class redemptions to Asia in any program',
                         'Among the standout business-class redemptions to Asia for points hobbyists')
where slug = 'atmos';

update programs set
  intro = replace(coalesce(intro, ''),
                   'bringing together the best of Alaska Airlines and Hawaiian Airlines',
                   'bringing together Alaska Airlines and Hawaiian Airlines')
where slug = 'atmos';

-- ============================================================
-- 6. Replace stale "miles" references with "points" (Atmos rebrand)
-- ============================================================

update programs set
  intro         = replace(replace(coalesce(intro, ''),         'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  how_to_spend  = replace(replace(coalesce(how_to_spend, ''),  'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  sweet_spots   = replace(replace(coalesce(sweet_spots, ''),   'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  quirks        = replace(replace(coalesce(quirks, ''),        'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  lounge_access = replace(replace(coalesce(lounge_access, ''), 'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  award_chart   = replace(replace(coalesce(award_chart, ''),   'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points')
where slug = 'atmos';

-- ============================================================
-- 7. Verify program.name is "Atmos Rewards" not just "Atmos"
-- ============================================================

update programs set name = 'Atmos Rewards' where slug = 'atmos' and name = 'Atmos';

-- ============================================================
-- 8. Touch content_updated_at for the freshness pill
-- ============================================================

update programs set content_updated_at = now() where slug = 'atmos';
