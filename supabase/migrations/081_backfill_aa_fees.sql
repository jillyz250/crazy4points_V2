-- 081_backfill_aa_fees.sql
-- Backfill cash_fee_low / cash_fee_high / fees_note for every AA-related
-- partner_redemptions row.
--
-- Sources (all verified 2026-05-03):
--   - Atmos $12.50 partner-award fee per person/direction (Frequent Miler 2026,
--     One Mile at a Time, Alaska's site)
--   - BA Avios fuel surcharges - apply to BA-OPERATED flights only;
--     AA-operated transatlantic on Avios = no surcharges (AwardWallet 2026,
--     The Points Guy 2026, Upgraded Points 2026)
--   - Etihad Guest -> AA = no fuel surcharges since AA doesn't impose any
--     (FlyerTalk verified 2025, RewardExpert)
--   - AAdvantage -> BA-operated transatlantic = $700+ in BA YQ surcharges
--     (industry-standard for BA award redemptions on its own metal)
--   - AAdvantage own metal = US gov't taxes only ($5.60 domestic 9/11 fee,
--     $50-120 international depending on country)
--
-- Also corrects the BA Avios -> AA distance band 5+6 fuel_surcharges flag,
-- which 076 left as 'high' (wrong - those rows are AA-operated, not BA).

do $$
declare
  aa_id              uuid;
  atmos_id           uuid;
  ba_avios_id        uuid;
  iberia_id          uuid;
  aer_lingus_id      uuid;
  qatar_id           uuid;
  cathay_id          uuid;
  jal_id             uuid;
  etihad_id          uuid;
  qantas_id          uuid;
  finnair_id         uuid;
  srilankan_id       uuid;
  -- carrier ids (forward direction operators)
  alaska_op_id       uuid;
  british_airways_id uuid;
  cathay_pacific_id  uuid;
  finnair_op_id      uuid;
  iberia_op_id       uuid;
  japan_airlines_id  uuid;
  malaysia_id        uuid;
  qantas_op_id       uuid;
  qatar_airways_id   uuid;
  royal_air_maroc_id uuid;
  royal_jordanian_id uuid;
  srilankan_op_id    uuid;
  aer_lingus_op_id   uuid;
  etihad_op_id       uuid;
  fiji_id            uuid;
