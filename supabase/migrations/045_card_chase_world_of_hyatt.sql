-- Phase 3 - first credit card authored: The World of Hyatt Credit Card (personal).
--
-- Source 1 (offer details, earn rates, free nights, status, TQNs):
--   https://creditcards.chase.com/travel-credit-cards/world-of-hyatt-credit-card
--
-- Source 2 (insurance / protection benefits - Visa Signature Guide to Benefits):
--   Chase BGC11359_v2.pdf, effective 10/01/24
--   https://chasecardbenefits.com  (claim portal)
--
-- Source archive: plans/sources/cards/chase-world-of-hyatt.md
-- Architecture: plans/credit-cards-architecture.md (Round 3)
--
-- This migration:
--   1. Upserts Chase as an issuer
--   2. Upserts the card row
--   3. Replaces all child rows (earn rates / benefits / welcome bonus) for
--      this card so re-running this migration always lands the same final
--      state. Idempotent.
--
-- Re-runnable. Safe to paste twice.

-- ── Chase issuer ─────────────────────────────────────────────────────────

insert into issuers (slug, name, website_url, intro, last_verified)
values (
  'chase',
  'Chase',
  'https://www.chase.com',
  'JPMorgan Chase is the largest issuer of co-branded travel cards in the US (Hyatt, United, Marriott, Southwest, IHG, British Airways, Aer Lingus, Iberia, Disney). Chase also operates the Ultimate Rewards (UR) currency, earned by the Sapphire and Ink families and combinable across cards in a household.',
  current_date
)
on conflict (slug) do update set
  name          = excluded.name,
  website_url   = excluded.website_url,
  intro         = excluded.intro,
  last_verified = excluded.last_verified;

-- ── The World of Hyatt Credit Card (personal) ────────────────────────────

insert into credit_cards (
  slug, issuer_id, name, intro, official_url,
  annual_fee_usd, card_type, card_tier,
  currency_program_id, co_brand_program_id,
  foreign_transaction_fee_pct, chase_5_24_subject, credit_score_recommended,
  tags, intended_user, is_active, last_verified
)
select
  'chase-world-of-hyatt',
  i.id,
  'The World of Hyatt Credit Card',
  'If you stay at Hyatt even occasionally, this card pays for itself before you finish unpacking. $95 a year buys a Cat 1-4 free night every cardmember anniversary - typically a $200-300 value at most properties - plus a second night if you spend $15K in a calendar year. Earn 4x at Hyatt, 2x on the categories most points-people actually use (dining, airfare booked direct, transit, gym), 1x everywhere else. Comes with auto Discoverist status (the entry-level Hyatt tier), 5 elite-qualifying nights per calendar year, and 2 more for every $5K spent - uncapped, which is why this card has a cult following among status-chasers. 0% foreign transaction fees. Earns Hyatt points directly (no Chase UR detour). Subject to Chase''s 5/24 rule, so plan your card-app order accordingly.',
  'https://creditcards.chase.com/travel-credit-cards/world-of-hyatt-credit-card',
  95,
  'personal',
  'hotel_cobrand',
  hp.id,    -- currency_program_id (earns Hyatt points directly)
  hp.id,    -- co_brand_program_id (it IS the Hyatt co-brand)
  0.00,
  true,
  'good',
  array['hotel-cobrand-flagship','best-hotel-cobrand-low-fee','keeper-card']::text[],
  array['frequent-traveler','hyatt-loyalist','points-beginner']::text[],
  true,
  current_date
from issuers i
cross join programs hp
where i.slug = 'chase' and hp.slug = 'hyatt'
on conflict (slug) do update set
  name                        = excluded.name,
  intro                       = excluded.intro,
  official_url                = excluded.official_url,
  annual_fee_usd              = excluded.annual_fee_usd,
  card_type                   = excluded.card_type,
  card_tier                   = excluded.card_tier,
  currency_program_id         = excluded.currency_program_id,
  co_brand_program_id         = excluded.co_brand_program_id,
  foreign_transaction_fee_pct = excluded.foreign_transaction_fee_pct,
  chase_5_24_subject          = excluded.chase_5_24_subject,
  credit_score_recommended    = excluded.credit_score_recommended,
  tags                        = excluded.tags,
  intended_user               = excluded.intended_user,
  is_active                   = excluded.is_active,
  last_verified               = excluded.last_verified;

-- ── Reset child rows for idempotency ─────────────────────────────────────

