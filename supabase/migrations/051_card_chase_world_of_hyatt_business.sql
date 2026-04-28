-- The World of Hyatt Business Credit Card (Chase, $199 AF).
-- Sister card to chase-world-of-hyatt (personal). Business-spend categories,
-- no anniversary free night, $50/$50 Hyatt credit twice per anniversary year,
-- 10% redemption rebate after $50K spend, faster path to elite via 5 TQN per $10K.
--
-- Sources:
--   - Chase official offer page (verified 2026-04-29)
--   - Chase Visa Signature Business Guide to Benefits (BGC11374_v2, eff 10/01/24)
--   - The Points Guy review (verified 2026-04-29)
--
-- Skeleton row was created in migration 050. This migration UPSERTS the
-- card with full editorial data and DELETES + REINSERTS child rows.
-- Idempotent.
--
-- Trip Cancellation/Interruption coverage ($1,500/$6,000) is sourced from
-- Chase's official offer page. The BGC11374_v2 PDF (effective 10/01/24) does
-- not list it, but Chase's customer-facing site does — so the benefit is
-- on the card. The PDF is likely behind on a supplemental rider; not a
-- coverage gap we should hedge against in our copy.

-- ── Update the card row with full editorial data ─────────────────────────

update credit_cards
set
  name                        = 'World of Hyatt Business Credit Card',
  intro                       = 'The business sibling of the personal World of Hyatt card. $199 a year buys business owners and 1099 earners a faster path to Hyatt elite status (5 tier-qualifying nights per $10K spend, uncapped) plus up to $100 a year in Hyatt credits ($50 twice per anniversary year, when you spend $50+ at Hyatt). The earn structure is unusual: 4x at Hyatt, 2x on whichever 3 of 8 eligible business categories you spend most on each quarter (Chase auto-picks your top 3), 2x fitness, 1x everything else. **Important: this card does NOT include the anniversary Cat 1-4 free night that the personal card gives, and there is no $15K-spend bonus night either.** What it does have instead: the 10% points-back rebate after $50K spend (real perk for high spenders), and auto rental coverage that is PRIMARY for business rentals (vs secondary on the personal card). Subject to Chase 5/24.',
  official_url                = 'https://creditcards.chase.com/business-credit-cards/world-of-hyatt-business-card',
  annual_fee_usd              = 199,
  card_type                   = 'business',
  card_tier                   = 'hotel_cobrand',
  foreign_transaction_fee_pct = 0.00,
  chase_5_24_subject          = true,
  credit_score_recommended    = 'good',
  tags                        = array['hotel-cobrand-flagship','best-business-hotel-cobrand','status-builder','keeper-card']::text[],
  intended_user               = array['business-owner','frequent-traveler','hyatt-loyalist','status-chaser']::text[],
  is_active                   = true,
  last_verified               = current_date
where slug = 'chase-world-of-hyatt-business';

-- ── Reset child rows for idempotency ─────────────────────────────────────

delete from credit_card_earn_rates       where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt-business');
delete from credit_card_benefits         where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt-business');
delete from credit_card_welcome_bonuses  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt-business');

-- ── Earn rates ───────────────────────────────────────────────────────────

insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes)
select c.id, x.category, x.multiplier, x.booking_channel, x.notes
from credit_cards c
cross join (values
  ('hyatt_purchases',           4.0, 'any',    'Qualifying Hyatt hotel/resort purchases. Stacks with WoH base earning for ~9x effective on stays.'),
  ('fitness_gym',               2.0, 'any',    'Fitness club and gym memberships. Always earns 2x (not subject to top-3 mechanic).'),
  ('dining',                    2.0, 'any',    'Earns 2x ONLY when dining is one of your top 3 spend categories that quarter (Chase auto-selects from 8 eligible business categories).'),
  ('airline_tickets',           2.0, 'direct', 'Flights direct from airline. 2x ONLY when in your top 3 categories that quarter.'),
  ('car_rentals',               2.0, 'any',    '2x ONLY when car rentals are in your top 3 categories that quarter.'),
  ('gas',                       2.0, 'any',    '2x ONLY when gas is in your top 3 categories that quarter.'),
  ('internet_cable_phone',      2.0, 'any',    'Internet, cable, and phone services. 2x ONLY when in your top 3 categories that quarter.'),
  ('local_transit',             2.0, 'any',    'Local transit and commuting. 2x ONLY when in your top 3 categories that quarter.'),
  ('shipping',                  2.0, 'any',    '2x ONLY when shipping is in your top 3 categories that quarter.'),
  ('social_media_search_ads',   2.0, 'any',    'Social media and search engine advertising. 2x ONLY when in your top 3 categories that quarter.'),
  ('everything_else',           1.0, 'any',    null)
) as x(category, multiplier, booking_channel, notes)
where c.slug = 'chase-world-of-hyatt-business';