begin
  select id into aa_id              from programs where slug = 'aa';
  select id into atmos_id           from programs where slug = 'atmos';
  select id into ba_avios_id        from programs where slug = 'ba_avios';
  select id into iberia_id          from programs where slug = 'iberia';
  select id into aer_lingus_id      from programs where slug = 'aer_lingus';
  select id into qatar_id           from programs where slug = 'qatar';
  select id into cathay_id          from programs where slug = 'cathay';
  select id into jal_id             from programs where slug = 'jal';
  select id into etihad_id          from programs where slug = 'etihad';
  select id into qantas_id          from programs where slug = 'qantas';
  select id into finnair_id         from programs where slug = 'finnair';
  select id into srilankan_id       from programs where slug = 'srilankan';

  -- carriers (operators in forward direction)
  alaska_op_id       := atmos_id;  -- using atmos for currency, but operator is alaska carrier
  select id into alaska_op_id       from programs where slug = 'alaska';
  select id into british_airways_id from programs where slug = 'british_airways';
  select id into cathay_pacific_id  from programs where slug = 'cathay_pacific';
  select id into finnair_op_id      from programs where slug = 'finnair';
  select id into iberia_op_id       from programs where slug = 'iberia';
  select id into japan_airlines_id  from programs where slug = 'japan_airlines';
  select id into malaysia_id        from programs where slug = 'malaysia';
  select id into qantas_op_id       from programs where slug = 'qantas';
  select id into qatar_airways_id   from programs where slug = 'qatar_airways';
  select id into royal_air_maroc_id from programs where slug = 'royal_air_maroc';
  select id into royal_jordanian_id from programs where slug = 'royal_jordanian';
  select id into srilankan_op_id    from programs where slug = 'srilankan';
  select id into aer_lingus_op_id   from programs where slug = 'aer_lingus';
  select id into etihad_op_id       from programs where slug = 'etihad';
  select id into fiji_id            from programs where slug = 'fiji';

  -- ==========================================================================
  -- REVERSE DIRECTION (other miles -> AA)
  -- ==========================================================================

  -- Atmos -> AA: $12.50 partner fee + $5.60 US 9/11 fee per person, per direction
  update partner_redemptions
     set cash_fee_low = 18, cash_fee_high = 18,
         fees_note = '$12.50 Atmos partner fee + ~$5.60 US tax. Atmos Summit Card waives the partner fee.'
   where currency_program_id = atmos_id and operating_carrier_id = aa_id;

  -- AAdvantage own metal: just US gov't taxes
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 6,
         fees_note = '$5.60 US 9/11 security fee per segment.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and (region_or_route ilike '%short-haul%' or region_or_route ilike '%transcon%');

  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 100,
         fees_note = 'US departure tax + security fees. No fuel surcharges on AA metal.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and region_or_route ilike '%Europe%';

  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 120,
         fees_note = 'US departure tax + security fees. No fuel surcharges on AA metal.'
   where currency_program_id = aa_id and operating_carrier_id = aa_id
     and region_or_route ilike '%Asia%';

  -- BA Avios -> AA: All AA-operated, NO BA fuel surcharges. Just US taxes.
  -- Also fix the 'high' fuel_surcharges flag on bands 5-6 (AA-operated = none).
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 6,
         fees_note = '$5.60 US 9/11 fee. No fuel surcharges - AA doesn''t impose them.'
   where currency_program_id = ba_avios_id and operating_carrier_id = aa_id
     and region_or_route ilike '%distance band [1-4]%';

  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 100,
         fuel_surcharges = 'none',
         fees_note = 'US departure + UK arrival tax (~$50-100). No BA fuel surcharges on AA-operated transatlantic.'
   where currency_program_id = ba_avios_id and operating_carrier_id = aa_id
     and region_or_route ilike '%distance band [5-6]%';

  -- Iberia, Aer Lingus, Qatar Avios -> AA: same as BA (shared chart, no surcharges on AA metal)
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 6,
         fees_note = '$5.60 US 9/11 fee. Avios on AA-operated = no fuel surcharges.'
   where currency_program_id in (iberia_id, aer_lingus_id, qatar_id)
     and operating_carrier_id = aa_id
     and region_or_route ilike '%distance band [1-4]%';

  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 100,
         fees_note = 'US + EU gov''t taxes. Avios on AA-operated transatlantic = no fuel surcharges.'
   where currency_program_id in (iberia_id, aer_lingus_id, qatar_id)
     and operating_carrier_id = aa_id
     and region_or_route ilike '%distance band [5-6]%';

  -- Cathay Asia Miles -> AA: low fuel surcharges, taxes
  update partner_redemptions
     set cash_fee_low = 10, cash_fee_high = 80,
         fees_note = 'Low fuel surcharges + gov''t taxes. Higher on premium long-haul.'
   where currency_program_id = cathay_id and operating_carrier_id = aa_id;

  -- JAL -> AA: round-trip required, low fees
  update partner_redemptions
     set cash_fee_low = 12, cash_fee_high = 60,
         fees_note = '~$5.60 each direction (RT required). No fuel surcharges on AA metal.'
   where currency_program_id = jal_id and operating_carrier_id = aa_id;

  -- Etihad -> AA: no fuel surcharges (AA doesn't impose any), phone-only
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 25,
         fees_note = 'US 9/11 fee + small Etihad processing. No fuel surcharges - AA doesn''t impose them.'
   where currency_program_id = etihad_id and operating_carrier_id = aa_id
     and region_or_route ilike '%domestic%';

  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 100,
         fees_note = 'US + EU gov''t taxes. No fuel surcharges on AA metal.'
   where currency_program_id = etihad_id and operating_carrier_id = aa_id
     and region_or_route ilike '%Europe%';

  -- Qantas -> AA: no surcharges
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 12,
         fees_note = '$5.60 US 9/11 fee per direction. No surcharges.'
   where currency_program_id = qantas_id and operating_carrier_id = aa_id;

  -- Finnair -> AA: similar
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 12,
         fees_note = '$5.60 US 9/11 fee. No fuel surcharges.'
   where currency_program_id = finnair_id and operating_carrier_id = aa_id;

  -- SriLankan -> AA: phone booking, gov't taxes only
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 30,
         fees_note = 'US 9/11 fee + possible phone-booking surcharge.'
   where currency_program_id = srilankan_id and operating_carrier_id = aa_id;

  -- ==========================================================================
  -- FORWARD DIRECTION (AAdvantage -> partners)
  -- ==========================================================================

  -- AAdvantage -> Alaska (within NA): just US tax
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 6,
         fees_note = '$5.60 US 9/11 fee. No fuel surcharges.'
   where currency_program_id = aa_id and operating_carrier_id = alaska_op_id;

  -- AAdvantage -> BA (NA-EU): BA imposes high cash fuel surcharges on its own metal
  update partner_redemptions
     set cash_fee_low = 300, cash_fee_high = 700,
         fees_note = 'BA fuel surcharges $300-700 in Y, higher in premium. AAdvantage doesn''t pass these in miles.'
   where currency_program_id = aa_id and operating_carrier_id = british_airways_id
     and cabin in ('Economy', 'Premium Economy');

  update partner_redemptions
     set cash_fee_low = 500, cash_fee_high = 1000,
         fees_note = 'BA fuel surcharges run $700+ in J, $1,000+ in F. Always check the cash co-pay before booking.'
   where currency_program_id = aa_id and operating_carrier_id = british_airways_id
     and cabin in ('Business', 'First');

  -- AAdvantage -> Cathay (NA-Asia 2): low fuel + taxes
  update partner_redemptions
     set cash_fee_low = 30, cash_fee_high = 120,
         fees_note = 'Cathay imposes minimal fuel surcharges + gov''t taxes.'
   where currency_program_id = aa_id and operating_carrier_id = cathay_pacific_id;

  -- AAdvantage -> Finnair (NA-EU): no surcharges
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 120,
         fees_note = 'US + Finnish gov''t taxes. No fuel surcharges via Finnair.'
   where currency_program_id = aa_id and operating_carrier_id = finnair_op_id;

  -- AAdvantage -> Iberia (NA-EU): no surcharges
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 120,
         fees_note = 'US + Spanish gov''t taxes. No fuel surcharges via Iberia.'
   where currency_program_id = aa_id and operating_carrier_id = iberia_op_id;

  -- AAdvantage -> JAL (NA-Asia 1): low fuel + taxes
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 130,
         fees_note = 'US + Japan gov''t taxes. Low fuel surcharge in J/F.'
   where currency_program_id = aa_id and operating_carrier_id = japan_airlines_id;

  -- AAdvantage -> Malaysia (NA-Asia 2): low
  update partner_redemptions
     set cash_fee_low = 30, cash_fee_high = 100,
         fees_note = 'Gov''t taxes. Low fuel surcharges via Malaysia.'
   where currency_program_id = aa_id and operating_carrier_id = malaysia_id;

  -- AAdvantage -> Qantas (NA-Pacific): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 200,
         fees_note = 'US + Australian gov''t taxes. Qantas surcharges modest.'
   where currency_program_id = aa_id and operating_carrier_id = qantas_op_id;

  -- AAdvantage -> Qatar (NA-ME/India): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 150,
         fees_note = 'US + Qatar departure tax. Qatar surcharges low on award fares.'
   where currency_program_id = aa_id and operating_carrier_id = qatar_airways_id;

  -- AAdvantage -> Royal Air Maroc (NA-Africa): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 150,
         fees_note = 'US + Moroccan gov''t taxes.'
   where currency_program_id = aa_id and operating_carrier_id = royal_air_maroc_id;

  -- AAdvantage -> Royal Jordanian (NA-ME): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 150,
         fees_note = 'US + Jordanian gov''t taxes.'
   where currency_program_id = aa_id and operating_carrier_id = royal_jordanian_id;

  -- AAdvantage -> SriLankan (NA-Asia 2): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 150,
         fees_note = 'US + transit gov''t taxes.'
   where currency_program_id = aa_id and operating_carrier_id = srilankan_op_id;

  -- AAdvantage -> Aer Lingus (NA-EU): no fuel surcharges
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 120,
         fees_note = 'US + Irish gov''t taxes. No fuel surcharges via Dublin.'
   where currency_program_id = aa_id and operating_carrier_id = aer_lingus_op_id;

  -- AAdvantage -> Etihad (NA-ME/India): low to moderate
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 250,
         fees_note = 'US + UAE departure taxes. Etihad fuel surcharges modest in J/F.'
   where currency_program_id = aa_id and operating_carrier_id = etihad_op_id;

  -- AAdvantage -> Fiji (NA-Pacific): low
  update partner_redemptions
     set cash_fee_low = 50, cash_fee_high = 200,
         fees_note = 'US + Fijian gov''t taxes.'
   where currency_program_id = aa_id and operating_carrier_id = fiji_id;
end $$;
