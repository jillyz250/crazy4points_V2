-- Seed JetBlue's confirmed redemption partners into partner_redemptions.
--
-- BACKGROUND
-- ----------
-- JetBlue (alliance: 'other') has no traditional alliance but has five
-- confirmed bilateral redemption partners as of 2026-05-04 (verified during
-- JetBlue page authoring):
--
--   1. United Airlines  — via Blue Sky partnership (Phase 1 launched
--                          October 23, 2025). Reciprocal earning + redemption.
--   2. China Airlines    — added April 29, 2026 to allow point redemption.
--   3. Etihad Airways    — long-standing redemption partner.
--   4. Qatar Airways     — long-standing redemption partner.
--   5. Cape Air          — codeshare + redemption integration.
--
-- These rows surface JetBlue's partners as pills in the program-page hero
-- (via the new partners-derived-from-partner_redemptions logic) and on the
-- programs index card. Without these rows, JetBlue's card and hero look
-- empty for partner info even though the partnerships are real.
--
-- Pricing intentionally left LOW/HIGH = NULL: JetBlue is revenue-based
-- for own metal AND partner awards (no published chart). Editorial costs
-- live in programs.sweet_spots and programs.award_chart. The pricing
-- fields can be filled in later via observed-price spot checks.
--
-- Source: plans/sources/jetblue.md (fact-check disagreements row 2 captures
-- the per-partner verification round that produced this list).

-- Cape Air not yet seeded as a programs row — add it as a skeleton first
-- so the partner_redemptions FK resolves. (china_airlines already exists
-- per migration 025; etihad and qatar exist per multiple prior migrations.)
insert into programs (slug, name, type, is_active) values
  ('cape_air', 'Cape Air', 'airline', true)
on conflict (slug) do nothing;

with jb as (select id from programs where slug = 'jetblue' limit 1)
insert into partner_redemptions (
  currency_program_id,
  operating_carrier_id,
  cabin,
  region_or_route,
  pricing_model,
  notes,
  confidence,
  last_verified
)
select jb.id, p.partner_id, 'Economy', p.region, 'dynamic', p.notes, 'HIGH', date '2026-05-04'
from jb,
  (values
    ((select id from programs where slug = 'united'),         'US transcon and domestic',         'Blue Sky partnership Phase 1 launched October 23, 2025 — reciprocal earning + redemption between TrueBlue and MileagePlus. Cross-airline ticket sales and reciprocal elite benefits rolling out through 2026.'),
    ((select id from programs where slug = 'china_airlines'), 'US to Taiwan / Asia (codeshare)',  'Redemption added April 29, 2026 (per JetBlue press release). Book on jetblue.com.'),
    ((select id from programs where slug = 'etihad'),         'US to Middle East / Asia',         'Long-standing TrueBlue redemption partner. Premium-cabin space (Etihad Apartment) historically thin via TrueBlue; Amex MR direct or AAdvantage usually better paths.'),
    ((select id from programs where slug = 'qatar'),          'US to Middle East / Asia',         'Long-standing TrueBlue redemption partner. Book on jetblue.com.'),
    ((select id from programs where slug = 'cape_air'),       'New England / Caribbean regional', 'Long-standing codeshare + redemption integration; Cape Air flights bookable on jetblue.com.')
  ) as p(partner_id, region, notes)
where p.partner_id is not null
on conflict do nothing;
