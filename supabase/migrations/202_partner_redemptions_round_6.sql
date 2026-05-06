-- partner_redemptions backfill: round-6 batch (10 programs).
-- Each row links a currency program (the one whose miles you would spend) to an
-- operating carrier (the airline you would actually fly), with current point
-- cost ranges, cabin, and key flags.
--
-- Round 6 programs:
--   thai, asiana, air-china, royal-jordanian, saudia,
--   finnair, tap, china-airlines, vietnam-airlines, garuda-indonesia
--
-- Pricing data sourced from each program's published partner award chart
-- where available. Where a program uses dynamic pricing or has limited
-- public visibility, only saver-band ranges are recorded with confidence
-- MED and notes flagging the constraint.

-- =====================================================================
-- THAI Royal Orchid Plus (Star Alliance; BKK hub; YQ-heavy on own metal)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'thai'), (select id from programs where slug = 'thai'),
  'Economy', 'Intra-Thailand domestic one-way', 7500, 12500, 'fixed',
  'Own-metal short-haul within Thailand; low YQ on domestic.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'thai'),
  'Business', 'BKK to intra-Asia (HKG/SIN/NRT) round-trip', 50000, 65000, 'fixed',
  'Own-metal regional business; high YQ co-pay typical on Thai metal.',
  'MED', current_date, true, 'high', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'thai'),
  'Business', 'BKK to Europe round-trip', 90000, 120000, 'dynamic',
  'Own-metal long-haul business; high YQ co-pay; peak/off-peak variation.',
  'MED', current_date, true, 'high', true, 'online', 'asia_1', 'europe'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'ana'),
  'Business', 'US to Asia via ANA partner award', 75000, 95000, 'fixed',
  'ANA partner via Star; low YQ pass-through. Verify partner chart cell at booking.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award', 100000, 120000, 'fixed',
  'United partner via Star; no YQ. Online partner booking limited; phone booking standard.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'swiss'),
  'Business', 'US to Europe via Swiss partner award', 100000, 130000, 'fixed',
  'Swiss partner via Star; YQ pass-through varies by routing. Verify before booking.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'eva-air'),
  'Business', 'US to Asia via EVA Air partner award', 80000, 100000, 'fixed',
  'EVA partner via Star; saver bands. Phone booking standard for partners.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'thai'), (select id from programs where slug = 'singapore-airlines'),
  'Economy', 'Intra-SE Asia via Singapore Airlines partner award', 15000, 25000, 'fixed',
  'SQ partner via Star; low YQ; saver inventory tight. Phone booking standard.',
  'MED', current_date, true, 'low', false, 'phone', 'asia_1', 'asia_1');

-- =====================================================================
-- ASIANA Club (Star Alliance; sunsetting Jan 1 2027 into Korean SKYPASS)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'asiana'),
  'Business', 'JFK to ICN one-way (off-peak)', 80000, 80000, 'fixed',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. Off-peak own metal.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'asiana'),
  'Business', 'JFK to ICN one-way (peak)', 100000, 100000, 'hybrid',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. Peak own metal.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'asiana'),
  'First', 'JFK to ICN one-way', 120000, 150000, 'hybrid',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. First product/lounge availability limited; verify at booking.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'ana'),
  'Business', 'US to Tokyo via ANA partner award', 90000, 105000, 'fixed',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. ANA partner via Star.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award round-trip', 100000, 110000, 'fixed',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. United partner via Star; no YQ.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa partner award one-way', 100000, 115000, 'fixed',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. LH partner; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'asiana'), (select id from programs where slug = 'singapore-airlines'),
  'Economy', 'Intra-SE Asia via Singapore Airlines partner award', 15000, 25000, 'fixed',
  'Asiana Club sunsets Jan 1, 2027 - Korean SKYPASS will absorb at 1:1 flight / 1:0.82 partner conversion. SQ partner via Star.',
  'MED', current_date, true, 'low', false, 'phone', 'asia_1', 'asia_1');

