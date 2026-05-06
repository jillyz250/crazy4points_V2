-- partner_redemptions backfill: round-9 batch (9 programs).
-- Each row links a currency program (the one whose miles you would spend) to an
-- operating carrier (the airline you would actually fly), with current point
-- cost ranges, cabin, and key flags.
--
-- Round 9 programs (Tier D - long-tail; Czech OK Plus DEFUNCT, skipped):
--   bulgaria-air, wizz-air, airasia, air-india-express, norwegian,
--   indigo, bamboo, air-tahiti-nui, jetsmart
--
-- Pricing data sourced from each program's published chart where available.
-- Many Tier D programs have no public chart, no US-relevant award redemption,
-- or run cashback / paid-discount-club models; placeholder rows note this for
-- cross-program-consistency. Air Tahiti Nui and JetSmart get real US-relevant
-- AAdvantage-routed rows because that is the entire reader story.

-- =====================================================================
-- BULGARIA AIR FlyMore (non-aligned; minimal US relevance)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'bulgaria-air'),
  (select id from programs where slug = 'bulgaria-air'),
  'Economy', 'No US flexible-currency or alliance pipe; redeem Star Alliance miles on Lufthansa / Turkish / Aegean to SOF instead',
  null, null, 'fixed',
  'Bulgaria Air FlyMore has no major US flexible-currency partner (not Amex / Chase / Cap One / Citi / Bilt / WF / Marriott) and is NOT a Star Alliance member despite the misconception. Award redemption is restricted to direct Bulgaria Air metal only; no partner pipe. US flyers heading to SOF should redeem United / Aeroplan / Turkish / Aegean miles on Lufthansa / Turkish / Aegean metal. Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'low', false, 'phone'
);

-- =====================================================================
-- WIZZ DISCOUNT CLUB (paid discount club - NOT a points program)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'wizz-air'),
  (select id from programs where slug = 'wizz-air'),
  'Economy', 'Paid discount club model - no points redemption',
  null, null, 'dynamic',
  'Wizz Discount Club is a paid annual subscription (~EUR 39.99 promo / EUR 59.99 regular for Standard) that grants EUR 10 off tickets >= EUR 29.99 + EUR 5 off bags. NOT a points program: no miles, no chart, no transfer partners, no co-brand. 2025 change: lowest sub-EUR 30 fares now excluded from discount. MultiPass (UK relaunch March 12 2026) is a separate GBP 55/mo one-way / GBP 110/mo return product with >= 5-day booking windows. Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'none', true, 'online'
);

-- =====================================================================
-- AIRASIA REWARDS (lifestyle coalition; dynamic; no US partners)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'airasia'),
  (select id from programs where slug = 'airasia'),
  'Economy', 'Dynamic redemption against cash fare on airasia Superapp - no chart, no US partners, no US gateway',
  null, null, 'dynamic',
  'airasia rewards (rebranded BIG Loyalty) is a 300+ partner lifestyle coalition platform. Points redeem dynamically against AirAsia cash fares, add-ons, and lifestyle deals. AirAsia X long-haul KUL-LAX/HNL was discontinued years ago - no US gateway. No major US flexible-currency partner. US flyers heading to SE Asia should route via Star Alliance (Singapore / Thai / ANA) or oneworld (Cathay / JAL / Qatar). Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'low', true, 'online'
);

-- =====================================================================
-- AIR INDIA EXPRESS (loyalty in transition - Maharaja Club integration)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'air-india-express'),
  (select id from programs where slug = 'air-india-express'),
  'Economy', 'Loyalty in transition - AIX-into-Maharaja Club earning scheduled later 2026; no separate AIX FFP currency',
  null, null, 'fixed',
  'AIX bookings currently earn Tata NeuPass / NeuCoins (India wallet platform). Maharaja Club redemption on AIX flights enabled progressively from April 1, 2026. AIX-into-Maharaja Club earning scheduled later 2026 - not yet live as of May 2026. US flyers heading to India should redeem Star Alliance miles (United / Aeroplan / Turkish / ANA) on Air India parent metal. Refresh recommended late 2026 once integration completes.',
  'MED', current_date, true, 'low', false, 'phone'
);

