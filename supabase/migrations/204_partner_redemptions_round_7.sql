-- partner_redemptions backfill: round-7 batch (10 programs).
-- Each row links a currency program (the one whose miles you would spend) to an
-- operating carrier (the airline you would actually fly), with current point
-- cost ranges, cabin, and key flags.
--
-- Round 7 programs:
--   iberia, aer-lingus, air-india, royal-air-maroc, ethiopian,
--   south-african-airways, egyptair, aerolineas-argentinas, azul, volaris
--
-- Pricing data sourced from each program's published partner award chart
-- where available. Where a program uses dynamic pricing or has limited
-- public visibility, only saver-band ranges are recorded with confidence
-- MED and notes flagging the constraint.
--
-- Volaris v.club is NOT a points program (paid discount club); single
-- placeholder row for cross-program-consistency only.

-- =====================================================================
-- IBERIA Plus / Club Iberia Plus (oneworld; YQ-light Avios program)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Business', 'MAD to US East / ORD one-way (off-peak)', 40500, 40500, 'fixed',
  'Own-metal long-haul business off-peak. Iberia charges materially less YQ than BA on identical metal.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'north_america'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Business', 'MAD to US East / ORD one-way (peak)', 59000, 59000, 'fixed',
  'Own-metal long-haul business peak. Post-2025 devaluation pricing.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'north_america'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Economy', 'MAD to US one-way (off-peak)', 20000, 30000, 'fixed',
  'Own-metal long-haul economy off-peak. Cash co-pay relatively modest.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'north_america'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Economy', 'Intra-Europe short-haul one-way (off-peak)', 5000, 8000, 'fixed',
  'The cheapest Avios redemption in the IAG family. Off-peak only.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Business', 'MAD to South America one-way (off-peak)', 40500, 50000, 'fixed',
  'One-stop access to GRU/EZE/SCL/LIM via MAD on Iberia metal. Strong sweet spot.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'south_america_1'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'aa'),
  'Business', 'US to MAD via American partner award one-way', 50000, 70000, 'fixed',
  'AA partner via oneworld AJB. Higher than Iberia metal but useful when AA has space.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'ba-avios'),
  'Business', 'US to LHR via BA partner award one-way', 57500, 75000, 'fixed',
  'BA partner via Combine My Avios pool. BA charges high YQ; book through Iberia for lower YQ if metal is Iberia.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'finnair'),
  'Business', 'US to HEL via Finnair partner award one-way', 50000, 65000, 'fixed',
  'Finnair partner via Combine My Avios. Finnair A350 product is competitive.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'qatar'),
  'Business', 'US to DOH via Qatar partner award one-way', 70000, 85000, 'fixed',
  'Qatar partner via Combine My Avios. Qsuite available; YQ pass-through verifies per route.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'middle_east'),
((select id from programs where slug = 'iberia'), (select id from programs where slug = 'iberia'),
  'Business', 'MAD to South America one-way (peak)', 55000, 70000, 'fixed',
  'Own-metal South America business peak. Verify peak/off-peak edges before booking.',
  'MED', current_date, true, 'low', true, 'online', 'europe', 'south_america_1');

-- =====================================================================
-- AER LINGUS AerClub (non-aligned; Atlantic Joint Business)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'aer-lingus'),
  'Economy', 'BOS / JFK / EWR-DUB one-way (off-peak)', 13000, 16500, 'fixed',
  'Own-metal transatlantic economy off-peak. The headline US sweet spot. US Preclearance at DUB.',
  'HIGH', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'aer-lingus'),
  'Business', 'BOS / JFK / EWR-DUB one-way (off-peak)', 50000, 62750, 'fixed',
  'Own-metal transatlantic business off-peak. Lower YQ than BA, more than Iberia.',
  'HIGH', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'aer-lingus'),
  'Economy', 'Intra-Europe short-haul one-way (off-peak)', 4000, 7000, 'fixed',
  '6-zone distance-based chart short-haul economy. Useful for connections out of DUB.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'aer-lingus'),
  'Business', 'Long-haul transatlantic one-way (peak)', 70000, 75000, 'fixed',
  'Own-metal long-haul business peak. A321XLR enabling thinner US-Europe routes.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'aa'),
  'Business', 'US-LHR / DUB via American partner award one-way', 57500, 75000, 'fixed',
  'AA partner via AJB. AAdvantage award space sometimes opens when Aer Lingus does not.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'ba-avios'),
  'Business', 'US-LHR via BA partner award one-way', 57500, 75000, 'fixed',
  'BA partner via Combine My Avios pool. BA charges high YQ; redirect to Aer Lingus or Iberia metal when possible.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'finnair'),
  'Business', 'US-HEL via Finnair partner award one-way', 50000, 65000, 'fixed',
  'Finnair partner via Combine My Avios. AJB tier-credit reciprocity applies.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'aer-lingus'), (select id from programs where slug = 'iberia'),
  'Business', 'US-MAD via Iberia partner award one-way', 40500, 59000, 'fixed',
  'Iberia partner via Combine My Avios. Lowest YQ option in IAG family for transatlantic biz.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe');

