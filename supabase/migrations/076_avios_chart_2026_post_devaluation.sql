-- 076_avios_chart_2026_post_devaluation.sql
-- Replace stale pre-2025 Avios -> AA rows with the post-December-2025
-- devaluation chart and add the long-haul/transatlantic bands that were
-- missing entirely. Avios is a shared currency across BA, Iberia, Aer
-- Lingus, and Qatar  -  the partner-award chart for AA is identical across
-- all four programs.
--
-- Sources (verified 2026-05-03):
--   - Verylvke 2025-12 devaluation: bands 1-4 post-deval rates
--     https://www.verylvke.com/en/2025/12/19/ba-avios-partner-award-devaluation-full-chart-included/
--   - 10xTravel BA Avios chart: bands 5-9 long-haul rates
--     https://10xtravel.com/british-airways-club-award-charts/
--   - AwardWallet: shared-chart confirmation across Avios programs
--     https://awardwallet.com/airlines/book-american-flights-with-partner-miles/
--
-- Strategy: drop the existing AA-as-operator rows for the four Avios
-- programs (12-13 rows), then re-insert a clean unified set with all
-- six relevant distance bands per program (1-650, 651-1150, 1151-2000,
-- 2001-3000, 3001-4000 East Coast EU, 4001-5500 West Coast EU). Bands
-- 7-9 (Asia / Pacific from US) deferred  -  rarely useful for AA-operated
-- flights since AA's Pacific network is thin.
--
-- Brand voice (per utils/ai/editorialRules.ts BRAND_VOICE):
-- traveler-friend tone, contractions, concrete numbers, no corporate
-- hedging or AI-shorthand like "mirror" / "functional duplicate."

do $$
declare
  aa_id          uuid;
  ba_avios_id    uuid;
  iberia_id      uuid;
  qatar_id       uuid;
  aer_lingus_id  uuid;
  ver date := '2026-05-03';
  vby text := 'claude+chatgpt-2026-05-03';
  deleted int;