-- =====================================================================
-- NORWEGIAN REWARD CashPoints (cashback model - NOK 1:1)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'norwegian'), (select id from programs where slug = 'norwegian'),
  'Economy', 'Intra-Europe / Scandinavia Norwegian metal one-way (cashback rebate)', null, null, 'dynamic',
  'CashPoints redeem at NOK 1:1 (~USD 0.10) against the live cash fare on Norwegian or Wideroe metal. No award chart, no peak/off-peak, no blackouts, no minimum redemption beyond standard ticketing. Earning is fare-percentage based; LowFare / LowFare+ / Flex earn progressively higher rates (excluding taxes). Norwegian no longer flies to the US.',
  'HIGH', current_date, true, 'none', true, 'online', 'europe', 'europe'),
((select id from programs where slug = 'norwegian'), (select id from programs where slug = 'norwegian'),
  'Economy', 'No partner award redemption - CashPoints work only on Norwegian / Wideroe metal', null, null, 'dynamic',
  'No partner award pipe. No major US flexible-currency partner (not Amex / Chase / Cap One / Citi / Bilt / WF / Marriott). US-issued Norwegian Reward Credit Card (BoA) was discontinued; current cards are Nordic-issued only. For US-Scandinavia travel, redeem SkyTeam (Delta / KLM / AF Flying Blue) or Star (United / SAS Eurobonus) instead.',
  'HIGH', current_date, true, 'none', false, 'online', 'north_america', 'europe');

-- =====================================================================
-- INDIGO BLUCHIP (Indian ULCC; cashback model - INR 1:1)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'indigo'),
  (select id from programs where slug = 'indigo'),
  'Economy', 'Cashback model - INR 1:1 redemption on any IndiGo flight; no chart, no partners',
  null, null, 'dynamic',
  'IndiGo BluChip launched 2024 replacing 6E Rewards at the airline level. 1 BluChip = INR 1, redeemable on any IndiGo flight with no blackouts. Earning is 8-16 BluChips per INR 100 based on tier + booking channel. No major US flexible-currency partner (not Amex / Chase / Cap One / Citi / Bilt / WF / Marriott). No US-issued co-brand. IndiGo has no US service. For US-India transit, redeem Star (Air India / United / Turkish / ANA) or oneworld (BA Avios / Qatar) instead. Listed for cross-program-consistency only.',
  'HIGH', current_date, true, 'none', true, 'online'
);

-- =====================================================================
-- BAMBOO AIRWAYS Bamboo Club (contracted; domestic only)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online, booking_channel
) values (
  (select id from programs where slug = 'bamboo'),
  (select id from programs where slug = 'bamboo'),
  'Economy', 'Domestic Vietnam Bamboo metal only - no international service post-2023 collapse',
  null, null, 'fixed',
  'Bamboo Airways near-collapse 2023 forced withdrawal from Australia + long-haul + 787 fleet. As of April 2026: ~7-10 narrow-body aircraft, ~7 domestic destinations, 0 international destinations. Award redemption restricted to domestic Vietnam Bamboo metal. No major US flexible-currency partner. No US-issued co-brand. October 2025 Bamboo restored prior-year tier statuses; tier-match reopened November 8 2025 (status novelty only). For Vietnam travel, redeem Delta SkyMiles / Flying Blue on Vietnam Airlines (SkyTeam) instead. Verify current schedule on bambooairways.com - heavy operational uncertainty.',
  'MED', current_date, true, 'low', false, 'phone'
);

-- =====================================================================
-- AIR TAHITI NUI Club Tiare (real US value via AAdvantage / Atmos / Flying Blue)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'air-tahiti-nui'), (select id from programs where slug = 'air-tahiti-nui'),
  'Economy', 'LAX-PPT one-way on ATN metal (own-program own-metal reference)', null, null, 'fixed',
  'Club Tiare itself does not have direct US flexible-currency transfer-in pipes. For US flyers, fund via partner programs - AAdvantage is the most reliable. Daytime LAX-PPT westbound is the gold-standard award flight when available.',
  'MED', current_date, true, 'low', false, 'phone', 'north_america', 'south_pacific'),
((select id from programs where slug = 'air-tahiti-nui'), (select id from programs where slug = 'aa'),
  'Economy', 'LAX-PPT one-way via AAdvantage on ATN metal', 40000, 40000, 'fixed',
  'AAdvantage saver one-way LAX-PPT economy. No fuel surcharges on AAdvantage redemptions on ATN. Citi ThankYou + Bilt 1:1 to AAdvantage is the cleanest US flexible-currency path. aa.com search has the most consistent ATN availability.',
  'HIGH', current_date, true, 'none', true, 'online', 'north_america', 'south_pacific'),