-- =====================================================================
-- AIR CHINA PhoenixMiles (Star Alliance; currency in km not miles)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'air-china'),
  'Economy', 'Domestic China round-trip', 15000, 25000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. Own-metal domestic.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'air-china'),
  'Economy', 'US to China round-trip', 100000, 100000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. Own-metal long-haul economy; low YQ on Air China metal.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'air-china'),
  'Business', 'US to China round-trip', 200000, 200000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. Own-metal long-haul business.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award', 130000, 150000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. United partner via Star.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa partner award', 130000, 160000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. LH partner; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'ana'),
  'Business', 'US to Tokyo via ANA partner award', 110000, 130000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. ANA partner via Star.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'eva-air'),
  'Business', 'Intra-Asia via EVA Air partner award', 80000, 100000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. EVA partner via Star.',
  'MED', current_date, true, 'high', false, 'phone', 'asia_1', 'asia_1'),
((select id from programs where slug = 'air-china'), (select id from programs where slug = 'singapore-airlines'),
  'Economy', 'Intra-SE Asia via Singapore Airlines partner award', 25000, 40000, 'fixed',
  'Currency is kilometers (not miles); ~30% inherent value loss vs mile-denominated programs at equivalent distances. SQ partner via Star.',
  'MED', current_date, true, 'high', false, 'phone', 'asia_1', 'asia_1');

-- =====================================================================
-- ROYAL JORDANIAN Royal Club (oneworld; AMM hub)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'royal-jordanian'), (select id from programs where slug = 'royal-jordanian'),
  'Economy', 'AMM to USA one-way (AMM-ORD nonstop)', 45000, 65000, 'dynamic',
  'RJ status-match path more valuable than redemptions; consider booking RJ metal via BA Avios or Atmos instead. Only AMM-ORD nonstop to USA.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'royal-jordanian'), (select id from programs where slug = 'royal-jordanian'),
  'Business', 'AMM to USA one-way (AMM-ORD nonstop)', 90000, 130000, 'dynamic',
  'RJ status-match path more valuable than redemptions; consider booking RJ metal via BA Avios or Atmos instead. High YQ co-pay typical.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'royal-jordanian'), (select id from programs where slug = 'aa'),
  'Business', 'US to Europe via American partner award (oneworld)', 100000, 120000, 'fixed',
  'RJ status-match path more valuable than redemptions; consider booking RJ metal via BA Avios or Atmos instead. AA partner via oneworld.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'royal-jordanian'), (select id from programs where slug = 'qatar'),
  'Business', 'AMM-DOH-Asia via Qatar partner award (oneworld)', 110000, 140000, 'fixed',
  'RJ status-match path more valuable than redemptions; consider booking RJ metal via BA Avios or Atmos instead. Qatar partner via oneworld; high YQ.',
  'MED', current_date, true, 'high', false, 'phone', 'middle_east', 'asia_1'),
((select id from programs where slug = 'royal-jordanian'), (select id from programs where slug = 'iberia'),
  'Business', 'JFK to LHR via BA partner award (oneworld)', 100000, 120000, 'fixed',
  'RJ status-match path more valuable than redemptions; consider booking RJ metal via BA Avios or Atmos instead. BA partner via oneworld; high YQ on transatlantic.',
  'LOW', current_date, true, 'high', false, 'phone', 'north_america', 'europe');

-- =====================================================================
-- SAUDIA Alfursan (SkyTeam; JED hub; alcohol-free carrier)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'saudia'),
  'Economy', 'Intra-Saudi domestic one-way', 7500, 12500, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. Own-metal domestic.',
  'MED', current_date, true, 'low', true, 'online', 'middle_east', 'middle_east'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'saudia'),
  'Business', 'JED to USA one-way', 90000, 130000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. Own-metal long-haul business.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'saudia'),
  'First', 'JED to JFK one-way', 120000, 160000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. Own-metal first; historically priced lower than competitors but verify 2026 chart.',
  'LOW', current_date, true, 'high', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'delta'),
  'Business', 'US to Europe via Delta partner award (SkyTeam)', 100000, 130000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. Delta partner via SkyTeam.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'klm'),
  'Business', 'US to Europe via KLM partner award (SkyTeam)', 100000, 130000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. KLM partner via SkyTeam; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'air-france'),
  'Business', 'US to Europe via Air France partner award (SkyTeam)', 100000, 130000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. AF partner via SkyTeam; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'saudia'), (select id from programs where slug = 'korean-air'),
  'Business', 'US to Asia via Korean Air partner award (SkyTeam)', 90000, 130000, 'fixed',
  'Saudia is alcohol-free; consider for travelers preferring this. Korean partner via SkyTeam; peak/off-peak variation.',
  'MED', current_date, true, 'high', false, 'mixed', 'north_america', 'asia_1');

