-- 224_ua_tier1_partner_redemptions.sql
-- UA Tier 1: seed partner_redemptions rows where the operating carrier is
-- United Airlines, covering the 6 Tier 1 booking programs identified via
-- Copilot + ChatGPT 2026 research passes:
--
--   1. United MileagePlus (own metal, dynamic)
--   2. Air Canada Aeroplan
--   3. ANA Mileage Club (round-trip required for partner awards)
--   4. Avianca LifeMiles (fuel-surcharge-free)
--   5. Turkish Miles & Smiles (devalued from peak years but still useful)
--   6. Singapore KrisFlyer
--
-- Tier 2 (EVA, Copa) deferred. Tier 3 (Asiana / Thai / PhoenixMiles) skipped
-- per the quality-over-coverage call.
--
-- Pre-cleanup: deletes 5 generic meta-descriptor rows ("aeroplan: All Star
-- Alliance partner routes..." etc.) that were placeholder authoring without
-- specific routes. Replaces them with band-specific rows below.
--
-- ANA round-trip rule: ANA's partner chart prices ROUND-TRIPS. To keep the
-- DB consistent (every other row stores one-way), we store the one-way
-- equivalent (RT / 2) and call out the round-trip requirement in
-- routing_rules + teach_caption.
--
-- Sources: Aeroplan 2026 partner chart (post-June-2026 devaluation),
-- ChatGPT + Copilot 2026 research syntheses, AwardWallet, OMAAT.

do $$
declare
  ua_id          uuid;
  united_id      uuid;
  aeroplan_id    uuid;
  ana_id         uuid;
  avianca_id     uuid;
  turkish_id     uuid;
  krisflyer_id   uuid;
  ver date := '2026-05-11';
  vby text := 'claude+copilot+chatgpt-2026-05-11';
  deleted int;
begin
  select id into ua_id        from programs where slug = 'united';
  united_id := ua_id;

  select id into aeroplan_id  from programs where slug = 'aeroplan';
  select id into ana_id       from programs where slug = 'ana';
  select id into avianca_id   from programs where slug = 'avianca';
  select id into turkish_id   from programs where slug = 'turkish';
  select id into krisflyer_id from programs where slug = 'krisflyer';

  if ua_id is null then raise exception 'united program row missing'; end if;

  -- ==========================================================================
  -- Cleanup: remove 5 generic meta-descriptor rows authored as placeholders
  -- ==========================================================================
  delete from partner_redemptions
   where operating_carrier_id = ua_id
     and cost_miles_low is null
     and currency_program_id in (aeroplan_id, ana_id, turkish_id, krisflyer_id);
  get diagnostics deleted = row_count;
  raise notice 'Cleaned % vague meta rows', deleted;

  -- Also remove the Miles & More meta row (slug uses hyphen in DB)
  delete from partner_redemptions
   where operating_carrier_id = ua_id
     and cost_miles_low is null
     and currency_program_id = (select id from programs where slug = 'miles-and-more');

  -- ==========================================================================
  -- 1. UNITED MILEAGEPLUS OWN METAL (dynamic - the baseline reference)
  -- ==========================================================================
  insert into partner_redemptions (
    currency_program_id, operating_carrier_id, cabin, region_or_route,
    cost_miles_low, cost_miles_high, pricing_model,
    fuel_surcharges, bookable_online, booking_channel,
    requires_saver_space, non_saver_fallback, routing_rules,
    teach_caption, notes, confidence, last_verified, verified_by,
    complexity_score, what_breaks_this, fees_note,
    cash_fee_low, cash_fee_high, route_buckets
  ) values
    (united_id, ua_id, 'Economy', 'US short-haul (saver + Web Specials)',
     5000, 15000, 'dynamic', 'none', true, 'united.com',
     false, 'Web Specials replace saver on most routes.', 'No stopovers allowed.',
     'Sometimes absurdly cheap. Sometimes United wakes up angry.',
     'Saver bucket X/I/O released to partners; XN expanded inventory NOT visible to partners.',
     'HIGH', ver, vby, 'easy', null,
     '$5.60 US 9/11 fee per segment. No fuel surcharges on UA metal.',
     6, 20, array['us-short']),

    (united_id, ua_id, 'Economy', 'US transcon (saver + Web Specials)',
     8500, 25000, 'dynamic', 'none', true, 'united.com',
     false, 'Web Specials common 12-22k.', 'No stopovers allowed.',
     'Wide variance. Web Specials sometimes great, often meh.',
     null, 'HIGH', ver, vby, 'easy', null,
     '$5.60 US 9/11 fee per segment.', 6, 25, array['us-medium', 'us-long']),

    (united_id, ua_id, 'Business', 'US transcon and Hawaii',
     25000, 80000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'Great when saver pops. Hideous when it does not. Set an alert.',
     null, 'HIGH', ver, vby, 'easy', 'Web Specials in J are rare and dynamic — verify before transferring in.',
     '$5.60 US 9/11 fee.', 6, 50, array['us-medium', 'us-long']),

    (united_id, ua_id, 'Economy', 'US to Europe',
     30000, 60000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'Not sexy, but easy and low-drama. Compare against Aeroplan 32.5k fixed first.',
     null, 'HIGH', ver, vby, 'easy', null,
     'US + EU gov taxes (~$50-120). No fuel surcharges.',
     50, 120, array['us-eu-east', 'us-eu-west']),

    (united_id, ua_id, 'Business', 'US to Europe',
     80000, 200000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'MileagePlus J to Europe has mood swings. Aeroplan 60-75k fixed usually wins.',
     null, 'HIGH', ver, vby, 'easy', 'Dynamic pricing means you might pay 2x what Aeroplan would charge.',
     'US + EU gov taxes.', 60, 180, array['us-eu-east', 'us-eu-west']),

    (united_id, ua_id, 'Business', 'US to Japan / Korea',
     100000, 250000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'Polaris is great. The pricing is less emotionally stable. ANA 50k one-way equivalent crushes this.',
     null, 'HIGH', ver, vby, 'easy', null, '$50-150 in taxes.',
     50, 150, array['us-japan']),

    (united_id, ua_id, 'Business', 'US to SE Asia / China',
     110000, 250000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'Aeroplan 87.5-115k fixed almost always beats this. Skip own-metal here.',
     null, 'MED', ver, vby, 'easy', null, '$60-180 in taxes.',
     60, 180, array['us-se-asia']),

    (united_id, ua_id, 'Business', 'US to Australia / NZ',
     110000, 300000, 'dynamic', 'none', true, 'united.com',
     false, null, null,
     'If you find saver space, buy a lottery ticket too. Otherwise pay ANA 72.5k one-way equivalent.',
     null, 'MED', ver, vby, 'easy', null, '$50-180 in taxes.',
     50, 180, array['us-pacific']);

  -- ==========================================================================
  -- 2. AIR CANADA AEROPLAN (HIGH — best overall balance for Star booking)
  -- ==========================================================================
  if aeroplan_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback, routing_rules,
      teach_caption, notes, confidence, last_verified, verified_by,
      complexity_score, what_breaks_this, fees_note,
      cash_fee_low, cash_fee_high, route_buckets
    ) values
      (aeroplan_id, ua_id, 'Economy', 'North America 0-1500 mi (short/medium)',
       6000, 10000, 'fixed', 'none', true, 'aircanada.com',
       true, null, '5,000-point free-stopover rule still in effect on RT awards.',
       'Often smarter than United itself for domestic saver space.',
       null, 'HIGH', ver, vby, 'easy', null,
       '$5.60 US 9/11 fee + Aeroplan partner taxes (~$20-60).',
       20, 60, array['us-short']),

      (aeroplan_id, ua_id, 'Business', 'North America transcon and short-haul',
       25000, 30000, 'fixed', 'none', true, 'aircanada.com',
       true, null, '5,000-point stopover available.',
       'One of the cleaner ways to book UA premium cabins.',
       null, 'HIGH', ver, vby, 'easy', null,
       '$20-80 in taxes. No fuel surcharges.', 20, 80,
       array['us-medium', 'us-long']),

      (aeroplan_id, ua_id, 'Economy', 'North America to Hawaii',
       22500, 25000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Good when Hawaii cash fares spike. On a $300 sale, save the points.',
       null, 'LOW', ver, vby, 'easy', null,
       '$5-50 in taxes.', 6, 50, array['us-long']),

      (aeroplan_id, ua_id, 'Business', 'North America to Hawaii',
       40000, 45000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Only worth it for lie-flat to HNL. For recliners this is a flex not a deal.',
       null, 'LOW', ver, vby, 'easy', null,
       '$5-50 in taxes.', 6, 50, array['us-long']),

      (aeroplan_id, ua_id, 'Economy', 'NA-Atlantic 0-4000 mi (East Coast to Europe)',
       32500, 32500, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Quiet overachiever. Beats UA dynamic when cash fares hit $700+.',
       'Band cut from 35k to 32.5k in 2026.', 'HIGH', ver, vby,
       'easy', null, 'US + EU gov taxes (~$50-120).', 50, 120,
       array['us-eu-east']),

      (aeroplan_id, ua_id, 'Business', 'NA-Atlantic 0-4000 mi (East Coast to Europe)',
       60000, 60000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Banger for shorter hops to Europe. Book this before you brag on Instagram.',
       'Business unchanged at 60k in 2026.', 'HIGH', ver, vby,
       'easy', null, 'US + EU taxes.', 50, 120, array['us-eu-east']),

      (aeroplan_id, ua_id, 'Economy', 'NA-Atlantic 4001-6000 mi (West Coast to Europe / deeper EU)',
       42500, 42500, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Slight nerf but still fine. If cash is cheap, do not waste the stash.',
       'Band raised from 40k to 42.5k in 2026.', 'HIGH', ver, vby,
       'easy', null, 'US + EU taxes (~$50-150).', 50, 150,
       array['us-eu-west']),

      (aeroplan_id, ua_id, 'Business', 'NA-Atlantic 4001-6000 mi (West Coast to Europe)',
       75000, 75000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Still a sweet spot vs UA dynamic. Just hurts a bit more now.',
       'Band raised from 70k to 75k in 2026.', 'HIGH', ver, vby,
       'easy', null, 'US + EU taxes.', 50, 150, array['us-eu-west']),

      (aeroplan_id, ua_id, 'Business', 'North America to Pacific 5500-7500 mi (Japan / Korea)',
       75000, 90000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Not the cheapest, but much easier than ANA round-trip restrictions.',
       null, 'HIGH', ver, vby, 'easy', null,
       '$60-120 in taxes.', 60, 120, array['us-japan']),

      (aeroplan_id, ua_id, 'Business', 'North America to Pacific 7501-11000 mi (deep Asia)',
       87500, 115000, 'fixed', 'none', true, 'aircanada.com',
       true, null, 'Multi-segment Star Alliance routings allowed with one stopover for 5,000 extra points.',
       'Stopover trick still makes this spicy. Free stopover via the 5k add-on is still alive.',
       'Band raised from 87.5k to 102.5k in 2026 for some sub-bands.', 'HIGH', ver, vby,
       'easy', null, '$70-180 in taxes.', 70, 180, array['us-se-asia']),

      (aeroplan_id, ua_id, 'Business', 'North America to Middle East / India',
       90000, 120000, 'fixed', 'none', true, 'aircanada.com',
       true, null, null,
       'Quietly strong if routing cooperates.',
       null, 'HIGH', ver, vby, 'easy', null,
       '$80-180 in taxes.', 80, 180, array['us-me-india']);
  end if;

  -- ==========================================================================
  -- 3. ANA MILEAGE CLUB (HIGH — round-trip required, stored as one-way equivalent)
  -- ==========================================================================
  if ana_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback, routing_rules,
      teach_caption, notes, confidence, last_verified, verified_by,
      complexity_score, what_breaks_this, fees_note,
      cash_fee_low, cash_fee_high, route_buckets
    ) values
      (ana_id, ua_id, 'Economy', 'US to Japan (one-way equivalent of 55-60k RT chart)',
       27500, 30000, 'fixed', 'low', true, 'ana.co.jp (hybrid online support)',
       true, null, 'Round-trip required for partner awards. Stored as 1/2 of RT chart for easy comparison.',
       'Round-trip-only keeps casuals away. Good for you.',
       'ANA raised partner awards in 2024. Still strong.', 'HIGH', ver, vby,
       'annoying', 'Round-trip required. One-ways are not bookable.',
       'Japanese departure tax + US fees (~$150-350 RT).',
       75, 175, array['us-japan']),

      (ana_id, ua_id, 'Business', 'US to Japan (one-way equivalent of 100k RT chart)',
       50000, 50000, 'fixed', 'low', true, 'ana.co.jp',
       true, null, 'Round-trip required. 100k Avios RT total.',
       'Still absurdly good if you can plan like an adult.',
       'Raised from 88k to 100k RT in 2024.', 'HIGH', ver, vby,
       'annoying', 'Round-trip required.',
       'JP + US taxes (~$200-500 RT).', 100, 250, array['us-japan']),

      (ana_id, ua_id, 'Business', 'US to Europe (one-way equivalent of 100k RT chart)',
       50000, 50000, 'fixed', 'low', true, 'ana.co.jp',
       true, null, 'Round-trip required. 100k Avios RT total.',
       'Usually crushes United pricing. Plan as an RT and the math gets fun.',
       null, 'HIGH', ver, vby,
       'annoying', 'Round-trip required.',
       'US + EU + processing (~$250-700 RT).',
       125, 350, array['us-eu-east', 'us-eu-west']),

      (ana_id, ua_id, 'Business', 'US to SE Asia / China (one-way equivalent of 110-136k RT)',
       55000, 68000, 'fixed', 'low', true, 'ana.co.jp',
       true, null, 'Round-trip required.',
       'Incredible value, but flexibility required.',
       null, 'MED', ver, vby,
       'annoying', 'Round-trip required.',
       '$125-350 OW equivalent in taxes.',
       125, 350, array['us-se-asia']),

      (ana_id, ua_id, 'Business', 'US to Australia / NZ (one-way equivalent of 145k RT)',
       72500, 72500, 'fixed', 'low', true, 'ana.co.jp',
       true, null, 'Round-trip required. 145k total RT.',
       'Better than paying United six figures each way. Bring patience.',
       null, 'HIGH', ver, vby,
       'annoying', 'Round-trip required.',
       '$125-400 OW equivalent.', 125, 400, array['us-pacific']);
  end if;

  -- ==========================================================================
  -- 4. AVIANCA LIFEMILES (MED — fuel-surcharge-free, IT can be annoying)
  -- ==========================================================================
  if avianca_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback, routing_rules,
      teach_caption, notes, confidence, last_verified, verified_by,
      complexity_score, what_breaks_this, fees_note,
      cash_fee_low, cash_fee_high, route_buckets
    ) values
      (avianca_id, ua_id, 'Economy', 'Within North America (single zone)',
       7500, 15000, 'fixed', 'none', true, 'lifemiles.com',
       true, null, null,
       'Cheap and surcharge-free. The website may fight you though.',
       'Stealth repricing has been observed; verify on lifemiles.com.', 'MED', ver, vby,
       'annoying', 'LifeMiles IT has phantom space + mixed-cabin bugs. Verify before transferring.',
       'US 9/11 fee + LifeMiles processing (~$5-40).', 6, 40, array['us-short', 'us-medium']),

      (avianca_id, ua_id, 'Business', 'US to Europe',
       63000, 80000, 'fixed', 'none', true, 'lifemiles.com',
       true, null, null,
       'Still one of the best Star Alliance business plays for Europe. Surcharge-free wins it.',
       null, 'HIGH', ver, vby, 'annoying',
       'Phantom space + occasional ticketing issues on partner awards.',
       'US + EU taxes only (no fuel surcharges).', 30, 80,
       array['us-eu-east', 'us-eu-west']),

      (avianca_id, ua_id, 'Business', 'US to Japan / Korea',
       75000, 90000, 'fixed', 'none', true, 'lifemiles.com',
       true, null, null,
       'Great when it tickets. Annoying when it does not.',
       null, 'MED', ver, vby, 'annoying',
       'Booking can stall — call to confirm before transferring.',
       'US + JP taxes.', 40, 120, array['us-japan']),

      (avianca_id, ua_id, 'Business', 'US to SE Asia / China',
       78000, 100000, 'fixed', 'none', true, 'lifemiles.com',
       true, null, null,
       'No fuel surcharges saves real money here vs other Star options.',
       null, 'MED', ver, vby, 'annoying',
       'IT tantrums are part of the experience.',
       'US + intl taxes.', 50, 150, array['us-se-asia']),

      (avianca_id, ua_id, 'Business', 'US to Australia / NZ',
       80000, 110000, 'fixed', 'none', true, 'lifemiles.com',
       true, null, null,
       'Exists more often in theory than reality.',
       null, 'LOW', ver, vby, 'annoying',
       'Phantom space is common on this route.',
       'US + AU taxes.', 80, 180, array['us-pacific']);
  end if;

  -- ==========================================================================
  -- 5. TURKISH MILES & SMILES (MED — devalued from peak years but still works)
  -- ==========================================================================
  if turkish_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback, routing_rules,
      teach_caption, notes, confidence, last_verified, verified_by,
      complexity_score, what_breaks_this, fees_note,
      cash_fee_low, cash_fee_high, devalued_at, devaluation_note,
      route_buckets
    ) values
      (turkish_id, ua_id, 'Economy', 'US domestic one-way',
       10000, 15000, 'fixed', 'none', false, 'hybrid (online sometimes works; call otherwise)',
       true, null, null,
       'RIP to the legendary 7.5k deal. Still decent sometimes.',
       null, 'MED', ver, vby, 'annoying',
       'Booking process aged. Allow time on the phone if online ticketing fails.',
       '$5.60 + small processing.', 6, 40,
       '2024-06-01', 'Domestic UA short-haul increased from 7.5k to 10-15k range.',
       array['us-short', 'us-medium']),

      (turkish_id, ua_id, 'Business', 'US transcon and Hawaii',
       15000, 25000, 'fixed', 'none', false, 'hybrid',
       true, null, null,
       'Still occasionally hilarious value if you enjoy suffering through the booking flow.',
       null, 'MED', ver, vby, 'annoying',
       'Hybrid online/phone booking. Have patience.',
       '$5.60 + processing.', 6, 50, null, null,
       array['us-medium', 'us-long']),

      (turkish_id, ua_id, 'Business', 'US to Europe',
       65000, 90000, 'fixed', 'low', false, 'hybrid',
       true, null, null,
       'Pricing can still beat United by a mile. Booking process may age you.',
       null, 'MED', ver, vby, 'annoying',
       'Phone booking common for partner awards.',
       '$80-180 in taxes/processing.', 80, 180, null, null,
       array['us-eu-east', 'us-eu-west']),

      (turkish_id, ua_id, 'Business', 'US to SE Asia / China',
       90000, 115000, 'fixed', 'low', false, 'hybrid',
       true, null, null,
       'Possible, but not beginner-friendly.',
       null, 'LOW', ver, vby, 'annoying',
       'Phone-heavy. Verify availability before transferring.',
       '$100-250 in taxes.', 100, 250, null, null,
       array['us-se-asia']);
  end if;

  -- ==========================================================================
  -- 6. SINGAPORE KRISFLYER (MED — reliable but rarely cheapest)
  -- ==========================================================================
  if krisflyer_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback, routing_rules,
      teach_caption, notes, confidence, last_verified, verified_by,
      complexity_score, what_breaks_this, fees_note,
      cash_fee_low, cash_fee_high, route_buckets
    ) values
      (krisflyer_id, ua_id, 'Economy', 'US domestic',
       14000, 20000, 'fixed', 'none', true, 'singaporeair.com',
       true, null, null,
       'Usually not the cheapest. Usually works.',
       null, 'MED', ver, vby, 'easy', null,
       '$5.60 + processing.', 6, 40, array['us-short', 'us-medium']),

      (krisflyer_id, ua_id, 'Business', 'US to Europe',
       81000, 97000, 'fixed', 'low', true, 'singaporeair.com',
       true, null, null,
       'More useful for access than raw value. Aeroplan or Avianca usually beats it.',
       null, 'MED', ver, vby, 'easy', null,
       '$50-150 in taxes.', 50, 150, array['us-eu-east', 'us-eu-west']),

      (krisflyer_id, ua_id, 'Business', 'US to Japan / Korea',
       95000, 110000, 'fixed', 'low', true, 'singaporeair.com',
       true, null, null,
       'Solid fallback when ANA space disappears.',
       null, 'MED', ver, vby, 'easy', null,
       '$50-150 in taxes.', 50, 150, array['us-japan']),

      (krisflyer_id, ua_id, 'Business', 'US to SE Asia / China',
       107000, 130000, 'fixed', 'low', true, 'singaporeair.com',
       true, null, null,
       'KrisFlyer shines more on SQ metal than UA. For UA-operated, Aeroplan wins.',
       null, 'HIGH', ver, vby, 'easy', null,
       '$60-200 in taxes.', 60, 200, array['us-se-asia']);
  end if;

  -- ==========================================================================
  -- Set partner_access on Aeroplan + Avianca + Turkish + KrisFlyer
  -- (all four are partner programs that can book UA-operated flights)
  -- ==========================================================================
  update programs
     set partner_access = 'YES_STRONG',
         partner_access_notes = 'Distance-based partner chart with predictable pricing. 5,000-point free-stopover rule still alive.'
   where slug = 'aeroplan' and partner_access is null;

  update programs
     set partner_access = 'YES_LIMITED',
         partner_access_notes = 'Strong on paper but IT has phantom space + mixed-cabin bugs. Surcharge-free is the killer feature.'
   where slug = 'avianca' and partner_access is null;

  update programs
     set partner_access = 'YES_RESTRICTED',
         partner_access_notes = 'Devalued from peak years (RIP 7.5k UA domestic). Booking flow is dated; expect phone calls.'
   where slug = 'turkish' and partner_access is null;

  update programs
     set partner_access = 'YES_STRONG',
         partner_access_notes = 'Reliable Star Alliance booking via singaporeair.com. Rarely the cheapest but usually works.'
   where slug = 'krisflyer' and partner_access is null;
end $$;
