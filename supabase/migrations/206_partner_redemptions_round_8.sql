-- partner_redemptions backfill: round-8 batch (10 programs).
-- Each row links a currency program (the one whose miles you would spend) to an
-- operating carrier (the airline you would actually fly), with current point
-- cost ranges, cabin, and key flags.
--
-- Round 8 programs:
--   copa, fiji-airways, vueling, air-astana, cebu-pacific,
--   philippine-airlines, el-al, flydubai, vivaaerobus, pegasus
--
-- Pricing data sourced from each program's published chart where available.
-- Where a program uses dynamic pricing or has limited public visibility,
-- only saver-band ranges are recorded with confidence MED and notes flagging
-- the constraint.
--
-- Tabua Club (paid subscription) and VivaFan (paid discount club) are NOT
-- points programs; placeholder rows note this for cross-program-consistency.

-- =====================================================================
-- COPA ConnectMiles (Star Alliance; published partner chart in 2026)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'copa'), (select id from programs where slug = 'copa'),
  'Economy', 'US-Panama round-trip on Copa metal', 30000, 30000, 'dynamic',
  'Copa-operated metal moved to dynamic pricing post-2025. 30K RT is the typical saver level - verify on copaair.com.',
  'HIGH', current_date, true, 'none', true, 'online', 'north_america', 'central_america'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'copa'),
  'Business', 'US-South America one-way on Copa metal', 50000, 50000, 'dynamic',
  'Copa-operated dynamic. Recliner business product on most aircraft - not lie-flat. Verify post-Jan-2025 chart.',
  'MED', current_date, true, 'none', true, 'online', 'north_america', 'south_america_1'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'copa'),
  'Economy', 'Panama-Caribbean one-way on Copa metal', 20000, 20000, 'dynamic',
  'Post-Jan-2025 partner-chart devaluation raised this from approximately 10K to 20K.',
  'MED', current_date, true, 'none', true, 'online', 'central_america', 'caribbean'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'united'),
  'Economy', 'US domestic short-haul via United partner award one-way', 12500, 17500, 'fixed',
  'United partner via Star Alliance partner chart. No YQ on UA metal. Phone booking standard for partners.',
  'MED', current_date, true, 'none', false, 'phone', 'north_america', 'north_america'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US-Europe via Lufthansa partner award one-way', 130000, 130000, 'fixed',
  'LH partner via Copa Star Alliance partner chart. YQ pass-through high. Phone booking standard.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'lufthansa'),
  'Economy', 'US-Europe via Lufthansa partner award one-way', 70000, 70000, 'fixed',
  'LH partner via Copa Star partner chart. YQ pass-through.',
  'MED', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'copa'), (select id from programs where slug = 'ana'),
  'Business', 'US-Asia via ANA partner award one-way', 130000, 150000, 'fixed',
  'ANA partner via Copa Star partner chart. Verify post-2025 partner-chart pricing on copaair.com.',
  'LOW', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1');

-- =====================================================================
-- FIJI AIRWAYS Tabua Club (PAID subscription - not a points program)
-- =====================================================================
-- Tabua Club is a paid subscription, not a points currency. Fiji Airways
-- award space is priced via AAdvantage / Atmos / Qantas as of April 1 2025.
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'fiji-airways'),
  (select id from programs where slug = 'fiji-airways'),
  'Economy', 'Tabua Club is a paid subscription - no points redemption (Fiji award space prices via AAdvantage / Atmos / Qantas)',
  null, null, 'dynamic',
  'Tabua Club is a paid annual subscription, not a points currency. Fiji Airways adopted AAdvantage as its FFP engine on April 1 2025. US flyers redeem on Fiji Airways via AAdvantage (LAX-NAN economy ~40K, business ~80K), Atmos Rewards, or Qantas Frequent Flyer (~108K business + low taxes). Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'none', false, 'online'
);

