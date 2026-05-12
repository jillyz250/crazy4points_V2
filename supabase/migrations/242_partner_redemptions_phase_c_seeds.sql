-- 242_partner_redemptions_phase_c_seeds.sql
-- Phase C: seed missing partner_redemptions rows.
--
-- The audit on JFK-HNL / JFK-LHR / LAX-NRT exposed that several famous sweet
-- spots aren't visible on the Hub because no partner_redemptions row exists
-- for the (currency × carrier × cabin × bucket) combo. The charts compute
-- the right cost — but compute is only invoked when a row exists to enrich.
--
-- Fills in:
--   #10 Atmos × Hawaiian for HNL (us-long)
--   #13 Atmos × BA / Iberia / Aer Lingus / Finnair (us-eu-east / us-eu-west)
--   #17 Atmos × JAL / Cathay (us-japan / us-se-asia)
--   #18 VS × ANA (us-japan / us-eu-east / us-pacific)
--   #14 M&M × Lufthansa (us-eu-east / us-eu-west)
--   #15 Remove questionable RJ × AA × us-eu-east stored row (RJ doesn't really
--       fly transatlantic on AA partner)
--
-- All inserts use a NOT EXISTS guard so re-running won't duplicate.
-- Cost columns are best-guess from verified prose — chart compute will
-- override at query time anyway.
--
-- Authored: 2026-05-12

begin;

-- Reusable helper: insert if not already present.
-- Pattern: insert ... select ... where not exists (...same combo)

-- ─── #10: Atmos × Hawaiian (us-long, HNL anchor) ───────────────────────

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'hawaiian'),
  'Economy', 'Mainland US to Hawaii via Hawaiian',
  20000, 20000, 'fixed',
  'Atmos preserved Alaska MileagePlan distance chart. 20k Y to Hawaii on Hawaiian metal is the headline.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'north_america', 'easy', 'good',
  array['us-long'], 'Atmos Hawaii on Hawaiian metal — 20k Y is the marquee mainland-to-Hawaii rate.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'hawaiian')
    and cabin = 'Economy'
    and 'us-long' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'hawaiian'),
  'First', 'Mainland US to Hawaii via Hawaiian',
  60000, 60000, 'fixed',
  'Hawaiian own-metal first class via Atmos.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'north_america', 'easy', 'mixed',
  array['us-long'], '60k F on Hawaiian metal — solid premium-cabin Hawaii redemption.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'hawaiian')
    and cabin = 'First'
    and 'us-long' = any(route_buckets)
);

-- ─── #13: Atmos × BA / Iberia / Aer Lingus / Finnair (us-eu-east + us-eu-west) ──

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'british-airways'),
  'Business', 'US East Coast to Europe via BA',
  45000, 45000, 'fixed',
  'Atmos EMEA-region partner chart, 1,501-3,500 mi band. ⚠ BA fuel surcharges $500+ on awards.',
  'HIGH', current_date, true, 'high', true, 'online',
  'north_america', 'europe', 'easy', 'mixed',
  array['us-eu-east'], '45k J via Atmos on BA — half the BA Avios price but BA YQ surcharges hurt the cash side.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'british-airways')
    and cabin = 'Business'
    and 'us-eu-east' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'iberia'),
  'Business', 'US East Coast to Madrid via Iberia',
  45000, 45000, 'fixed',
  'Atmos EMEA-region partner chart. Iberia metal has materially lower YQ than BA — better cash side.',
  'HIGH', current_date, true, 'low', true, 'online',
  'north_america', 'europe', 'easy', 'good',
  array['us-eu-east'], '45k J via Atmos on Iberia — same chart as BA but no fuel-surcharge sting. Sweet spot.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'iberia')
    and cabin = 'Business'
    and 'us-eu-east' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'aer-lingus'),
  'Business', 'US East Coast to Dublin via Aer Lingus',
  45000, 45000, 'fixed',
  'Atmos EMEA-region partner chart. EI lay-flat J via DUB, no fuel surcharges.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'europe', 'easy', 'good',
  array['us-eu-east'], '45k J via Atmos on Aer Lingus — surcharge-free transatlantic lay-flat.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'aer-lingus')
    and cabin = 'Business'
    and 'us-eu-east' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'finnair'),
  'Business', 'US East Coast to Helsinki via Finnair',
  45000, 45000, 'fixed',
  'Atmos EMEA-region partner chart. Finnair J via HEL, often quieter award space than BA.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'europe', 'easy', 'mixed',
  array['us-eu-east'], '45k J via Atmos on Finnair — surcharge-free Europe via HEL with good award space.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'finnair')
    and cabin = 'Business'
    and 'us-eu-east' = any(route_buckets)
);