delete from credit_card_earn_rates       where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt');
delete from credit_card_benefits         where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt');
delete from credit_card_welcome_bonuses  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt');

-- ── Earn rates ───────────────────────────────────────────────────────────
-- The CARD contributes the multipliers below. WoH base earning on Hyatt
-- stays (5x as Discoverist member) is separate and stacks; we record only
-- the card's own contribution.

insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes)
select c.id, x.category, x.multiplier, x.booking_channel, x.notes
from credit_cards c
cross join (values
  ('hyatt_purchases',     4.0, 'any',    'Qualifying Hyatt hotel/resort purchases and Hyatt Experiences (hyatt.com/experiences). Stacks with WoH base earning for ~9x effective on stays.'),
  ('dining',              2.0, 'any',    'Restaurants worldwide (excluding dining at Hyatt, which earns 4x).'),
  ('airline_tickets',     2.0, 'direct', 'Airline tickets purchased directly with the airline (not OTAs).'),
  ('local_transit',       2.0, 'any',    'Local transit and commuting - rideshare, taxis, tolls, trains, buses.'),
  ('fitness_gym',         2.0, 'any',    'Fitness club and gym memberships.'),
  ('everything_else',     1.0, 'any',    null)
) as x(category, multiplier, booking_channel, notes)
where c.slug = 'chase-world-of-hyatt';

