-- 082_fix_avios_band56_fees.sql
-- Migration 081 used SQL LIKE patterns with regex-style character classes
-- ([1-4], [5-6]) which LIKE treats literally, not as ranges. Bands 1-4 got
-- updated by accident on some queries (the substring still matched), but the
-- transatlantic bands (5-6) on BA Avios + Iberia + Aer Lingus + Qatar Avios
-- ended up with NULL cash fees AND the wrong 'high' fuel_surcharges flag.
--
-- Fix: split into per-band UPDATEs using plain LIKE.

do $$
declare
  aa_id          uuid;
  ba_avios_id    uuid;
  iberia_id      uuid;
  aer_lingus_id  uuid;
  qatar_id       uuid;
begin
  select id into aa_id          from programs where slug = 'aa';
  select id into ba_avios_id    from programs where slug = 'ba_avios';
  select id into iberia_id      from programs where slug = 'iberia';
  select id into aer_lingus_id  from programs where slug = 'aer_lingus';
  select id into qatar_id       from programs where slug = 'qatar';

  -- Bands 1-4 cleanup (catch any rows 081 missed due to LIKE pattern)
  update partner_redemptions
     set cash_fee_low = 6, cash_fee_high = 6,
         fees_note = '$5.60 US 9/11 fee. Avios on AA-operated = no fuel surcharges.'
   where operating_carrier_id = aa_id
     and currency_program_id in (ba_avios_id, iberia_id, aer_lingus_id, qatar_id)
     and (
       region_or_route like '%distance band 1%' or
       region_or_route like '%distance band 2%' or
       region_or_route like '%distance band 3%' or
       region_or_route like '%distance band 4%'
     )
     and cash_fee_low is null;

  -- Bands 5 and 6 (transatlantic): no surcharges on AA metal, taxes only
  update partner_redemptions
     set fuel_surcharges = 'none',
         cash_fee_low = 50, cash_fee_high = 100,
         fees_note = 'US + EU gov''t taxes. Avios on AA-operated transatlantic = no fuel surcharges.'
   where operating_carrier_id = aa_id
     and currency_program_id in (ba_avios_id, iberia_id, aer_lingus_id, qatar_id)
     and (
       region_or_route like '%distance band 5%' or
       region_or_route like '%distance band 6%'
     );
end $$;
