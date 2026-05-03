-- 073_aa_reverse_completion.sql
-- Tier 1, Phase 1 reverse-direction completion: add the 3 booking programs
-- that round out the AA-as-operator coverage — Aer Lingus AerClub Avios,
-- Finnair Plus, and Qantas Frequent Flyer.
--
-- Confidence varies:
--   - Aer Lingus AerClub Avios = HIGH (mirrors BA Avios chart structure;
--     same distance bands, just no fuel surcharges advantage)
--   - Finnair Plus              = MED (Finnair switched to region-based;
--     AwardWallet 2026 confirms 16,500 Avios transcon Y — partial chart)
--   - Qantas Frequent Flyer     = MED (distance-based partner chart;
--     AwardWallet 2026 confirms ~9,200 short Y — full chart not verified)
--
-- Where specific cells lack a primary source, cost is NULL with confidence
-- LOW and teach_caption "verify before transferring miles."
--
-- Sources:
--   - AwardWallet 2026: https://awardwallet.com/airlines/book-american-flights-with-partner-miles/
-- Verified: 2026-05-03 by claude+chatgpt-2026-05-03

do $$
declare
  aa_id uuid;
  aer_lingus_id uuid;
  finnair_id    uuid;
  qantas_id     uuid;
  ver date := '2026-05-03';
  vby text := 'claude+chatgpt-2026-05-03';
begin
  select id into aa_id           from programs where slug = 'aa';
  select id into aer_lingus_id   from programs where slug = 'aer_lingus';
  select id into finnair_id      from programs where slug = 'finnair';
  select id into qantas_id       from programs where slug = 'qantas';

  if aa_id is null then raise exception 'aa program row missing'; end if;

  -- ==========================================================================
  -- Aer Lingus AerClub Avios booking AA (mirrors BA Avios chart, no surcharges)
  -- ==========================================================================
  if aer_lingus_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aer_lingus_id, aa_id, 'Economy', 'AA distance band 1 (0-650 mi)', 7500, 7500, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing. No free stopovers.',
       'Same chart as BA Avios. Aer Lingus is a third Avios balance — combine via Iberia or move via Avios household sharing.',
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy', 'AA distance band 2 (651-1150 mi)', 9000, 9000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       'Mirror of BA Avios mid-distance band.',
       null, 'HIGH', ver, vby),
      (aer_lingus_id, aa_id, 'Economy', 'AA distance band 3 (1151-2000 mi)', 11000, 13000, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       'Range reflects peak vs off-peak.',
       null, 'MED', ver, vby),
      (aer_lingus_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)', 15000, null, 'fixed',
       'none', true, 'aerlingus.com', true, null,
       'Per-segment pricing.',
       'Avios chart for J short-haul. No surcharges advantage over BA.',
       null, 'MED', ver, vby);
  end if;

  -- ==========================================================================
  -- Finnair Plus booking AA (region-based; partial 2026 chart verified)
  -- ==========================================================================
  if finnair_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (finnair_id, aa_id, 'Economy', 'AA short-haul (US domestic short)', null, null, 'fixed',
       'none', true, 'finnair.com', true, null,
       null,
       'Finnair Plus uses regions, not distance. Short-haul AA pricing not cleanly published; verify before transferring.',
       'No published 2026 cell for AA short-haul economy at primary-source HIGH confidence.',
       'LOW', ver, vby),
      (finnair_id, aa_id, 'Economy', 'AA US transcon', 16500, 16500, 'fixed',
       'none', true, 'finnair.com', true, null,
       null,
       'Region-based pricing means transcon costs more than 0-1500mi short-haul on AA. AwardWallet confirms 16,500 Avios in 2026.',
       null, 'MED', ver, vby),
      (finnair_id, aa_id, 'Business', 'AA US transcon', null, null, 'fixed',
       'none', true, 'finnair.com', true, null,
       null,
       'Finnair Plus J on AA exists but specific 2026 rate not verified — verify via finnair.com before transferring.',
       null, 'LOW', ver, vby);
  end if;

  -- ==========================================================================
  -- Qantas Frequent Flyer booking AA (distance-based partner chart)
  -- ==========================================================================
  if qantas_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (qantas_id, aa_id, 'Economy', 'AA short-haul', 9200, 9200, 'fixed',
       'none', true, 'qantas.com', true, null,
       'Qantas distance chart prices on TOTAL journey distance (not per-segment).',
       'AwardWallet 2026 confirms ~9,200 points short-haul Y. Better than BA Avios on connections because Qantas charges total-distance, not per-segment.',
       null, 'MED', ver, vby),
      (qantas_id, aa_id, 'Economy', 'AA medium-haul / transcon', null, null, 'fixed',
       'none', true, 'qantas.com', true, null,
       'Total-distance pricing.',
       'Specific transcon rate not verified via 2026 primary source. Search qantas.com partner awards before transferring.',
       null, 'LOW', ver, vby),
      (qantas_id, aa_id, 'Business', 'AA domestic / transcon', null, null, 'fixed',
       'none', true, 'qantas.com', true, null,
       'Total-distance pricing.',
       'Qantas J on AA exists but specific 2026 rate not verified.',
       null, 'LOW', ver, vby);
  end if;
end $$;