-- =====================================================================
-- VUELING Club (Avios family; Combine My Avios second hop)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'vueling'),
  'Economy', 'Vueling intra-Europe short-haul one-way', 4500, 9000, 'fixed',
  'Vueling metal short-haul economy + ~20 EUR cash co-pay. Solid against Eur 100+ paid fares.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'vueling'),
  'Economy', 'BCN-FCO / BCN-AMS one-way on Vueling metal', 6500, 6500, 'fixed',
  'Vueling metal one-way. Verify peak/off-peak edges before booking.',
  'MED', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'ba-avios'),
  'Business', 'US-LHR via BA partner award one-way (Combine My Avios second hop)', 57500, 75000, 'fixed',
  'No direct US flexible-currency to Vueling. Route Capital One / Citi / Bilt / WF -> BA Avios, then Combine My Avios into Vueling, OR redeem from Vueling Avios on BA metal via Combine My Avios. BA charges high YQ.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'iberia'),
  'Business', 'US-MAD via Iberia partner award one-way (Combine My Avios second hop)', 40500, 59000, 'fixed',
  'Combine My Avios from Vueling into Iberia (or vice versa) for Iberia metal - the YQ-light Avios sweet spot.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'aer-lingus'),
  'Economy', 'BOS / JFK / EWR-DUB one-way (Combine My Avios second hop)', 13000, 16500, 'fixed',
  'Combine My Avios from Vueling into Aer Lingus AerClub for the East Coast-Dublin sweet spot.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'europe'),
((select id from programs where slug = 'vueling'), (select id from programs where slug = 'qatar'),
  'Business', 'US-DOH via Qatar partner award one-way (Combine My Avios second hop)', 70000, 85000, 'fixed',
  'Combine My Avios from Vueling into Qatar for Qsuite. YQ pass-through verifies per route.',
  'LOW', current_date, true, 'high', true, 'online', 'north_america', 'middle_east');

-- =====================================================================
-- AIR ASTANA Nomad Club (NOT Star Alliance; bilateral codeshares only)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'air-astana'), (select id from programs where slug = 'air-astana'),
  'Economy', 'Almaty-Bangkok / Seoul one-way on Air Astana metal', 25000, 30000, 'fixed',
  'Own-metal regional economy. Verify on airastana.com.',
  'MED', current_date, true, 'low', false, 'phone', 'asia_2', 'asia_1'),
((select id from programs where slug = 'air-astana'), (select id from programs where slug = 'air-astana'),
  'Business', 'Almaty-LHR one-way on Air Astana metal', 80000, 100000, 'fixed',
  'Own-metal long-haul business via A321LR. Verify pricing - hard to fund without flying Air Astana.',
  'LOW', current_date, true, 'low', false, 'phone', 'asia_2', 'europe'),
((select id from programs where slug = 'air-astana'), (select id from programs where slug = 'lufthansa'),
  'Business', 'US-Europe via Lufthansa bilateral one-way', 75000, 95000, 'fixed',
  'LH bilateral codeshare - not a Star Alliance redemption. Phone booking standard. YQ pass-through.',
  'LOW', current_date, true, 'high', false, 'phone', 'north_america', 'europe'),
((select id from programs where slug = 'air-astana'), (select id from programs where slug = 'air-astana'),
  'Economy', 'Practical US play: book Air Astana via Aeroplan or Avianca LifeMiles instead', null, null, 'dynamic',
  'Air Astana is NOT a Star Alliance member as of May 2026. US flyers should book Air Astana metal via Aeroplan or Avianca LifeMiles using bilateral routing - LifeMiles US-Almaty business via Frankfurt is approximately 78K miles. Direct Nomad accrual is impractical from US currencies.',
  'HIGH', current_date, true, 'low', false, 'phone', 'north_america', 'asia_2');

-- =====================================================================
-- CEBU PACIFIC Go Rewards (non-aligned LCC; dynamic, no chart)
-- =====================================================================
-- Cebu Pacific Go Rewards is a coalition LCC program with dynamic redemption
-- against cash fares; no fixed chart and no partner award redemption.
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'cebu-pacific'),
  (select id from programs where slug = 'cebu-pacific'),
  'Economy', 'Dynamic redemption against cash fare - no chart, no partner awards',
  null, null, 'dynamic',
  'Go Rewards is a Philippine coalition LCC program. Points redeem dynamically against Cebu Pacific cash fares (and ancillaries). Min 50 points to redeem. No partner award redemption. PHP 99 flash-fare sales typically beat any points redemption math. No US flexible-currency transfers in. Listed for cross-program-consistency.',
  'HIGH', current_date, true, 'low', true, 'online'
);