-- =====================================================================
-- AIR INDIA Maharaja Club (Star Alliance; April 2026 chart cut economy 60%)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'air-india'),
  'Economy', 'Domestic India Air India one-way', 1500, 5000, 'fixed',
  'Post-April-2026 chart. Cheap intra-India one-offs.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_2', 'asia_2'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'air-india'),
  'Economy', 'DEL to BKK / SIN / KUL / DPS one-way', 12000, 12000, 'fixed',
  'Post-April-2026 12-city flat-rate sweet spot. The headline 2026 redemption.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_2', 'asia_1'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'air-india'),
  'Economy', 'DEL to DXB / DOH / RUH / JED one-way', 12000, 12000, 'fixed',
  'Post-April-2026 12-city flat-rate sweet spot extends to Gulf cities.',
  'HIGH', current_date, true, 'low', true, 'online', 'asia_2', 'middle_east'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'air-india'),
  'Economy', 'DEL-NBO one-way', 12000, 12000, 'fixed',
  'Post-April-2026 12-city flat-rate extends to Nairobi.',
  'MED', current_date, true, 'low', true, 'online', 'asia_2', 'sub_saharan_africa'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'united'),
  'Economy', 'US domestic short-haul via United partner award one-way', 3500, 7500, 'fixed',
  'United partner via Star. Per AwardWallet research; verify post-2026 chart.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'north_america'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'air-india'),
  'Business', 'US-India Air India metal one-way', 80000, 110000, 'hybrid',
  'Own-metal long-haul business. Verify post-April-2026 chart - the chart cut economy not business.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'asia_2'),
((select id from programs where slug = 'air-india'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US-Europe via Lufthansa partner award one-way', 75000, 95000, 'fixed',
  'LH partner via Star. YQ pass-through high. Phone booking standard.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe');

-- =====================================================================
-- ROYAL AIR MAROC Safar Flyer (oneworld; status-match-driven)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'royal-air-maroc'), (select id from programs where slug = 'royal-air-maroc'),
  'Economy', 'US (JFK/IAD/MIA/ORD)-CMN one-way', 45000, 55000, 'fixed',
  'Own-metal transatlantic economy. Verify on royalairmaroc.com - online award flow limited.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'sub_saharan_africa'),