-- ── Benefits ─────────────────────────────────────────────────────────────
-- Free nights, status, and TQN accelerators are from the Chase offer page.
-- Insurance/protections are from Chase Visa Signature Guide to Benefits
-- (BGC11359_v2.pdf, effective 10/01/24).

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
  -- 1. Anniversary free night (cardmember anniversary)
  ('free_night',      'free_night_award',           'Anniversary Free Night (Cat 1-4)',
   1, 'nights', null, 'anniversary', null,
   'A free night certificate at any Category 1-4 Hyatt hotel or resort, awarded each cardmember anniversary. Issued to the primary cardholder only (authorized users do not receive); redemption can include guest stays via Hyatt''s standard booking flow. Typically valid 12 months from issuance. Standard rooms only at Cat 1-4 hotels - not valid at Miraval, Hyatt Zilara/Ziva, or for all-inclusive packages. Resort/destination/facility fees waived (excluding Hyatt Residence Club). Cannot be used for package rates.',
   1,
   '{"category_cap": 4, "expiration_months": 12, "issuance_year": "cardmember_anniversary", "issuance_delay_weeks_max": 10, "issued_to": "primary_only", "redemption_for_guests": true, "excluded_brands": ["Miraval","Hyatt Zilara","Hyatt Ziva"], "excluded_rate_types": ["all_inclusive","packages"], "fees_waived": ["resort","destination","facility"], "fees_waived_excludes": ["Hyatt Residence Club"]}'::jsonb),

  -- 2. $15K spend bonus free night (CALENDAR YEAR)
  ('free_night',      'free_night_after_spend',     'Bonus Free Night after $15K Spend (Cat 1-4)',
   1, 'nights', null, 'annual', 15000,
   'A second free night certificate at any Category 1-4 Hyatt property, awarded once per calendar year after $15,000 in card purchases. Issued to primary cardholder only; redemption can include guest stays. Typically valid 12 months from issuance. Standard rooms only at Cat 1-4 hotels - not valid at Miraval, Hyatt Zilara/Ziva, or for all-inclusive packages. Up to 8 weeks for issuance after qualifying.',
   2,
   '{"category_cap": 4, "expiration_months": 12, "issuance_year": "calendar", "issuance_delay_weeks_max": 8, "issued_to": "primary_only", "redemption_for_guests": true, "excluded_brands": ["Miraval","Hyatt Zilara","Hyatt Ziva"], "excluded_rate_types": ["all_inclusive","packages"]}'::jsonb),

  -- 3. Discoverist status
  ('status_conferred','status_hyatt_discoverist',   'Discoverist Status (Auto)',
   null, null, null, 'annual', null,
   'Automatic World of Hyatt Discoverist status as long as the account is open and not in default. Up to 8 weeks after account opening for status to apply. Authorized users do not receive Discoverist via the card.',
   3,
   '{"auto_renew": true, "tier": "discoverist", "primary_only": true, "issuance_delay_weeks_max": 8}'::jsonb),

  -- 4. 5 TQN credits each calendar year
  ('spend_unlock',    'spend_unlock_perk',          '5 Tier-Qualifying Night Credits per Calendar Year',
   5, 'nights', null, 'annual', null,
   'Five Tier-Qualifying Night credits credited each calendar year toward your next World of Hyatt status tier (Explorist requires 30 nights, Globalist requires 60). Issued within 8 weeks of January 1 (or within 8 weeks of account open in year 1). Valid through December 31 of same calendar year. Authorized users do not receive.',
   4,
   '{"counts_toward": "elite_status_tiers", "issuance_year": "calendar", "primary_only": true, "issuance_window": "within_8_weeks_of_jan_1"}'::jsonb),

  -- 5. 2 TQN credits per $5K spend (uncapped)
  ('spend_unlock',    'spend_unlock_perk',          '2 Tier-Qualifying Night Credits per $5,000 Spend',
   2, 'nights', null, 'annual', 5000,
   'Two additional Tier-Qualifying Night credits for every $5,000 in card purchases - UNCAPPED. Credits are applied to the calendar year in which the spend occurred. Up to 8 weeks from end of qualifying calendar month for posting. Authorized users do not receive.',
   5,
   '{"counts_toward": "elite_status_tiers", "uncapped": true, "issuance_year": "calendar", "primary_only": true}'::jsonb),

  -- 6. Auto Rental Coverage (CDW)
  ('insurance',       'rental_car_cdw_secondary',   'Auto Rental Coverage',
   null, null, 60000, 'per_trip', null,
   'Up to $60,000 reimbursement for theft or collision damage on rental cars charged in full to the card. Secondary coverage in the United States (primary if you have no other insurance); primary outside the US. Decline the rental agency''s CDW/LDW to activate. Rental periods up to 31 consecutive days covered. Excludes exotic cars >$125K, vehicles >12 passengers, antiques, RVs, motorcycles, cargo vans, trucks (other than pickups).',
   6,
   '{"max_per_rental_usd": 60000, "coverage_in_us": "secondary", "coverage_outside_us": "primary", "must_decline_rental_cdw": true, "max_rental_days": 31, "excluded_vehicle_types": ["exotic_over_125k","over_12_passengers","antiques","rv","motorcycles","cargo_vans"], "claim_window_days": 100, "doc_window_days": 365, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 7. Baggage Delay Insurance
  ('insurance',       'baggage_delay_insurance',    'Baggage Delay Insurance',
   100, 'USD', 300, 'per_trip', null,
   'Up to $100 per day for emergency essential purchases when checked baggage is delayed 6+ hours by a common carrier. Maximum 3 days ($300 total per trip). Applies when carrier fare was charged to the card. Excludes hearing aids, jewelry, watches, cameras, electronic equipment, business samples, recreational equipment.',
   7,
   '{"per_day_usd": 100, "max_days": 3, "max_per_trip_usd": 300, "delay_hours_required": 6, "secondary": true, "claim_window_days": 20, "doc_window_days": 90, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 8. Lost Luggage Reimbursement
  ('insurance',       'lost_luggage_insurance',     'Lost Luggage Reimbursement',
   null, null, 3000, 'per_trip', null,
   'Up to $3,000 per traveler per trip for lost, damaged, or stolen checked or carry-on baggage by a common carrier (NY residents: $2,000 per bag, $10,000 aggregate per trip). Sub-limits: $500 jewelry/watches, $500 cameras/other electronics. Applies when carrier fare was charged to the card. Secondary to other insurance.',
   8,
   '{"max_per_traveler_usd": 3000, "ny_max_per_bag_usd": 2000, "ny_aggregate_per_trip_usd": 10000, "sublimit_jewelry_watches_usd": 500, "sublimit_cameras_electronics_usd": 500, "secondary": true, "claim_window_days": 20, "doc_window_days": 90, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 9. Purchase Protection
  ('protection',      'purchase_protection',        'Purchase Protection',
   null, null, 500, 'per_trip', null,
   'New eligible purchases protected against theft, damage, or involuntary and accidental parting for 120 days from purchase (NY: 90 days). Up to $500 per claim, $50,000 per account. Secondary to homeowners/renters/auto insurance. Excludes animals, plants, antiques, vehicles, computer software, items used for resale, perishables, traveler''s checks/cash/tickets, used items.',
   9,
   '{"coverage_days": 120, "ny_coverage_days": 90, "max_per_claim_usd": 500, "max_per_account_usd": 50000, "secondary": true, "claim_window_days": 90, "doc_window_days": 120, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 10. Extended Warranty Protection
  ('protection',      'extended_warranty',          'Extended Warranty Protection',
   1, 'pct', 10000, 'one_time', null,
   'Adds one additional year to the original manufacturer''s US repair warranty on items charged to the card. Only applies if the original warranty (plus any store/service contract) is 3 years or less. Up to $10,000 per item, $50,000 per account. Excludes vehicles, computer software, medical equipment, items for resale, used items.',
   10,
   '{"additional_years": 1, "max_original_warranty_years": 3, "max_per_item_usd": 10000, "max_per_account_usd": 50000, "claim_window_days": 90, "doc_window_days": 120, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 11. Travel Accident Insurance
  ('insurance',       'travel_accident_insurance',  'Travel Accident Insurance',
   null, null, 500000, 'per_trip', null,
   'Accidental death and dismemberment coverage during travel. $100,000 maximum for 24-Hour Travel Accident (entire trip when carrier fare paid with card); $500,000 maximum for Common Carrier Travel Accident (while riding/entering/exiting common carriers). Pays graduated percentages for specific losses (100% for life or 2 limbs/sights, 50% for one, 25% for thumb+index finger).',
   11,
   '{"twenty_four_hour_max_usd": 100000, "common_carrier_max_usd": 500000, "covered_persons": "cardholder + family member", "claim_window_days": 20, "doc_window_days": 90, "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 12. Roadside Assistance
  ('protection',      'concierge',                  'Roadside Assistance (Pay-Per-Use)',
   null, null, null, 'per_trip', null,
   'Pay-per-use roadside dispatch - 24/7 in the US and Canada. Includes standard 5-mile tow, tire change (must have inflated spare), battery jump or tow to charging station, lockout (no key replacement), 5-gallon fuel delivery, standard winching within 100 feet of paved road. Cardholder pays the per-service fee at dispatch. Light-duty vehicles only (≤10,000 lbs).',
   12,
   '{"included_services": ["tow_5mi","tire_change","battery_jump","lockout","fuel_delivery_5gal","winching_100ft"], "available_24_7": true, "geographic_coverage": "US + Canada", "vehicle_class": "light_duty_under_10k_lbs", "phone": "1-800-349-2634", "cost_model": "pay_per_use", "guide_version": "BGC11359_v2_20241001"}'::jsonb),

  -- 13. Travel and Emergency Assistance Services
  ('protection',      'concierge',                  'Travel and Emergency Assistance Services',
   null, null, null, 'per_trip', null,
   '24/7 referral hotline for emergencies while traveling away from home. Provides arrangement and coordination ONLY - cardholder pays for any actual medical, legal, transportation, or other services. Services include emergency message relay, medical/legal/embassy referral, emergency transportation arrangement, lost ticket replacement assistance, lost luggage locator, translation service, prescription assistance, and pre-trip information.',
   13,
   '{"available_24_7": true, "phone_us": "1-800-349-2634", "phone_intl": "001-214-503-2951", "cost_model": "referral_only_cardholder_pays_actuals", "service_categories": ["message_relay","medical_referral","legal_referral","emergency_transport","ticket_replacement","luggage_locator","translation","prescription_assistance","pre_trip_info"], "guide_version": "BGC11359_v2_20241001"}'::jsonb)
) as b(
  category, benefit_type, name,
  value_amount, value_unit, coverage_amount, frequency, spend_threshold_usd,
  description, sort_order, metadata
)
where c.slug = 'chase-world-of-hyatt';

-- ── Current welcome bonus ────────────────────────────────────────────────

insert into credit_card_welcome_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_required_usd, spend_window_months,
  extras, estimated_value_usd, is_current, source_url, notes
)
select
  c.id,
  60000,
  'World of Hyatt points',
  3000,
  3,
  '30,000 bonus points after $3,000 spend in first 3 months. Plus up to 30,000 more by earning 2x on the first $15,000 in purchases that normally earn 1x, in the first 6 months.',
  1020.00,    -- 60K WoH points × 1.7¢/pt (TPG valuation 2026)
  true,
  'https://creditcards.chase.com/travel-credit-cards/world-of-hyatt-credit-card',
  'Current public offer as of 2026-04-28 (Chase has historically run elevated 75-85K offers; check at next refresh). Two-stage structure. 24-month-rule: not eligible if currently hold this card or received a new-cardmember bonus on it within last 24 months. Account must remain open at least 6 months or Chase reserves right to deduct the bonus.'
from credit_cards c
where c.slug = 'chase-world-of-hyatt';