-- =====================================================================
-- PHILIPPINE AIRLINES Mabuhay Miles (non-aligned; Atmos partner May 2025)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'philippine-airlines'),
  'Economy', 'US (LAX/SFO/JFK)-MNL round-trip on PAL metal', 80000, 80000, 'fixed',
  'Own-metal long-haul economy round-trip. Verify post-2024 chart on philippineairlines.com.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'philippine-airlines'),
  'Business', 'US-MNL round-trip on PAL metal', 150000, 180000, 'fixed',
  'Own-metal long-haul business round-trip on A350-900. Verify post-2024 chart.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'asia_1'),
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'philippine-airlines'),
  'Business', 'Manila-Tokyo / Seoul / HKG round-trip on PAL metal', 60000, 75000, 'fixed',
  'Own-metal intra-Asia premium - solid value for short-haul business.',
  'MED', current_date, true, 'low', true, 'online', 'asia_1', 'asia_1'),
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'atmos'),
  'Economy', 'Atmos Rewards / Mileage Plan on PAL metal (post-May-2025 partnership)', null, null, 'dynamic',
  'NEW May 2025: PAL is Alaska Atmos Rewards 32nd global partner. Atmos / Hawaiian Mileage Plan members earn and redeem on PAL metal. Atmos pricing was in dynamic-transition phase as of 2026 - verify on alaskaair.com / atmosrewards.com.',
  'HIGH', current_date, true, 'low', true, 'online', 'north_america', 'asia_1'),
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'hawaiian'),
  'Economy', 'PAL via Hawaiian inter-island partner award', 7500, 15000, 'fixed',
  'Hawaiian partner via PAL bilateral. Useful for inter-island connections layered onto a PAL itinerary.',
  'LOW', current_date, true, 'low', false, 'phone', 'hawaii', 'hawaii'),
((select id from programs where slug = 'philippine-airlines'), (select id from programs where slug = 'turkish'),
  'Business', 'PAL via Turkish partner to Europe round-trip', 90000, 130000, 'fixed',
  'Turkish partner via PAL bilateral. YQ pass-through on Turkish metal verifies per route.',
  'LOW', current_date, true, 'high', false, 'phone', 'asia_1', 'europe');

-- =====================================================================
-- EL AL Matmid (non-aligned; Delta SkyMiles partner since Jan 2024)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'el-al'), (select id from programs where slug = 'el-al'),
  'Economy', 'TLV-Europe round-trip on El Al metal', 30000, 50000, 'fixed',
  'Own-metal mid-haul economy. Practical US path: Amex MR -> Delta SkyMiles -> El Al partner award (Amex MR -> Matmid direct pipe ENDED Jan 1 2021).',
  'MED', current_date, true, 'low', true, 'online', 'middle_east', 'europe'),
((select id from programs where slug = 'el-al'), (select id from programs where slug = 'el-al'),
  'Business', 'TLV-Europe round-trip on El Al metal', 120000, 120000, 'fixed',
  'Own-metal long-haul business round-trip. Verify post-April-2025 chart.',
  'MED', current_date, true, 'low', true, 'online', 'middle_east', 'europe'),
((select id from programs where slug = 'el-al'), (select id from programs where slug = 'el-al'),
  'Economy', 'TLV-US (JFK/EWR/LAX/MIA) round-trip on El Al metal', 70000, 70000, 'fixed',
  'Own-metal long-haul economy round-trip. Verify post-April-2025 thresholds.',
  'MED', current_date, true, 'low', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'el-al'), (select id from programs where slug = 'el-al'),
  'Business', 'TLV-US round-trip on El Al metal', 180000, 220000, 'fixed',
  'Own-metal long-haul business round-trip. Verify post-April-2025 chart on elal.com.',
  'MED', current_date, true, 'low', true, 'online', 'middle_east', 'north_america'),
((select id from programs where slug = 'el-al'), (select id from programs where slug = 'delta'),
  'Business', 'US-TLV via Delta SkyMiles partner award one-way', 150000, 250000, 'dynamic',
  'Delta SkyMiles strategic partnership launched Jan 1 2024 (codeshare/FFP live Jan 15 2024). El Al / AA partnership ENDED Mar 30 2024; El Al / Alaska partnership ENDED Jun 30 2024. SkyMiles uses dynamic pricing - the path exists for US flexible-currency flyers via Amex MR.',
  'MED', current_date, true, 'none', true, 'online', 'north_america', 'middle_east');