((select id from programs where slug = 'royal-air-maroc'), (select id from programs where slug = 'royal-air-maroc'),
  'Business', 'US-CMN one-way on RAM 787', 80000, 100000, 'fixed',
  'Own-metal long-haul business on RAM 787. Heavy YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'sub_saharan_africa'),
((select id from programs where slug = 'royal-air-maroc'), (select id from programs where slug = 'royal-air-maroc'),
  'Economy', 'Domestic Morocco one-way', 4750, 7500, 'fixed',
  'Own-metal domestic. Cheap one-offs within Morocco.',
  'HIGH', current_date, true, 'low', true, 'online', 'sub_saharan_africa', 'sub_saharan_africa'),
((select id from programs where slug = 'royal-air-maroc'), (select id from programs where slug = 'aa'),
  'Business', 'US-Europe / Africa via American partner award one-way', 57500, 75000, 'fixed',
  'AA partner via oneworld. Useful when RAM own-metal availability thin.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'royal-air-maroc'), (select id from programs where slug = 'royal-air-maroc'),
  'Economy', 'Intra-Africa via CMN one-way', 15000, 25000, 'fixed',
  'Own-metal intra-Africa connection through CMN.',
  'MED', current_date, true, 'low', false, 'phone', 'sub_saharan_africa', 'sub_saharan_africa');

-- =====================================================================
-- ETHIOPIAN ShebaMiles (Star Alliance; Marriott bridge LAUNCHED Mar 2026)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'ethiopian'),
  'Business', 'US (IAD/EWR/ORD)-ADD one-way', 80000, 90000, 'fixed',
  'Own-metal long-haul business. Marriott Bonvoy 3:1 + 5K bonus per 60K transferred is the new 2026 US bridge.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'sub_saharan_africa'),
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'ethiopian'),
  'Economy', 'US-ADD one-way', 50000, 65000, 'fixed',
  'Own-metal long-haul economy. YQ pass-through material.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'sub_saharan_africa'),
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'ethiopian'),
  'Economy', 'Intra-Africa Ethiopian one-way', 15000, 25000, 'fixed',
  'Own-metal intra-Africa. Ethiopian network across 80+ African destinations.',
  'HIGH', current_date, true, 'low', true, 'online', 'sub_saharan_africa', 'sub_saharan_africa'),
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award one-way', 80000, 95000, 'fixed',
  'United partner via Star. No YQ on UA metal. Phone booking standard for partners.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa partner award one-way', 80000, 100000, 'fixed',
  'LH partner via Star. High YQ pass-through. Verify before booking.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'ethiopian'), (select id from programs where slug = 'thai'),
  'Business', 'Intra-Asia via Thai partner award one-way', 25000, 40000, 'fixed',
  'Thai partner via Star. Saver inventory tight; YQ pass-through on Thai metal.',
  'MED', current_date, true, 'high', false, 'phone', 'asia_1', 'asia_1');

-- =====================================================================
-- SOUTH AFRICAN AIRWAYS Voyager (Star Alliance; operationally fragile)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'south-african-airways'), (select id from programs where slug = 'south-african-airways'),
  'Economy', 'Domestic South Africa one-way', 7500, 12500, 'fixed',
  'Own-metal domestic. Reduced fleet limits availability post-business-rescue.',
  'MED', current_date, true, 'low', true, 'online', 'sub_saharan_africa', 'sub_saharan_africa'),
((select id from programs where slug = 'south-african-airways'), (select id from programs where slug = 'south-african-airways'),
  'Economy', 'Intra-Africa SAA one-way', 12500, 25000, 'fixed',
  'Own-metal intra-Africa. Verify availability - reduced fleet.',
  'MED', current_date, true, 'low', true, 'online', 'sub_saharan_africa', 'sub_saharan_africa'),
((select id from programs where slug = 'south-african-airways'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award one-way', 80000, 110000, 'fixed',
  'United partner via Star. Voyager was historically YQ-light for partner Star redemptions.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'south-african-airways'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa partner award one-way', 80000, 110000, 'fixed',
  'LH partner via Star. Verify YQ pass-through with Voyager.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe');

-- =====================================================================
-- EGYPTAIR Plus (Star Alliance; Family Account pooling for cheap Star Gold)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'egyptair'), (select id from programs where slug = 'egyptair'),
  'Business', 'US (JFK/IAD)-CAI on EgyptAir 787-9 one-way', 75000, 100000, 'fixed',
  'Own-metal long-haul business. Verify on egyptairplus.com calculator. YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'middle_east'),