((select id from programs where slug = 'air-tahiti-nui'), (select id from programs where slug = 'aa'),
  'Business', 'LAX-PPT one-way via AAdvantage on ATN 787-9 Poerava Business', 80000, 80000, 'fixed',
  'AAdvantage saver one-way LAX-PPT business in 787-9 Poerava Business. Aspirational but pricey by AA chart standards. No fuel surcharges. 4-aircraft ATN fleet means limited award availability - book early.',
  'HIGH', current_date, true, 'none', true, 'online', 'north_america', 'south_pacific'),
((select id from programs where slug = 'air-tahiti-nui'), (select id from programs where slug = 'atmos'),
  'Economy', 'US-PPT via Atmos Mileage Plan on ATN metal (post-2024-2025 partnership)', null, null, 'dynamic',
  'Atmos Mileage Plan added ATN as a partner in 2024-2025 with competitive saver pricing when bookable. Likely best-value path when available. Atmos pricing was in dynamic-transition phase as of 2026 - verify on alaskaair.com / atmosrewards.com before transferring.',
  'MED', current_date, true, 'low', true, 'online', 'north_america', 'south_pacific'),
((select id from programs where slug = 'air-tahiti-nui'), (select id from programs where slug = 'flying-blue'),
  'Economy', 'US-PPT via Flying Blue Promo Reward on ATN metal', 25500, 50000, 'dynamic',
  'Flying Blue Promo Rewards historically priced PPT as low as 25,500 - but ATN availability has reportedly disappeared from Flying Blue online. Verify before transferring Amex MR / Cap One / Citi. Fuel surcharges (YQ) apply on Flying Blue ATN redemptions. Foreign carrier - no US federal excise tax via Amex MR.',
  'LOW', current_date, true, 'high', true, 'online', 'north_america', 'south_pacific');

-- =====================================================================
-- JETSMART (uses AAdvantage as its loyalty program since Sept 2024)
-- =====================================================================
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route,
  cost_miles_low, cost_miles_high, pricing_model, notes, confidence,
  last_verified, is_active, fuel_surcharges, bookable_online,
  booking_channel, origin_region, dest_region
) values
((select id from programs where slug = 'jetsmart'), (select id from programs where slug = 'aa'),
  'Economy', 'Intra-Chile / intra-Argentina short-haul one-way via AAdvantage on JetSmart metal', 7500, 12500, 'fixed',
  'AAdvantage saver award on JetSmart metal. JetSmart uses AAdvantage as its loyalty program since Sept 24 2024 (first non-American airline to fully adopt AAdvantage). JetSmart-only itineraries bookable on aa.com. Verify current saver inventory.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'jetsmart'), (select id from programs where slug = 'aa'),
  'Economy', 'Cross-border South America short-haul one-way via AAdvantage on JetSmart metal', 12500, 17500, 'fixed',
  'AAdvantage saver award on JetSmart cross-border South America. Per AA web specials + saver awards. Verify on aa.com.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'jetsmart'), (select id from programs where slug = 'aa'),
  'Economy', 'Loyalty Points earning on cheap JetSmart fares for AA elite status chasing', null, null, 'fixed',
  'Earn AAdvantage Loyalty Points on JetSmart marketed and operated flights + AA-marketed JetSmart codeshares since Sept 24 2024. Real US-flyer angle: cheap LP runs on low-cost JetSmart fares to chase AA elite status (Gold 40K LP / Platinum 75K LP / Platinum Pro 125K LP / Executive Platinum 200K LP).',
  'HIGH', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1'),
((select id from programs where slug = 'jetsmart'), (select id from programs where slug = 'jetsmart'),
  'Economy', 'All You Can Fly subscription (launched April 2026) - non-points product', null, null, 'fixed',
  'All You Can Fly: ~CLP 630,190 (~USD 650, verify) annual fee for unlimited direct routes across South America for 12 months. Booking windows: >= 24h before domestic, >= 72h before international. Subject to availability. Tax + fees per flight on top of subscription. Useful only for non-US-resident frequent regional travelers. Listed for cross-program-consistency.',
  'MED', current_date, true, 'low', true, 'online', 'south_america_1', 'south_america_1');