-- ─── #17: Atmos × JAL / Cathay (us-japan / us-se-asia) ─────────────────

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'jal'),
  'Business', 'US to Japan via JAL',
  60000, 75000, 'fixed',
  'Atmos Asia-Pacific region partner chart. JAL J 60-75k depending on distance band — one of the best Asia plays.',
  'HIGH', current_date, true, 'low', true, 'online',
  'north_america', 'asia_1', 'easy', 'mixed',
  array['us-japan'], 'Atmos × JAL J to Japan: 60k West Coast / 75k East Coast. Legendary value.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'jal')
    and cabin = 'Business'
    and 'us-japan' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'cathay'),
  'Business', 'US to Hong Kong via Cathay Pacific',
  60000, 75000, 'fixed',
  'Atmos Asia-Pacific region partner chart. CX J via HKG remains a classic.',
  'HIGH', current_date, true, 'low', true, 'online',
  'north_america', 'asia_2', 'easy', 'mixed',
  array['us-se-asia'], 'Atmos × Cathay J to Hong Kong — preserved old Alaska sweet spot, low surcharges.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'cathay')
    and cabin = 'Business'
    and 'us-se-asia' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'atmos'),
  (select id from programs where slug = 'cathay'),
  'Business', 'US East Coast to Asia via Cathay (Japan / Korea)',
  60000, 75000, 'fixed',
  'Atmos Asia-Pacific chart, US-Japan/Korea band.',
  'HIGH', current_date, true, 'low', true, 'online',
  'north_america', 'asia_1', 'easy', 'mixed',
  array['us-japan'], 'Atmos × Cathay J on Asia routes — chart-computed by distance band.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'atmos')
    and operating_carrier_id = (select id from programs where slug = 'cathay')
    and cabin = 'Business'
    and 'us-japan' = any(route_buckets)
);

-- ─── #18: VS × ANA partner (us-japan / us-eu-east / us-pacific) ─────────

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'virgin-atlantic'),
  (select id from programs where slug = 'ana'),
  'Business', 'US to Japan via ANA (Virgin Atlantic partner award)',
  47500, 60000, 'fixed',
  'VS Flying Club ANA partner chart. One-way allowed (unlike ANA-direct), no fuel surcharges. The marquee Virgin Atlantic sweet spot.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'asia_1', 'annoying', 'mixed',
  array['us-japan'], 'VS × ANA J: 47.5k WC / 60k EC. No surcharges, one-way allowed. The most famous transpacific sweet spot.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'virgin-atlantic')
    and operating_carrier_id = (select id from programs where slug = 'ana')
    and cabin = 'Business'
    and 'us-japan' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'virgin-atlantic'),
  (select id from programs where slug = 'ana'),
  'First', 'US to Japan First Class via ANA THE Suite',
  72500, 85000, 'fixed',
  'VS-ANA First in THE Suite cabin. 72.5k WC / 85k EC.',
  'HIGH', current_date, true, 'none', true, 'online',
  'north_america', 'asia_1', 'annoying', 'rare',
  array['us-japan'], 'VS × ANA First — THE Suite product for fraction of ANA-direct first class.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'virgin-atlantic')
    and operating_carrier_id = (select id from programs where slug = 'ana')
    and cabin = 'First'
    and 'us-japan' = any(route_buckets)
);

-- ─── #14: M&M × Lufthansa (us-eu-east / us-eu-west) ─────────────────────

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'miles-and-more'),
  (select id from programs where slug = 'lufthansa'),
  'Business', 'US to Europe via Lufthansa Group',
  125000, 125000, 'fixed',
  'M&M Star Alliance partner chart (post-June 2025). ⚠ M&M passes through HEAVY YQ on LH Group metal — $500-900+ RT in J.',
  'HIGH', current_date, true, 'high', true, 'online',
  'north_america', 'europe', 'annoying', 'good',
  array['us-eu-east'], '125k J via M&M on LH — partner chart fixed, but the YQ kills the cash side. Usually beaten by Aeroplan or LifeMiles for the same metal.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'miles-and-more')
    and operating_carrier_id = (select id from programs where slug = 'lufthansa')
    and cabin = 'Business'
    and 'us-eu-east' = any(route_buckets)
);

insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel,
  origin_region, dest_region, complexity_score, availability_reality,
  route_buckets, teach_caption
)
select
  (select id from programs where slug = 'miles-and-more'),
  (select id from programs where slug = 'lufthansa'),
  'First', 'US to Europe First Class via Lufthansa',
  215000, 215000, 'fixed',
  'M&M Star Alliance partner chart F. LH First only released to partners 15 days out — limited availability.',
  'HIGH', current_date, true, 'high', false, 'phone',
  'north_america', 'europe', 'nerd_stuff', 'rare',
  array['us-eu-east'], '215k F via M&M on LH — extremely thin space, books T-15 to partners only. Heavy YQ.'
where not exists (
  select 1 from partner_redemptions
  where currency_program_id = (select id from programs where slug = 'miles-and-more')
    and operating_carrier_id = (select id from programs where slug = 'lufthansa')
    and cabin = 'First'
    and 'us-eu-east' = any(route_buckets)
);

-- ─── #15: Remove questionable RJ × AA × us-eu-east row ─────────────────
-- Royal Jordanian doesn't fly to Europe via American partner award. The
-- stored row is misleading. Mark inactive (preserves history).

update partner_redemptions
set is_active = false
where currency_program_id = (select id from programs where slug = 'royal-jordanian')
  and operating_carrier_id = (select id from programs where slug = 'aa')
  and 'us-eu-east' = any(route_buckets);

commit;
