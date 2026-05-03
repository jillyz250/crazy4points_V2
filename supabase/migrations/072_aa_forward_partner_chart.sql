-- 072_aa_forward_partner_chart.sql
-- Tier 1, Phase 1 forward direction: seed partner_redemptions rows where
-- AAdvantage (currency=aa) is used to book partner-airline flights.
--
-- AA's published partner award chart in 2026 is a SINGLE region-based chart
-- that applies uniformly to all partner airlines. So pricing is identical
-- across partners; per-operator differences live in bookable_online,
-- booking_channel, fuel_surcharges, and teach_caption.
--
-- Source: https://www.aa.com/i18n/aadvantage-program/use-miles/award-travel/partner-airlines.jsp
-- Verified: 2026-05-03 by claude+chatgpt-2026-05-03
--
-- Each partner gets rows ONLY for the regions they actually operate (not the
-- full chart cross-multiplied). First Class rows are included only for
-- partners that operate F on the relevant routes. Premium Economy rows are
-- included only for partners that distinguish PE from Economy in inventory.
--
-- Operators are CARRIER slugs (alaska, british_airways, cathay_pacific,
-- japan_airlines, qatar_airways) — not loyalty-program slugs (atmos, ba_avios,
-- cathay, jal, qatar). The miles you SPEND are AAdvantage; the airline you
-- FLY is the carrier.

do $$
declare
  aa_id uuid;
  -- carrier ids
  alaska_id        uuid;
  british_airways_id uuid;
  cathay_pacific_id  uuid;
  finnair_id       uuid;
  iberia_id        uuid;
  japan_airlines_id uuid;
  malaysia_id      uuid;
  qantas_id        uuid;
  qatar_airways_id uuid;
  royal_air_maroc_id uuid;
  royal_jordanian_id uuid;
  srilankan_id     uuid;
  aer_lingus_id    uuid;
  etihad_id        uuid;
  fiji_id          uuid;

  -- Reused literals to keep insert tidy
  ver date := '2026-05-03';
  vby text := 'claude+chatgpt-2026-05-03';
  src text := 'AA published partner award chart 2026';