((select id from programs where slug = 'egyptair'), (select id from programs where slug = 'egyptair'),
  'Economy', 'US-CAI one-way', 50000, 65000, 'fixed',
  'Own-metal long-haul economy. Calculator-driven on egyptairplus.com.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'middle_east'),
((select id from programs where slug = 'egyptair'), (select id from programs where slug = 'egyptair'),
  'Economy', 'CAI-Africa intra-region one-way', 15000, 25000, 'fixed',
  'Own-metal intra-Africa from CAI. Cheap regional awards.',
  'MED', current_date, true, 'low', false, 'phone', 'middle_east', 'sub_saharan_africa'),
((select id from programs where slug = 'egyptair'), (select id from programs where slug = 'egyptair'),
  'Economy', 'CAI-Middle East intra-region one-way', 12500, 20000, 'fixed',
  'Own-metal intra-Middle East. Useful for Levant connections.',
  'MED', current_date, true, 'low', false, 'phone', 'middle_east', 'middle_east'),
((select id from programs where slug = 'egyptair'), (select id from programs where slug = 'united'),
  'Business', 'US to Europe via United partner award one-way', 80000, 100000, 'fixed',
  'United partner via Star. No YQ on UA metal. Phone booking standard.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'europe');

-- =====================================================================
-- AEROLINEAS ARGENTINAS Plus (SkyTeam; partner chart calculator-only)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'aerolineas-argentinas'),
  'Business', 'BUE-Madrid one-way', 70000, 70000, 'fixed',
  'Own-metal long-haul business. Strong sweet spot vs Flying Blue or Delta from Europe.',
  'HIGH', current_date, true, 'low', true, 'online', 'south_america_1', 'europe'),
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'aerolineas-argentinas'),
  'Economy', 'Argentina-US round-trip', 40000, 50000, 'fixed',
  'Own-metal mid-haul economy round-trip. Solid value.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'north_america'),
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'delta'),
  'Business', 'AR-US via Delta partner award one-way', 90000, 110000, 'fixed',
  'Delta partner via SkyTeam. Calculator-only on aerolineas.com - verify pricing.',
  'MED', current_date, true, 'none', false, 'phone', 'south_america_1', 'north_america'),
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'aerolineas-argentinas'),
  'Economy', 'Domestic Argentina round-trip', 8000, 15000, 'fixed',
  'Own-metal domestic. Cheap entry point for Patagonia / wine country / Iguazu.',
  'HIGH', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'air-france'),
  'Business', 'US-Europe via Air France partner award one-way', 90000, 110000, 'fixed',
  'AF partner via SkyTeam. Calculator-only - verify pricing.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'aerolineas-argentinas'), (select id from programs where slug = 'aerolineas-argentinas'),
  'Economy', 'Intra-South America one-way', 12500, 20000, 'fixed',
  'Own-metal intra-region. Codeshares with GOL / LATAM expand network.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1');

-- =====================================================================
-- AZUL Fidelidade (non-aligned; dynamic on own metal; Etihad bilateral)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'azul'), (select id from programs where slug = 'azul'),
  'Economy', 'Domestic Brazil Azul one-way', 3000, 15000, 'dynamic',
  'Own-metal dynamic pricing. Heavily promo''d on the Azul website. Verify before redeeming.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'azul'), (select id from programs where slug = 'etihad'),
  'Economy', 'Etihad redemption on Azul one-way', 6000, 12000, 'fixed',
  'Etihad bilateral partner - Etihad redeems on Azul from 6,000 miles. Verify route eligibility.',
  'MED', current_date, true, 'low', false, 'phone', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'azul'), (select id from programs where slug = 'united'),
  'Economy', 'Azul Pelo Mundo via United one-way', 25000, 50000, 'dynamic',
  'United via Azul Pelo Mundo partner network. Star Alliance connecting partner since 2020.',
  'LOW', current_date, true, 'none', false, 'phone', 'south_america_1', 'north_america'),
((select id from programs where slug = 'azul'), (select id from programs where slug = 'copa'),
  'Economy', 'Azul Pelo Mundo via Copa one-way', 25000, 50000, 'dynamic',
  'Copa ConnectMiles via Azul Pelo Mundo partner network.',
  'LOW', current_date, true, 'low', false, 'phone', 'south_america_1', 'central_america'),
((select id from programs where slug = 'azul'), (select id from programs where slug = 'tap'),
  'Economy', 'Azul Pelo Mundo via TAP one-way', 30000, 60000, 'dynamic',
  'TAP Miles&Go via Azul Pelo Mundo partner network. Brazil-Lisbon corridor.',
  'LOW', current_date, true, 'high', false, 'phone', 'south_america_1', 'europe');

-- =====================================================================
-- VOLARIS v.club (paid discount club - NOT a points program)
-- =====================================================================
-- Volaris v.club is not a points program; placeholder for cross-checks
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'volaris'),
  (select id from programs where slug = 'volaris'),
  'Economy', 'v.club paid subscription model - no points redemption',
  null, null, 'dynamic',
  'Volaris v.club is a paid annual discount-club ($29.99 individual / $49.99 duo / $149.99 friends-family). No miles, no award chart, no transfer partners. Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'none', false, 'online'
);
