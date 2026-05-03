-- 071_aa_partner_redemptions.sql
-- Tier 1, Phase 1: seed partner_redemptions rows where the operating carrier
-- is American Airlines. Covers 8 booking programs (AAdvantage own + Alaska,
-- BA Avios, Qatar Avios, Cathay Asia Miles, JAL Mileage Bank, Iberia Avios,
-- Etihad Guest).
--
-- Verified by claude + ChatGPT 2026-05-03 web pass. Most rows are MED or
-- LOW confidence by design — in 2026 most AA partner pricing is partially
-- dynamic and not cleanly published. NULL costs are intentional where
-- ChatGPT could not source a primary chart cell. Better NULL than wrong.
--
-- teach_caption per row captures the inventory-visibility nuance:
-- the cheapest chart is not always the best program because partners see
-- different award space. Each row says "use this when..." and "avoid when..."
--
-- Plan: plans/ways-to-book-tool.md sections 6 (phase 1), 7 (checklist),
-- 11 (wallet ranking).

-- Use the operator id once
do $$
declare
  aa_id uuid;

  -- currency program ids (loyalty programs, not carriers)
  aadv_id   uuid;  -- AAdvantage = aa (single row, currency + carrier)
  as_id     uuid;  -- Alaska Mileage Plan = alaska
  ba_id     uuid;  -- BA Avios = ba_avios
  qr_id     uuid;  -- Qatar Privilege Club = qatar
  cx_id     uuid;  -- Cathay Asia Miles = cathay
  jl_id     uuid;  -- JAL Mileage Bank = jal
  ib_id     uuid;  -- Iberia Plus = iberia
  ey_id     uuid;  -- Etihad Guest = etihad