begin
  select id into aa_id              from programs where slug = 'aa';
  select id into alaska_id          from programs where slug = 'alaska';
  select id into british_airways_id from programs where slug = 'british_airways';
  select id into cathay_pacific_id  from programs where slug = 'cathay_pacific';
  select id into finnair_id         from programs where slug = 'finnair';
  select id into iberia_id          from programs where slug = 'iberia';
  select id into japan_airlines_id  from programs where slug = 'japan_airlines';
  select id into malaysia_id        from programs where slug = 'malaysia';
  select id into qantas_id          from programs where slug = 'qantas';
  select id into qatar_airways_id   from programs where slug = 'qatar_airways';
  select id into royal_air_maroc_id from programs where slug = 'royal_air_maroc';
  select id into royal_jordanian_id from programs where slug = 'royal_jordanian';
  select id into srilankan_id       from programs where slug = 'srilankan';
  select id into aer_lingus_id      from programs where slug = 'aer_lingus';
  select id into etihad_id          from programs where slug = 'etihad';
  select id into fiji_id            from programs where slug = 'fiji';

  if aa_id is null then raise exception 'aa program row missing'; end if;

  -- ==========================================================================
  -- 1. AAdvantage -> Alaska Airlines (Within North America)
  -- ==========================================================================
  insert into partner_redemptions (
    currency_program_id, operating_carrier_id, cabin, region_or_route,
    cost_miles_low, cost_miles_high, pricing_model,
    fuel_surcharges, bookable_online, booking_channel,
    requires_saver_space, non_saver_fallback,
    routing_rules, teach_caption, notes,
    confidence, last_verified, verified_by
  ) values
    (aa_id, alaska_id, 'Economy',  'Within North America', 12500, 12500, 'fixed',
     'none', true, 'aa.com', true, null, null,
     'AAdvantage 12.5k for Alaska short-haul economy is fine but Alaska Atmos itself prices the same flight as low as 4.5k.',
     null, 'HIGH', ver, vby),
    (aa_id, alaska_id, 'Business', 'Within North America', 25000, 25000, 'fixed',
     'none', true, 'aa.com', true, null, null,
     'Alaska Atmos beats AAdvantage 25k by a wide margin on domestic J. Use AAdvantage only if you have no Atmos miles.',
     null, 'HIGH', ver, vby),
    (aa_id, alaska_id, 'First',    'Within North America', 32500, 32500, 'fixed',
     'none', true, 'aa.com', true, null, null,
     'AAdvantage 32.5k for Alaska First is a fallback only. Atmos prices F dramatically lower.',
     null, 'HIGH', ver, vby);

  -- ==========================================================================
  -- 2. AAdvantage -> British Airways (NA -> Europe)
  -- ==========================================================================
  if british_airways_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, british_airways_id, 'Economy',         'North America to Europe', 30000, 30000, 'fixed',
       'high', true, 'aa.com', true, null, null,
       'AA charges no fuel surcharge in miles, but BA passes high cash fuel surcharges on its own metal. Expect $300-$700 in fees one-way.',
       null, 'HIGH', ver, vby),
      (aa_id, british_airways_id, 'Premium Economy', 'North America to Europe', 40000, 40000, 'fixed',
       'high', true, 'aa.com', true, null, null,
       'Cash surcharges hit hard on BA premium cabins. Often more cost-effective via Iberia (no surcharges) when J is open.',
       null, 'HIGH', ver, vby),
      (aa_id, british_airways_id, 'Business',        'North America to Europe', 57500, 57500, 'fixed',
       'high', true, 'aa.com', true, null, null,
       '57.5k AAdvantage J to Europe is a strong rate, but BA fuel surcharges can run $700+. Iberia or Aer Lingus same chart, no surcharges.',
       null, 'HIGH', ver, vby),
      (aa_id, british_airways_id, 'First',           'North America to Europe', 85000, 85000, 'fixed',
       'high', true, 'aa.com', true, null, null,
       'Surcharges often $1,000+ on BA F. Worth it for the F product, but verify cash co-pay before booking.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 3. AAdvantage -> Cathay Pacific (NA -> Asia 2)
  -- ==========================================================================
  if cathay_pacific_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, cathay_pacific_id, 'Economy',         'North America to Asia (SE Asia / China)', 37500, 37500, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Solid Y rate to HKG. Cathay Asia Miles can sometimes do better on premium for the same route.',
       null, 'HIGH', ver, vby),
      (aa_id, cathay_pacific_id, 'Premium Economy', 'North America to Asia (SE Asia / China)', 55000, 55000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Cathay PE is a real cabin and good value at 55k.',
       null, 'HIGH', ver, vby),
      (aa_id, cathay_pacific_id, 'Business',        'North America to Asia (SE Asia / China)', 70000, 70000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Classic AA sweet spot. 70k for Cathay J to HKG is excellent. Search aa.com directly; saver does exist.',
       null, 'HIGH', ver, vby),
      (aa_id, cathay_pacific_id, 'First',           'North America to Asia (SE Asia / China)', 110000, 110000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Cathay F is one of the great products. Availability is the bottleneck — when it opens, book fast.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 4. AAdvantage -> Finnair (NA -> Europe)
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
      (aa_id, finnair_id, 'Economy',  'North America to Europe', 30000, 30000, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'No fuel surcharges, unlike BA. Routes via HEL.',
       null, 'HIGH', ver, vby),
      (aa_id, finnair_id, 'Business', 'North America to Europe', 57500, 57500, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'Excellent J option to Europe via Helsinki. No fuel surcharges.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 5. AAdvantage -> Iberia (NA -> Europe)
  -- ==========================================================================
  if iberia_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, iberia_id, 'Economy',  'North America to Europe', 30000, 30000, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'No fuel surcharges. Strong alternative to BA for transatlantic.',
       null, 'HIGH', ver, vby),
      (aa_id, iberia_id, 'Business', 'North America to Europe', 57500, 57500, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'Outstanding J value to Madrid. No surcharges, good award space.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 6. AAdvantage -> Japan Airlines (NA -> Asia 1)
  -- ==========================================================================
  if japan_airlines_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, japan_airlines_id, 'Economy',         'North America to Asia (Japan / Korea)', 35000, 35000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Solid rate to Tokyo / Seoul.',
       null, 'HIGH', ver, vby),
      (aa_id, japan_airlines_id, 'Premium Economy', 'North America to Asia (Japan / Korea)', 50000, 50000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Real PE cabin on JAL widebodies. Decent value.',
       null, 'HIGH', ver, vby),
      (aa_id, japan_airlines_id, 'Business',        'North America to Asia (Japan / Korea)', 60000, 60000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Hall-of-fame sweet spot. 60k AAdvantage for JAL J is one of the best fixed rates left in the industry.',
       null, 'HIGH', ver, vby),
      (aa_id, japan_airlines_id, 'First',           'North America to Asia (Japan / Korea)', 80000, 80000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'JAL Suites at 80k is industry-leading. Availability is rare; set alerts.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 7. AAdvantage -> Malaysia Airlines (NA -> Asia 2)
  -- ==========================================================================
  if malaysia_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, malaysia_id, 'Economy',  'North America to Asia (SE Asia / China)', 37500, 37500, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Patchy availability. Worth checking but do not count on it.',
       null, 'MED', ver, vby),
      (aa_id, malaysia_id, 'Business', 'North America to Asia (SE Asia / China)', 70000, 70000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Same chart as Cathay but availability is the bottleneck. Cathay usually preferred.',
       null, 'MED', ver, vby);
  end if;

  -- ==========================================================================
  -- 8. AAdvantage -> Qantas (NA -> South Pacific)
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
      (aa_id, qantas_id, 'Economy',         'North America to South Pacific (Australia / NZ)', 40000, 40000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Long flights to Australia. Y award space exists but premium is famously hard to find.',
       null, 'HIGH', ver, vby),
      (aa_id, qantas_id, 'Premium Economy', 'North America to South Pacific (Australia / NZ)', 65000, 65000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Qantas A380 PE is a great seat for the price.',
       null, 'HIGH', ver, vby),
      (aa_id, qantas_id, 'Business',        'North America to South Pacific (Australia / NZ)', 80000, 80000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       '80k J to Australia is excellent if you can find it. Search 330+ days out for best chance.',
       null, 'HIGH', ver, vby),
      (aa_id, qantas_id, 'First',           'North America to South Pacific (Australia / NZ)', 110000, 110000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Qantas A380 First is rare gold. Availability may go years without opening on a given route.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 9. AAdvantage -> Qatar Airways (NA -> Middle East / India)
  -- ==========================================================================
  if qatar_airways_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, qatar_airways_id, 'Economy',         'North America to Middle East / India', 40000, 40000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Solid Y to DOH or onward to Indian subcontinent.',
       null, 'HIGH', ver, vby),
      (aa_id, qatar_airways_id, 'Premium Economy', 'North America to Middle East / India', 55000, 55000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Qatar PE is solid; lower-cost alternative to Qsuite if J is unavailable.',
       null, 'HIGH', ver, vby),
      (aa_id, qatar_airways_id, 'Business',        'North America to Middle East / India', 70000, 70000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Hall-of-fame: Qsuite for 70k AAdvantage. Availability is good. One of the strongest J redemptions in the world.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 10. AAdvantage -> Royal Air Maroc (NA -> Africa)
  -- ==========================================================================
  if royal_air_maroc_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, royal_air_maroc_id, 'Economy',  'North America to Africa', 40000, 40000, 'fixed',
       'low', true, 'aa.com', true, null, 'Occasional phone booking required for some routes.',
       'Casablanca gateway. Y to North Africa or onward.',
       null, 'MED', ver, vby),
      (aa_id, royal_air_maroc_id, 'Business', 'North America to Africa', 75000, 75000, 'fixed',
       'low', true, 'aa.com', true, null, null,
       'Decent J price to Africa. RAM 787 product is reasonable.',
       null, 'MED', ver, vby);
  end if;

  -- ==========================================================================
  -- 11. AAdvantage -> Royal Jordanian (NA -> Middle East / India)
  -- ==========================================================================
  if royal_jordanian_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, royal_jordanian_id, 'Economy',  'North America to Middle East / India', 40000, 40000, 'fixed',
       'low', true, 'aa.com (occasional phone)', true, null, 'Some routes require phone booking.',
       'Amman gateway. Limited US routes.',
       null, 'MED', ver, vby),
      (aa_id, royal_jordanian_id, 'Business', 'North America to Middle East / India', 70000, 70000, 'fixed',
       'low', true, 'aa.com (occasional phone)', true, null, null,
       'Same chart as Qatar but Qsuite is the better product. Use RJ only if Qatar unavailable.',
       null, 'MED', ver, vby);
  end if;

  -- ==========================================================================
  -- 12. AAdvantage -> SriLankan (NA -> Asia 2)
  -- ==========================================================================
  if srilankan_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, srilankan_id, 'Economy',  'North America to Asia (SE Asia / China)', 37500, 37500, 'fixed',
       'low', false, 'phone often required', true, null, null,
       'Niche partner, limited online visibility. Useful for connections to Indian subcontinent via CMB.',
       null, 'MED', ver, vby),
      (aa_id, srilankan_id, 'Business', 'North America to Asia (SE Asia / China)', 70000, 70000, 'fixed',
       'low', false, 'phone often required', true, null, null,
       'Phone booking expected. Limited inventory.',
       null, 'LOW', ver, vby);
  end if;

  -- ==========================================================================
  -- 13. AAdvantage -> Aer Lingus (NA -> Europe)
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
      (aa_id, aer_lingus_id, 'Economy',  'North America to Europe', 30000, 30000, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'No fuel surcharges. Dublin gateway. Strong alternative to BA for Ireland / EU connections.',
       null, 'HIGH', ver, vby),
      (aa_id, aer_lingus_id, 'Business', 'North America to Europe', 57500, 57500, 'fixed',
       'none', true, 'aa.com', true, null, null,
       'Sweet spot for transatlantic J. No surcharges, lay-flat business cabin.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 14. AAdvantage -> Etihad Airways (NA -> Middle East / India)
  -- ==========================================================================
  if etihad_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, etihad_id, 'Economy',         'North America to Middle East / India', 40000, 40000, 'fixed',
       'low', false, 'phone only (call AA)', true, null, null,
       'Etihad is bookable with AAdvantage but phone-only. Plan a 30-60 min call to AA.',
       null, 'HIGH', ver, vby),
      (aa_id, etihad_id, 'Premium Economy', 'North America to Middle East / India', 55000, 55000, 'fixed',
       'low', false, 'phone only', true, null, null,
       'Phone-only via AA. Etihad PE is solid mid-cabin.',
       null, 'HIGH', ver, vby),
      (aa_id, etihad_id, 'Business',        'North America to Middle East / India', 70000, 70000, 'fixed',
       'low', false, 'phone only', true, null, null,
       'Etihad J Apartments are world-class. Phone booking and patient agent required.',
       null, 'HIGH', ver, vby),
      (aa_id, etihad_id, 'First',           'North America to Middle East / India', 115000, 115000, 'fixed',
       'low', false, 'phone only', true, null, null,
       'Etihad Apartments / Residence territory. Availability is the limit, not miles.',
       null, 'HIGH', ver, vby);
  end if;

  -- ==========================================================================
  -- 15. AAdvantage -> Fiji Airways (NA -> South Pacific)
  -- ==========================================================================
  if fiji_id is not null then
    insert into partner_redemptions (
      currency_program_id, operating_carrier_id, cabin, region_or_route,
      cost_miles_low, cost_miles_high, pricing_model,
      fuel_surcharges, bookable_online, booking_channel,
      requires_saver_space, non_saver_fallback,
      routing_rules, teach_caption, notes,
      confidence, last_verified, verified_by
    ) values
      (aa_id, fiji_id, 'Economy',  'North America to South Pacific (Australia / NZ)', 40000, 40000, 'fixed',
       'low', false, 'limited online; phone often needed', true, null, null,
       'Good for direct LAX-NAN. Connections to Australia / NZ via Fiji are real.',
       null, 'MED', ver, vby),
      (aa_id, fiji_id, 'Business', 'North America to South Pacific (Australia / NZ)', 80000, 80000, 'fixed',
       'low', false, 'limited online; phone often needed', true, null, null,
       'Fiji A350 J product is solid. Availability decent. Limited online — call AA.',
       null, 'MED', ver, vby);
  end if;
end $$;