begin
  select id into aa_id          from programs where slug = 'aa';
  select id into ba_avios_id    from programs where slug = 'ba_avios';
  select id into iberia_id      from programs where slug = 'iberia';
  select id into qatar_id       from programs where slug = 'qatar';
  select id into aer_lingus_id  from programs where slug = 'aer_lingus';

  if aa_id is null then raise exception 'aa program row missing'; end if;

  delete from partner_redemptions
   where operating_carrier_id = aa_id
     and currency_program_id in (ba_avios_id, iberia_id, qatar_id, aer_lingus_id);
  get diagnostics deleted = row_count;
  raise notice 'Cleared % stale Avios -> AA rows', deleted;

  -- ─── BRITISH AIRWAYS AVIOS (ba_avios) ──────────────────────────────────────
  if ba_avios_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 1 (0-650 mi)',     13500, 13500, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing  -  connections rack up fast. No free stopovers.',
       'Cheap on a nonstop, painful on a connection. If you''re changing planes, check Atmos before you transfer Avios.',
       'Post-Dec-2025 devaluation chart.', 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)',     26500, 26500, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'Short J redemption that actually pencils out  -  when AA puts saver J on a 1-hour hop, this is the move.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 2 (651-1150 mi)',  18000, 18000, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'Solid value if it''s a nonstop. Two segments and the math gets ugly.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 2 (651-1150 mi)',  35500, 35500, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 3 (1151-2000 mi)', 20000, 20000, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'Transcon Y on Avios. Fine for a nonstop; on a connection you''re paying twice.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 3 (1151-2000 mi)', 44000, 44000, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'AAdvantage own metal beats this on transcon J. Skip unless saver is gone.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 4 (2001-3000 mi)', 22000, 22000, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'Deep transcon (think HNL). AAdvantage usually wins this bucket.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 4 (2001-3000 mi)', 55000, 55000, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 20750, 20750, 'fixed',
       'high', true, 'ba.com', true, null,
       'Per-segment pricing. The high-surcharge warning is for BA-operated flights  -  AA-operated transatlantic skips them.',
       'Don''t sleep on this. ~21k Avios for an AA flight to Europe undercuts AAdvantage''s 30k by a third. No fuel surcharges on AA metal.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 62000, 62000, 'fixed',
       'high', true, 'ba.com', true, null,
       'Per-segment pricing. No surcharges on AA-operated transatlantic.',
       '4,500 more than AAdvantage''s 57.5k, but Avios sometimes sees space AA''s own search hides.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Economy',  'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 25750, 25750, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'West-coast Y to Europe. Cheaper than AAdvantage''s 30k and no surcharges to argue with.',
       null, 'HIGH', ver, vby),
      (ba_avios_id, aa_id, 'Business', 'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 77250, 77250, 'fixed',
       'none', true, 'ba.com', true, null,
       'Per-segment pricing.',
       'AAdvantage''s 57.5k is the smarter play here. Save Avios for when AA shows nothing.',
       null, 'HIGH', ver, vby);
  end if;

  -- ─── IBERIA PLUS (iberia) ──────────────────────────────────────────────────
  if iberia_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (iberia_id, aa_id, 'Economy',  'AA distance band 1 (0-650 mi)',     13500, 13500, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       'Same chart as BA  -  pick whichever Avios pile is fattest, they all spend the same.',
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)',     26500, 26500, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Economy',  'AA distance band 2 (651-1150 mi)',  18000, 18000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 2 (651-1150 mi)',  35500, 35500, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Economy',  'AA distance band 3 (1151-2000 mi)', 20000, 20000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 3 (1151-2000 mi)', 44000, 44000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Economy',  'AA distance band 4 (2001-3000 mi)', 22000, 22000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 4 (2001-3000 mi)', 55000, 55000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Economy',  'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 20750, 20750, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       'Iberia''s the cleanest Avios for transatlantic  -  same 20,750 chart, no fuel-surcharge drama.',
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 62000, 62000, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Economy',  'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 25750, 25750, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (iberia_id, aa_id, 'Business', 'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 77250, 77250, 'fixed',
       'none', true, 'iberia.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby);
  end if;

  -- ─── QATAR PRIVILEGE CLUB AVIOS (qatar) ────────────────────────────────────
  if qatar_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (qatar_id, aa_id, 'Economy',  'AA distance band 1 (0-650 mi)',     13500, 13500, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       'Same chart as BA. Qatar runs promo discounts here and there  -  worth a peek before you transfer.',
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)',     26500, 26500, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Economy',  'AA distance band 2 (651-1150 mi)',  18000, 18000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 2 (651-1150 mi)',  35500, 35500, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Economy',  'AA distance band 3 (1151-2000 mi)', 20000, 20000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 3 (1151-2000 mi)', 44000, 44000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Economy',  'AA distance band 4 (2001-3000 mi)', 22000, 22000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 4 (2001-3000 mi)', 55000, 55000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Economy',  'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 20750, 20750, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       'Qatar''s flash sales sometimes drop this below the chart. Watch for them before you transfer.',
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 62000, 62000, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Economy',  'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 25750, 25750, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (qatar_id, aa_id, 'Business', 'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 77250, 77250, 'fixed',
       'none', true, 'qatarairways.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby);
  end if;

  -- ─── AER LINGUS AERCLUB AVIOS (aer_lingus) ─────────────────────────────────
  if aer_lingus_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 1 (0-650 mi)',     13500, 13500, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       'Aer Lingus is the third Avios bucket. Combine via household sharing if your BA stash is short.',
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)',     26500, 26500, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 2 (651-1150 mi)',  18000, 18000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 2 (651-1150 mi)',  35500, 35500, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 3 (1151-2000 mi)', 20000, 20000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 3 (1151-2000 mi)', 44000, 44000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 4 (2001-3000 mi)', 22000, 22000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 4 (2001-3000 mi)', 55000, 55000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 20750, 20750, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       'Same Avios chart, lands you in Dublin instead of London. Fewer surcharges than BA-operated routes.',
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 5 (3001-4000 mi)  -  US East Coast to Europe', 62000, 62000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy',  'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 25750, 25750, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 6 (4001-5500 mi)  -  US West Coast to Europe', 77250, 77250, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       null,
       null, 'HIGH', ver, vby);
  end if;
end $$;