-- =====================================================================
-- FINNAIR Finnair Plus (oneworld; HEL hub; Avios currency)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'finnair'),
  'Economy', 'Intra-Europe one-way', 6500, 6500, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). Own-metal short-haul.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'finnair'),
  'Business', 'HEL to USA one-way', 62500, 62500, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). HEADLINE SWEET SPOT - HEL-USA business at 62,500 Avios one-way.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'north_america'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'finnair'),
  'Business', 'HEL to Asia one-way', 70000, 90000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). Own-metal long-haul business to Asia.',
  'MED', current_date, true, 'low', true, 'online', 'europe', 'asia_1'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'aa'),
  'Economy', 'US domestic one-way via American (oneworld)', 7500, 15000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). AA partner via oneworld; no YQ on AA metal.',
  'HIGH', current_date, true, 'low', true, 'online', 'north_america', 'north_america'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'aa'),
  'Business', 'US to Europe via American partner award one-way (oneworld)', 57500, 70000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). AA partner via oneworld.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'qatar'),
  'Business', 'US to DOH to Asia via Qatar partner award (oneworld)', 75000, 95000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). Qatar partner via oneworld; high YQ pass-through.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'jal'),
  'Business', 'US to Asia via JAL partner award (oneworld)', 60000, 75000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). JAL partner via oneworld; low YQ.',
  'HIGH', current_date, true, 'low', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'finnair'), (select id from programs where slug = 'iberia'),
  'Business', 'US to Madrid via Iberia partner award one-way (oneworld)', 34000, 50000, 'fixed',
  'Finnair Plus uses Avios; Combine My Avios with BA/Iberia/Aer Lingus/Vueling/Qatar (free, instant). Iberia partner via oneworld; off-peak/peak variation.',
  'HIGH', current_date, true, 'high', true, 'online', 'north_america', 'europe');

-- =====================================================================
-- TAP Miles&Go (Star Alliance; LIS hub; dynamic shift on own metal post-2024)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'tap'), (select id from programs where slug = 'tap'),
  'Business', 'US East Coast to LIS one-way', 63000, 95000, 'dynamic',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. Post-2024 dynamic shift on own metal; saver bands variable.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'tap'),
  'Business', 'Intra-Europe one-way', 25000, 50000, 'dynamic',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. Dynamic intra-Europe.',
  'MED', current_date, true, 'high', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'ana'),
  'Business', 'Intra-Asia via ANA partner award one-way', 50000, 50000, 'fixed',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. ANA partner via Star; low YQ.',
  'MED', current_date, true, 'low', false, 'phone', 'asia_1', 'asia_1'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award', 100000, 120000, 'fixed',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. United partner via Star; no YQ.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa partner award one-way', 100000, 130000, 'fixed',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. LH partner; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'swiss'),
  'Business', 'US to Europe via Swiss partner award', 100000, 130000, 'fixed',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. Swiss partner via Star; YQ pass-through varies.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'tap'), (select id from programs where slug = 'singapore-airlines'),
  'Economy', 'Intra-SE Asia via Singapore Airlines partner award', 15000, 25000, 'fixed',
  'TAP Stopover - free Lisbon stopover possible; A321LR US East Coast lie-flat narrowbody. SQ partner via Star.',
  'MED', current_date, true, 'low', false, 'phone', 'asia_1', 'asia_1');