-- ── Benefits ─────────────────────────────────────────────────────────────

insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  value_amount, value_unit, coverage_amount, frequency, spend_threshold_usd,
  description, sort_order, metadata
)
select
  c.id, b.category, b.benefit_type, b.name,
  b.value_amount, b.value_unit, b.coverage_amount, b.frequency, b.spend_threshold_usd,
  b.description, b.sort_order, b.metadata
from credit_cards c
cross join (values
  -- 1. Discoverist status (auto)
  ('status_conferred','status_hyatt_discoverist',  'Discoverist Status (Auto)',
   null, null, null, 'annual', null,
   'Automatic World of Hyatt Discoverist status as long as the account is open. Includes 10% bonus points on stays, premium internet, and 2pm late checkout (subject to availability).',
   1,
   '{"auto_renew": true, "tier": "discoverist", "primary_only": true, "status_tier_rank": 1}'::jsonb),

  -- 2. Discoverist gifting for employees
  ('status_conferred','status_hyatt_discoverist',  'Gift Discoverist to up to 5 Employees',
   5, null, null, 'lifetime', null,
   'Primary cardholder can gift World of Hyatt Discoverist status to up to 5 employees. Useful for businesses with regular Hyatt-staying staff.',
   2,
   '{"max_gift_recipients": 5, "tier": "discoverist", "status_tier_rank": 1}'::jsonb),

  -- 3. 5 TQN per $10K spend
  ('spend_unlock',    'spend_unlock_perk',         '5 Tier-Qualifying Night Credits per $10,000 Spend',
   5, 'nights', null, 'annual', 10000,
   'Five Tier-Qualifying Night credits for every $10,000 in card purchases - uncapped, calendar-year credited. Among the fastest paths to Hyatt status: $120K of spend yields 60 TQN credits = Globalist threshold without any actual stays.',
   3,
   '{"counts_toward": "elite_status_tiers", "uncapped": true, "issuance_year": "calendar", "primary_only": true}'::jsonb),

  -- 4. Hyatt $50 statement credits (twice per anniversary year)
  ('statement_credit','hotel_credit',              '$50 Hyatt Statement Credit (twice per anniversary year)',
   50, 'USD', null, 'anniversary', null,
   'Spend $50 or more at any Hyatt property and earn $50 statement credits, up to two times each anniversary year. Effective max value $100/year toward your $199 annual fee. Different mechanic from the personal card''s anniversary free night - this requires triggered Hyatt spend.',
   4,
   '{"per_trigger_usd": 50, "max_triggers_per_anniversary": 2, "annual_max_usd": 100, "trigger": "hyatt_spend_50_or_more", "reliable_breakage": "high"}'::jsonb),

  -- 5. 10% points-back rebate
  ('portal_redemption','portal_redemption_bonus',  '10% Points Back After $50K Spend (Redemption Rebate)',
   10, 'pct', 200000, 'annual', 50000,
   'After spending $50,000 on the card in a calendar year, get 10% of redeemed points back when using points for Hyatt awards. Capped at 200,000 points back per year, which effectively means the rebate applies to up to 2,000,000 points redeemed. Real rebate on award stays for high-spend businesses but the cap kicks in fast for big award trips.',
   5,
   '{"rebate_pct": 10, "max_points_back_per_year": 200000, "effective_max_points_redeemed_per_year": 2000000, "qualifying_spend_threshold_usd": 50000, "applies_to": "hyatt_award_redemptions"}'::jsonb),

  -- 6. Hyatt Leverage program access
  ('transfer_partner_unlock','transfer_partner_access','Hyatt Leverage Membership Access',
   15, 'pct', null, 'annual', null,
   'Cardholders get access to the Hyatt Leverage corporate program, offering up to 15% off standard rates at participating Hyatt hotels worldwide. Useful for businesses booking enough Hyatt nights to justify the standard-rate path over award nights.',
   6,
   '{"max_discount_pct": 15, "applies_to": "standard_rates_at_participating_hyatts"}'::jsonb),

  -- 7. DashPass (DoorDash + Caviar)
  ('statement_credit','doordash_credit',           'Complimentary DashPass + $10/qtr non-restaurant credit',
   10, 'USD', null, 'quarterly', null,
   'One-year complimentary DashPass membership for DoorDash and Caviar (unlimited deliveries with $0 fees on eligible orders). Auto-enrolls at standard rate after that. DashPass members also get up to $10 off quarterly on non-restaurant DoorDash orders. Activate by Dec 31, 2027.',
   7,
   '{"dashpass_complimentary_months": 12, "non_restaurant_quarterly_credit_usd": 10, "activation_deadline": "2027-12-31", "merchant_restriction": "doordash_caviar"}'::jsonb),

  -- 8. Auto Rental Coverage (PRIMARY for business)
  ('insurance',       'rental_car_cdw_primary',    'Auto Rental Coverage (Primary for Business)',
   null, null, 60000, 'per_trip', null,
   'Up to $60,000 reimbursement for theft or collision damage on rental cars charged in full to the card. PRIMARY coverage in the US when the rental is for business purposes (key difference from the personal card, which is secondary). Outside the US, primary regardless of purpose. Decline the rental agency CDW/LDW to activate. Up to 31 consecutive days. Excludes exotic cars >$125K MSRP, vehicles >12 passengers, antiques, RVs, motorcycles, cargo vans.',
   8,
   '{"max_per_rental_usd": 60000, "coverage_in_us_business": "primary", "coverage_in_us_personal": "secondary", "coverage_outside_us": "primary", "must_decline_rental_cdw": true, "max_rental_days": 31, "excluded_vehicle_types": ["exotic_over_125k","over_12_passengers","antiques","rv","motorcycles","cargo_vans"], "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 9. Trip Cancellation / Interruption Insurance
  ('insurance',       'trip_cancellation_insurance','Trip Cancellation / Interruption Insurance',
   null, null, 6000, 'per_trip', null,
   'Reimbursement up to $1,500 per covered traveler ($6,000 per trip) when a trip is canceled or cut short by sickness, severe weather, or other covered situations. Applies to pre-paid, non-refundable passenger fares charged to the card.',
   9,
   '{"max_per_traveler_usd": 1500, "max_per_trip_usd": 6000, "covered_persons": "cardholder + family", "source": "chase_offer_page_2026"}'::jsonb),

  -- 10. Baggage Delay Insurance
  ('insurance',       'baggage_delay_insurance',   'Baggage Delay Insurance',
   100, 'USD', 300, 'per_trip', null,
   'Up to $100 per day for emergency essential purchases when checked baggage is delayed 6+ hours by a common carrier. Maximum 3 days ($300 total per trip). Applies when carrier fare was charged to the card.',
   10,
   '{"per_day_usd": 100, "max_days": 3, "max_per_trip_usd": 300, "delay_hours_required": 6, "secondary": true, "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 11. Lost Luggage Reimbursement
  ('insurance',       'lost_luggage_insurance',    'Lost Luggage Reimbursement',
   null, null, 3000, 'per_trip', null,
   'Up to $3,000 per traveler per trip for lost, damaged, or stolen checked or carry-on baggage by a common carrier (NY: $2,000 per bag, $10,000 aggregate). Sub-limits: $500 jewelry/watches, $500 cameras/electronics. Applies when carrier fare was charged to the card.',
   11,
   '{"max_per_traveler_usd": 3000, "ny_max_per_bag_usd": 2000, "ny_aggregate_per_trip_usd": 10000, "sublimit_jewelry_watches_usd": 500, "sublimit_cameras_electronics_usd": 500, "secondary": true, "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 12. Travel Accident Insurance
  ('insurance',       'travel_accident_insurance', 'Travel Accident Insurance',
   null, null, 500000, 'per_trip', null,
   'Accidental death and dismemberment coverage during travel. $100,000 max for 24-Hour Travel Accident; $500,000 max for Common Carrier Travel Accident. Pays graduated percentages for specific losses.',
   12,
   '{"twenty_four_hour_max_usd": 100000, "common_carrier_max_usd": 500000, "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 13. Purchase Protection ($10K/item, $50K/year)
  ('protection',      'purchase_protection',       'Purchase Protection',
   null, null, 10000, 'per_trip', null,
   'New eligible purchases protected against theft, damage, or involuntary parting for 120 days from purchase (NY: 90 days). Up to $10,000 per item ($50,000 per calendar year). Substantially higher per-item cap than the personal card''s $500. Excludes vehicles, computer software, items for resale, perishables, traveler''s checks, used items.',
   13,
   '{"coverage_days": 120, "ny_coverage_days": 90, "max_per_item_usd": 10000, "max_per_calendar_year_usd": 50000, "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 14. Extended Warranty Protection
  ('protection',      'extended_warranty',         'Extended Warranty Protection',
   1, 'pct', 10000, 'one_time', null,
   'Adds one additional year to the original manufacturer''s US repair warranty on items charged to the card. Only applies if original warranty (plus any service contracts) is 3 years or less. Up to $10,000 per item, $50,000 per account.',
   14,
   '{"additional_years": 1, "max_original_warranty_years": 3, "max_per_item_usd": 10000, "max_per_account_usd": 50000, "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 15. Roadside Assistance
  ('protection',      'concierge',                 'Roadside Assistance (Pay-Per-Use)',
   null, null, null, 'per_trip', null,
   'Pay-per-use roadside dispatch - 24/7 in the US and Canada. Includes standard 5-mile tow, tire change, battery jump, lockout, fuel delivery (5 gallons), winching. Cardholder pays the per-service fee. Light-duty vehicles only (<=10,000 lbs).',
   15,
   '{"available_24_7": true, "geographic_coverage": "US + Canada", "vehicle_class": "light_duty_under_10k_lbs", "phone": "1-800-349-2634", "cost_model": "pay_per_use", "guide_version": "BGC11374_v2_20241001"}'::jsonb),

  -- 16. Travel and Emergency Assistance Services
  ('protection',      'concierge',                 'Travel and Emergency Assistance Services',
   null, null, null, 'per_trip', null,
   '24/7 referral hotline for emergencies while traveling. Provides arrangement and coordination only - cardholder pays for any actual medical, legal, transportation, or other services.',
   16,
   '{"available_24_7": true, "phone_us": "1-800-349-2634", "phone_intl": "001-214-503-2951", "cost_model": "referral_only_cardholder_pays_actuals", "guide_version": "BGC11374_v2_20241001"}'::jsonb)

) as b(
  category, benefit_type, name,
  value_amount, value_unit, coverage_amount, frequency, spend_threshold_usd,
  description, sort_order, metadata
)
where c.slug = 'chase-world-of-hyatt-business';

-- ── Current welcome bonus ────────────────────────────────────────────────

insert into credit_card_welcome_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_required_usd, spend_window_months,
  extras, is_current, source_url, notes, last_verified
)
select
  c.id, 80000, 'World of Hyatt points', 10000, 3,
  null, true,
  'https://creditcards.chase.com/business-credit-cards/world-of-hyatt-business-card',
  'Elevated public offer 80K verified via Chase offer page + TPG 2026-04-29. TPG noted "offer ends April 30" - confirm at apply page if applying after. Standard offer historically ranges 60-75K; current 80K is on the higher side.',
  current_date
from credit_cards c
where c.slug = 'chase-world-of-hyatt-business';