begin
  select id into aa_id   from programs where slug = 'aa';
  aadv_id := aa_id;  -- AAdvantage is the same row
  select id into as_id   from programs where slug = 'alaska';
  select id into ba_id   from programs where slug = 'ba_avios';
  select id into qr_id   from programs where slug = 'qatar';
  select id into cx_id   from programs where slug = 'cathay';
  select id into jl_id   from programs where slug = 'jal';
  select id into ib_id   from programs where slug = 'iberia';
  select id into ey_id   from programs where slug = 'etihad';

  if aa_id is null then raise exception 'aa program row missing'; end if;

  -- ==========================================================================
  -- 1. AAdvantage own metal (dynamic; baseline reference, rarely cheapest)
  -- ==========================================================================
  insert into partner_redemptions (
    currency_program_id, operating_carrier_id, cabin, region_or_route,
    cost_miles_low, cost_miles_high, pricing_model,
    fuel_surcharges, bookable_online, booking_channel,
    requires_saver_space, non_saver_fallback,
    routing_rules, teach_caption, notes,
    confidence, last_verified, verified_by
  ) values
    (aadv_id, aa_id, 'Economy', 'US short-haul (saver + Web Specials)',
     7500, null, 'dynamic',
     'none', true, 'aa.com',
     false, 'AA Web Specials are bookable directly even when partner saver is gone.',
     'No stopovers allowed.',
     'Use AAdvantage when no partner saver shows. Rarely cheapest, but sees the most inventory.',
     'Saver tier starts ~7500; Web Specials replace saver across most routes in 2026.',
     'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

    (aadv_id, aa_id, 'Economy', 'US transcon (saver + Web Specials)',
     10000, 25000, 'dynamic',
     'none', true, 'aa.com',
     false, 'Web Specials common at 12-20k.',
     'No stopovers allowed.',
     'Wide variance. AAdvantage redeems are most useful when partners cannot see the seat.',
     'Wide observed range; mostly dynamic Web Specials.',
     'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

    (aadv_id, aa_id, 'Business', 'US to Europe',
     57500, 120000, 'dynamic',
     'none', true, 'aa.com',
     false, 'Web Specials occasionally show below 60k in J.',
     'No stopovers allowed.',
     'Use only as a fallback. Partners price US-Europe J far cheaper when saver exists.',
     'Huge spread; saver awards exist but suppressed.',
     'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

    (aadv_id, aa_id, 'First', 'Long-haul (US to Asia / EU)',
     80000, 200000, 'dynamic',
     'none', true, 'aa.com',
     false, null,
     'No stopovers allowed.',
     'Almost never the right call. Partner programs price F bookings dramatically lower when space exists.',
     'No fixed published F chart in 2026; range observed across markets.',
     'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03');

  -- ==========================================================================
  -- 2. Alaska Mileage Plan (still strong domestically; chart fragmented)
  -- ==========================================================================
  if as_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (as_id, aa_id, 'Economy', 'AA short-haul (~0-700 mi)',
       4500, 12500, 'hybrid',
       'none', true, 'alaskaair.com',
       true, null,
       'Stopovers historically allowed on partner awards; partial support post-2023.',
       'Often the cheapest path for short-haul AA. Search alaskaair.com first; partner chart fragmented post-2023.',
       'No clean unified distance chart in 2026; partner-specific pricing.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (as_id, aa_id, 'Economy', 'AA medium-haul (~701-1400 mi)',
       7500, 15000, 'hybrid',
       'none', true, 'alaskaair.com',
       true, null,
       null,
       'Solid mid-distance value when saver shows. BA Avios may beat it on nonstop, but loses on connections.',
       'Range reflects observed pricing; chart no longer cleanly published.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (as_id, aa_id, 'Business', 'AA domestic',
       15000, 25000, 'hybrid',
       'none', true, 'alaskaair.com',
       true, null,
       null,
       'Often the best AA domestic premium booker in 2026. AAdvantage J is rarely competitive here.',
       'Strong but variable; spot-check alaskaair.com for current rate.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (as_id, aa_id, 'First', 'AA domestic',
       25000, 40000, 'hybrid',
       'none', true, 'alaskaair.com',
       true, null,
       null,
       'Top pick for AA domestic F when saver shows. Verify rate at booking; chart fragmented.',
       'Domestic F is the surviving sweet spot; long-haul F via Alaska is route-by-route.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 3. British Airways Avios (cheap nonstop short-haul; trap on connections)
  -- ==========================================================================
  if ba_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (ba_id, aa_id, 'Economy', 'AA distance band 1 (0-650 mi)',
       7500, 7500, 'fixed',
       'none', true, 'ba.com',
       true, null,
       'Per-segment pricing. Connections multiply cost. No free stopovers.',
       'Best for nonstop short-haul AA. Avoid for connecting itineraries; per-segment pricing explodes the total.',
       'BA Avios chart confirmed 2026 distance bands.',
       'HIGH', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ba_id, aa_id, 'Economy', 'AA distance band 2 (651-1150 mi)',
       9000, 9000, 'fixed',
       'none', true, 'ba.com',
       true, null,
       'Per-segment pricing.',
       'Strong nonstop value. Cross-check Alaska if a connection is involved.',
       null,
       'HIGH', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ba_id, aa_id, 'Economy', 'AA distance band 3 (1151-2000 mi)',
       11000, 13000, 'fixed',
       'none', true, 'ba.com',
       true, null,
       'Per-segment pricing.',
       'Still competitive nonstop transcon. Connections kill the value.',
       'Range reflects peak vs off-peak.',
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ba_id, aa_id, 'Business', 'AA distance band 1 (0-650 mi)',
       15000, null, 'fixed',
       'none', true, 'ba.com',
       true, null,
       'Per-segment pricing.',
       'Cheap on paper; check AA J inventory carefully because BA sees less than Alaska.',
       'Lower bound observed; upper bound peak-period dependent.',
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ba_id, aa_id, 'First', 'AA short-haul',
       null, null, 'fixed',
       'none', true, 'ba.com',
       true, null,
       'F rarely available on AA short-haul.',
       'AA does not consistently sell F on short-haul; expect sparse availability.',
       'Rarely offered; verify per route.',
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 4. Qatar Privilege Club Avios (shared system with BA; sometimes better)
  -- ==========================================================================
  if qr_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (qr_id, aa_id, 'Economy', 'AA short-haul (Avios shared chart)',
       7500, 13000, 'fixed',
       'none', true, 'qatarairways.com',
       true, null,
       'Per-segment pricing. Shared Avios distance bands.',
       'Same math as BA Avios; sometimes better promos or availability. Worth checking both.',
       'Qatar Privilege Club uses shared Avios; tracks BA chart with occasional pricing differences.',
       'HIGH', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (qr_id, aa_id, 'Business', 'AA short-haul (Avios shared chart)',
       15000, null, 'fixed',
       'none', true, 'qatarairways.com',
       true, null,
       'Per-segment pricing.',
       'Mirror of BA Avios; check both currencies if you have transferable points.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 5. Cathay Pacific Asia Miles (multi-carrier strength; complex itineraries)
  -- ==========================================================================
  if cx_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (cx_id, aa_id, 'Economy', 'AA short-haul (<750 mi)',
       7500, null, 'fixed',
       'low', true, 'asiamiles.com',
       true, null,
       'Multi-carrier itineraries supported with stopovers.',
       'Rarely the right call for simple AA domestic. Shines on multi-carrier routings.',
       'Distance band ranges not cleanly published; lower bound observed.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (cx_id, aa_id, 'Economy', 'AA medium-haul (750-2750 mi)',
       10000, 20000, 'fixed',
       'low', true, 'asiamiles.com',
       true, null,
       'Multi-carrier itineraries supported.',
       'Competitive only when chaining multiple carriers; otherwise pick BA or Alaska.',
       null,
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (cx_id, aa_id, 'Business', 'AA long-haul',
       50000, 85000, 'fixed',
       'low', null, 'asiamiles.com (some routes phone-only)',
       true, null,
       'Multi-carrier oneworld redemptions allowed; stopovers permitted.',
       'Strong for complex long-haul J itineraries with stopovers. Online booking partial.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (cx_id, aa_id, 'First', 'AA long-haul',
       85000, 120000, 'fixed',
       'low', null, 'asiamiles.com (often phone-only for F)',
       true, null,
       'Multi-carrier itineraries; stopovers allowed.',
       'Elite-level F redemption for those who can find AA F space. Verify availability before transferring miles.',
       null,
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 6. JAL Mileage Bank (round-trip biased; niche but useful)
  -- ==========================================================================
  if jl_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (jl_id, aa_id, 'Economy', 'AA short-haul (round-trip)',
       12000, null, 'fixed',
       'none', null, 'jal.co.jp (partial online; some routes phone-only)',
       true, null,
       'Round-trip required for partner awards. One-ways generally not bookable.',
       'Niche. Use when round-trip optimization matters and AA shows partner saver both directions.',
       'JAL partner chart largely round-trip; one-way support inconsistent.',
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (jl_id, aa_id, 'Business', 'AA long-haul (round-trip)',
       80000, 100000, 'fixed',
       'none', null, 'jal.co.jp',
       true, null,
       'Round-trip required.',
       'Solid long-haul J option for round-trips with AA J availability both ways.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (jl_id, aa_id, 'First', 'AA long-haul (round-trip)',
       120000, 160000, 'fixed',
       'none', null, 'jal.co.jp',
       true, null,
       'Round-trip required.',
       'Premium F redemption for round-trips. Availability is the bottleneck, not miles.',
       null,
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 7. Iberia Plus Avios (Avios chart for AA mirrors BA; no unique edge)
  -- ==========================================================================
  if ib_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (ib_id, aa_id, 'Economy', 'AA short-haul (Avios shared chart)',
       7500, 13000, 'fixed',
       'none', true, 'iberia.com',
       true, null,
       'Per-segment pricing.',
       'Same Avios chart as BA for AA bookings. No unique advantage; treat as BA mirror.',
       'Iberia peak/off-peak rules apply mostly to Iberia metal, not AA.',
       'HIGH', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ib_id, aa_id, 'Business', 'AA short-haul (Avios shared chart)',
       15000, null, 'fixed',
       'none', true, 'iberia.com',
       true, null,
       'Per-segment pricing.',
       'Functional duplicate of BA Avios for AA. Convert via BA or Qatar instead if you have transferable points.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;

  -- ==========================================================================
  -- 8. Etihad Guest (was elite; now situational and devalued)
  -- ==========================================================================
  if ey_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (ey_id, aa_id, 'Economy', 'AA US domestic',
       12500, null, 'fixed',
       'none', false, 'phone only (Etihad call center)',
       true, null,
       null,
       'Was a sweet spot pre-2023. Now phone-only and pricing inconsistent. Verify before transferring miles.',
       'Etihad partner chart still nominally exists but increasingly unreliable.',
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ey_id, aa_id, 'Business', 'AA US domestic',
       25000, null, 'fixed',
       'none', false, 'phone only',
       true, null,
       null,
       'Situational at best. Alaska usually beats it for AA domestic J in 2026.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ey_id, aa_id, 'First', 'AA US domestic',
       32500, null, 'fixed',
       'none', false, 'phone only',
       true, null,
       null,
       'Verify availability before transferring. Devalued from prior years.',
       null,
       'LOW', '2026-05-03', 'claude+chatgpt-2026-05-03'),

      (ey_id, aa_id, 'Business', 'AA US to Europe',
       50000, 70000, 'fixed',
       'none', false, 'phone only',
       true, null,
       null,
       'Decent on paper but call-center friction is real. Aer Lingus or BA usually better for transatlantic J.',
       null,
       'MED', '2026-05-03', 'claude+chatgpt-2026-05-03');
  end if;
end $$;