-- =====================================================================
-- FLYDUBAI (uses Emirates Skywards - no separate currency)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'flydubai'), (select id from programs where slug = 'flydubai'),
  'Economy', 'DXB short-haul (Caucasus / East Africa / Balkans / Central Asia) one-way', 5000, 12500, 'fixed',
  'Skywards Classic Reward on flydubai metal + cash co-pay. Full all-cabin Classic Reward redemption on flydubai live April 29 2025.',
  'HIGH', current_date, true, 'high', true, 'online', 'middle_east', 'asia_2'),
((select id from programs where slug = 'flydubai'), (select id from programs where slug = 'flydubai'),
  'Business', 'DXB-Tbilisi / Baku / Kathmandu one-way', 25000, 40000, 'fixed',
  'Skywards Classic Reward on flydubai metal business one-way. Verify on emirates.com.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'asia_2'),
((select id from programs where slug = 'flydubai'), (select id from programs where slug = 'flydubai'),
  'Economy', 'DXB to flydubai-only destinations (Mogadishu, Bishkek, Skopje, Sarajevo)', 7500, 15000, 'fixed',
  'Network reach Emirates does not have - flydubai unlocks unique award destinations.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'sub_saharan_africa'),
((select id from programs where slug = 'flydubai'), (select id from programs where slug = 'emirates'),
  'Business', 'Pair flydubai short-haul with Emirates DXB-US business one-way (stopover via Dubai)', 136000, 136000, 'fixed',
  'Skywards Classic Reward on Emirates metal one-way. Pair with flydubai short-haul for stopover routing. YQ pass-through significant.',
  'MED', current_date, true, 'high', true, 'online', 'north_america', 'middle_east'),
((select id from programs where slug = 'flydubai'), (select id from programs where slug = 'flydubai'),
  'Economy', 'DXB-Caucasus winter one-way', 5000, 7500, 'fixed',
  'Lower seasonal pricing on short-haul flydubai routes.',
  'MED', current_date, true, 'high', true, 'online', 'middle_east', 'asia_2');

-- =====================================================================
-- VIVAAEROBUS VivaFan (paid discount club - NOT a points program)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'vivaaerobus'),
  (select id from programs where slug = 'vivaaerobus'),
  'Economy', 'Paid discount club model - no points redemption',
  null, null, 'dynamic',
  'VivaFan is a paid annual subscription discount club (~MXN $1,499/yr Individual; Accompanied Traveler covers up to 8 companions). No miles, no award chart, no transfer partners. Discount applies to base fare only (~MXN $400 off Viva Smart RT). Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'none', false, 'online'
);

-- =====================================================================
-- PEGASUS BolBol (Turkish ULCC; simple published chart)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'pegasus'), (select id from programs where slug = 'pegasus'),
  'Economy', 'Domestic Turkey one-way (winter)', 10000, 10000, 'fixed',
  'Pegasus metal domestic winter one-way. Min 2,000 BolPoints to redeem for ticket.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'pegasus'), (select id from programs where slug = 'pegasus'),
  'Economy', 'Domestic Turkey one-way (summer)', 15000, 15000, 'fixed',
  'Pegasus metal domestic summer one-way.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'pegasus'), (select id from programs where slug = 'pegasus'),
  'Economy', 'Istanbul (SAW) to European hubs (CDG/AMS/LHR/FRA) winter one-way', 25000, 25000, 'fixed',
  'Pegasus metal international winter one-way. Solid against Eur 100+ paid fares.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'pegasus'), (select id from programs where slug = 'pegasus'),
  'Economy', 'International Pegasus one-way (summer)', 30000, 30000, 'fixed',
  'Pegasus metal international summer one-way.',
  'HIGH', current_date, true, 'low', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'pegasus'), (select id from programs where slug = 'pegasus'),
  'Economy', 'Practical US-flyer note: hard to fund without flying Pegasus or ING Turkey co-brand', null, null, 'fixed',
  'No major US flexible-currency partner (not Amex / Chase / Cap One / Citi / Bilt / WF / Marriott). Pegasus paid fares are typically very cheap - cash often beats points for US flyers.',
  'HIGH', current_date, true, 'low', false, 'online', 'europe', 'europe');