-- =====================================================================
-- CHINA AIRLINES Dynasty Flyer (SkyTeam; TPE hub; Taiwan)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'china-airlines'),
  'Economy', 'US to TPE one-way', 35000, 45000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). Own-metal long-haul economy.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'china-airlines'),
  'Business', 'US to TPE one-way', 75000, 90000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). Own-metal long-haul business.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'china-airlines'),
  'Economy', 'Intra-Asia from TPE one-way', 12500, 25000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). Own-metal regional economy.',
  'MED', current_date, true, 'high', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'delta'),
  'Business', 'US to Europe via Delta partner award (SkyTeam)', 100000, 130000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). Delta partner via SkyTeam.',
  'MED', current_date, true, 'low', false, 'mixed', 'north_america', 'europe'),
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'klm'),
  'Business', 'US to Europe via KLM partner award (SkyTeam)', 100000, 130000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). KLM partner via SkyTeam; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'china-airlines'), (select id from programs where slug = 'korean-air'),
  'Business', 'US to Asia via Korean Air partner award (SkyTeam)', 90000, 130000, 'fixed',
  'China Airlines (Taiwan) is DIFFERENT from Air China (PRC). Korean partner via SkyTeam; peak/off-peak variation.',
  'MED', current_date, true, 'high', false, 'mixed', 'north_america', 'asia_1');

-- =====================================================================
-- VIETNAM AIRLINES Lotusmiles (SkyTeam; SGN hub)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'vietnam-airlines'),
  'Economy', 'Intra-Vietnam domestic one-way', 7500, 12500, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. Own-metal domestic.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'vietnam-airlines'),
  'Business', 'SGN to intra-Asia (Tokyo, Bangkok) round-trip', 60000, 90000, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. Own-metal regional business.',
  'MED', current_date, true, 'high', false, 'phone', 'asia_1', 'asia_1'),
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'vietnam-airlines'),
  'Business', 'SGN to Europe round-trip', 130000, 180000, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. Own-metal long-haul business.',
  'MED', current_date, true, 'high', false, 'phone', 'asia_1', 'europe'),
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'delta'),
  'Business', 'US to Europe via Delta partner award (SkyTeam)', 110000, 140000, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. Delta partner via SkyTeam.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'klm'),
  'Business', 'US to Europe via KLM partner award (SkyTeam)', 110000, 140000, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. KLM partner via SkyTeam; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'vietnam-airlines'), (select id from programs where slug = 'korean-air'),
  'Business', 'US to Asia via Korean Air partner award (SkyTeam)', 100000, 140000, 'fixed',
  'Lotusmiles status match (paid $129-359) more valuable than redemptions for US travelers. Korean partner via SkyTeam; peak/off-peak variation.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'asia_1');

-- =====================================================================
-- GARUDA INDONESIA GarudaMiles (SkyTeam; CGK hub; April 2026 chart in effect)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'garuda-indonesia'),
  'Economy', 'Intra-Indonesia domestic one-way', 7500, 15000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Own-metal domestic.',
  'MED', current_date, true, 'low', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'garuda-indonesia'),
  'Business', 'CGK to intra-Asia (Tokyo, Sydney) round-trip', 90000, 130000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Own-metal regional business.',
  'MED', current_date, true, 'high', true, 'online', 'asia_1', 'south_pacific'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'garuda-indonesia'),
  'Business', 'CGK to Europe via stopover round-trip', 160000, 220000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Garuda no longer flies CGK-AMS direct; routing via stopover required.',
  'MED', current_date, true, 'high', true, 'online', 'asia_1', 'europe'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'garuda-indonesia'),
  'First', 'DPS to Tokyo one-way', 110000, 150000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Limited inventory - 1 active 777; verify availability before transferring miles.',
  'LOW', current_date, true, 'high', false, 'phone', 'asia_1', 'asia_1'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'delta'),
  'Business', 'US to Europe via Delta partner award (SkyTeam)', 110000, 140000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Delta partner via SkyTeam.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'korean-air'),
  'Business', 'US to Asia via Korean Air partner award (SkyTeam)', 100000, 140000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. Korean partner via SkyTeam.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'garuda-indonesia'), (select id from programs where slug = 'klm'),
  'Business', 'US to Europe via KLM partner award (SkyTeam)', 110000, 140000, 'fixed',
  'April 2026 chart in effect (post-Q1 temporary devaluation reversion). GarudaMiles releases more own-metal awards to its members than to partners. KLM partner via SkyTeam; high YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe');
