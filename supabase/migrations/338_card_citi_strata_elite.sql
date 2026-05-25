-- Citi Strata Elite Card — full card-page seed.
--
-- Source of truth: Citi's own product page + Schumer box / cardmember terms
-- (pasted in editor session 2026-05-25). All claims trace to issuer text.
--
-- Editorial framing: the structural advantage of this card is that Citi
-- ThankYou is THE ONLY major flexible-currency points program that transfers
-- to American Airlines AAdvantage at 1:1 (cross-verified across Roame, TPG,
-- NerdWallet 2026 articles). Chase UR, Amex MR, Cap One Miles, Wells Fargo,
-- and Bilt do not transfer to AAdvantage. Combined with 4 annual Admirals
-- Club passes and Priority Pass, this is a card built around AA loyalists
-- and points-to-AA strategy.
--
-- The 75,000-point welcome bonus is the current standard ongoing offer
-- (not elevated — launch was 80k/$4k, expired limited-time was 100k/$6k).
-- See ti and offer notes below; refresh on next review if elevated returns.

-- ── 1. Card row ─────────────────────────────────────────────────────────
-- Row was previously seeded as a skeleton (migration 050). Use ON CONFLICT
-- DO UPDATE to populate the empty fields with the full content.

insert into credit_cards (
  slug, issuer_id, name, intro, official_url,
  annual_fee_usd, card_type, card_tier,
  currency_program_id, co_brand_program_id,
  foreign_transaction_fee_pct, chase_5_24_subject, credit_score_recommended,
  tags, intended_user, is_active, last_verified,
  good_to_know
)
select
  'citi-strata-elite',
  i.id,
  'Citi Strata Elite Card',
  'The Strata Elite is the only mass-market premium card that converts flexible points to American Airlines AAdvantage at 1:1 - that single fact does most of the work for points-and-miles spenders. Pair AA access with 17+ other ThankYou transfer partners (Avianca, Turkish, Virgin Atlantic, Singapore, Flying Blue, Qatar Avios), 4 annual Admirals Club day passes, complimentary Priority Pass Select, and a $300 annual hotel credit booked through Citi Travel, and the $595 fee math works for travelers who actually fly American or book paid hotel nights through Citi''s portal. The 6x dining bonus on Citi Nights (Friday and Saturday evenings) is the quietest sweet spot - 6x earning on dinner out is rare outside Amex Gold''s capped restaurant bonus. The catch: a 48-month family-rule lockout on the welcome bonus is among the strictest in the industry; if you''ve had this card or product-converted from another Citi card with a bonus in the past 4 years, no SUB for you.',
  'https://www.citi.com/credit-cards/citi-strata-elite-credit-card',
  595,
  'personal',
  'premium',
  tp.id,    -- currency_program_id = citi-thankyou
  null,     -- co_brand_program_id (this is NOT a co-brand)
  0.00,
  false,    -- Citi has its own 48-month rule, not Chase 5/24
  'excellent',
  ARRAY['premium','travel','aa_transfer','admirals_club','priority_pass']::text[],
  ARRAY['frequent_aa_flyers','points_optimizers','priority_pass_seekers']::text[],
  true,
  '2026-05-25',
  '- The welcome bonus has a 48-month family rule - the strictest in the industry. No bonus if you received a Strata Elite bonus in the last 48 months OR product-converted from another Citi card on which you earned a bonus in the last 48 months.
- Citi Travel earn rates (12x hotels/cars/attractions, 6x airfare) ONLY apply when booked through cititravel.com - direct hotel/airline bookings earn 1.5x.
- Citi Nights 6x restaurant bonus runs Friday 6 PM ET through Saturday 6 AM ET, and Saturday 6 PM through Sunday 6 AM. Based on authorization time, not posting date - a Friday 8 PM dinner that posts Monday still earns 6x.
- The $300 Annual Hotel Benefit requires a 2-night minimum stay AND prepayment via Citi Travel; the portion of the purchase offset by the benefit does not earn points.
- 4 Admirals Club passes are calendar-year (not cardholder-year), and the primary cardmember must be present with each accompanying adult.
- Splurge Credit requires merchant activation via citi.com/splurgecredit - purchases at non-activated merchants do not earn the credit even if the merchant is on the eligible list.
- Authorized user fee is $75 each - cheap by premium-card standards (Chase Sapphire Reserve, Amex Platinum charge $195+).
- Citigold relationship credit effectively rebates $145 of the $595 annual fee if you bank with Citi; Citigold Private Client gets a $595 first-year credit plus $145 each year after, essentially comping the AF.
- Citi ThankYou is the only major flexible-currency program with a 1:1 transfer to American Airlines AAdvantage - this is the structural reason this card matters for points strategy.'
from issuers i
cross join (select id from programs where slug = 'citi-thankyou') tp
where i.slug = 'citi'
on conflict (slug) do update set
  issuer_id = excluded.issuer_id,
  name = excluded.name,
  intro = excluded.intro,
  official_url = excluded.official_url,
  annual_fee_usd = excluded.annual_fee_usd,
  card_type = excluded.card_type,
  card_tier = excluded.card_tier,
  currency_program_id = excluded.currency_program_id,
  co_brand_program_id = excluded.co_brand_program_id,
  foreign_transaction_fee_pct = excluded.foreign_transaction_fee_pct,
  chase_5_24_subject = excluded.chase_5_24_subject,
  credit_score_recommended = excluded.credit_score_recommended,
  tags = excluded.tags,
  intended_user = excluded.intended_user,
  is_active = excluded.is_active,
  last_verified = excluded.last_verified,
  good_to_know = excluded.good_to_know,
  updated_at = now();

-- ── 2. Earn rates ────────────────────────────────────────────────────────
-- Delete existing rows first so the migration is safely re-runnable.

delete from credit_card_earn_rates
 where card_id = (select id from credit_cards where slug = 'citi-strata-elite');

insert into credit_card_earn_rates (card_id, category, multiplier, booking_channel, notes)
select c.id, x.category, x.multiplier, x.booking_channel, x.notes
from credit_cards c
cross join (values
  ('hotels_cars_attractions_portal', 12.0, 'portal',
   'Hotels, car rentals, and attractions booked through Citi Travel (cititravel.com). Direct bookings at hotels or rental agencies earn the base 1.5x.'),
  ('airfare_portal',                  6.0, 'portal',
   'Air travel booked through Citi Travel (cititravel.com). Direct airline bookings earn 1.5x.'),
  ('dining_citi_nights',              6.0, 'any',
   'Restaurants on Citi Nights: Friday 6 PM ET through Saturday 6 AM ET, and Saturday 6 PM through Sunday 6 AM ET. Based on transaction authorization time, not posting date. Includes cafes, bars, lounges, fast-food, delivery, takeout. Excludes bakeries, caterers, and restaurants located inside another business.'),
  ('dining_other',                    3.0, 'any',
   'Restaurants at any other time outside Citi Nights. Same MCC exclusions as the Citi Nights tier.'),
  ('everything_else',                 1.5, 'any',
   'All other purchases.')
) as x(category, multiplier, booking_channel, notes)
where c.slug = 'citi-strata-elite';

-- ── 3. Benefits ──────────────────────────────────────────────────────────
-- All benefits sourced from Citi cardmember terms and Schumer box.
-- Delete existing rows first so the migration is safely re-runnable.

delete from credit_card_benefits
 where card_id = (select id from credit_cards where slug = 'citi-strata-elite');

insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  value_amount, value_unit, coverage_amount, frequency, spend_threshold_usd,
  description, sort_order, metadata
)
select
  c.id, b.category, b.benefit_type, b.name,
  b.value_amount, b.value_unit, b.coverage_amount, b.frequency, b.spend_threshold_usd::numeric,
  b.description, b.sort_order, b.metadata
from credit_cards c
cross join (values

  -- 1. Annual Hotel Benefit
  ('travel_credit', 'hotel_credit', 'Up to $300 Annual Hotel Benefit',
   300, 'USD', 300, 'annual', null,
   'Once per calendar year, up to $300 off a hotel stay of 2 nights or more booked via Citi Travel (cititravel.com). Requires prepayment with the Strata Elite Card, ThankYou Points, or a combination. The portion of the purchase offset by the benefit does not earn points. Cannot be combined with the Citi Prestige 4th-night benefit in the same transaction, or with other promotions on thankyou.com. Package rates (air + hotel, hotel + car) do not qualify. If a reservation is canceled, the benefit returns to the account for use within the same calendar year.',
   1,
   '{"min_nights": 2, "booking_channel": "cititravel_only", "annual_period": "calendar", "no_points_on_offset_portion": true, "excluded_rates": ["air_hotel_package","hotel_car_package"]}'::jsonb),

  -- 2. Splurge Credit
  ('statement_credit', 'other', 'Up to $200 Annual Splurge Credit',
   200, 'USD', 200, 'annual', null,
   'Up to $200 in statement credits each calendar year for purchases at activated Splurge Credit merchants. Choose up to 2 merchants from: 1stDibs, American Airlines, Best Buy, Future Personal Training, Live Nation. Merchant must be activated at citi.com/splurgecredit at time of purchase authorization. AA Splurge purchases exclude car rentals, hotels, AAdvantage status boosts, and AA Cargo. Live Nation/Ticketmaster purchases must be made directly on livenation.com or ticketmaster.com (not via third-party resellers) and only US/territory events qualify.',
   2,
   '{"max_merchants_activated": 2, "eligible_merchants": ["1stDibs","American Airlines","Best Buy","Future Personal Training","Live Nation"], "activation_required": true, "activation_url": "citi.com/splurgecredit", "aa_exclusions": ["car_rentals","hotels","aadvantage_status_boost","aa_cargo"]}'::jsonb),

  -- 3. Blacklane chauffeur credit
  ('statement_credit', 'other', 'Up to $200 Annual Blacklane Credit',
   200, 'USD', 200, 'annual', null,
   'Up to $200 in annual statement credits toward Blacklane premium chauffeur service: up to $100 for purchases with a sale date January through June, and up to $100 for purchases July through December. Purchases must be made directly through the Blacklane app or blacklane.com. Unused portion of a $100 half-year credit can roll within that same half-year. Credits are based on Blacklane''s submitted sale date, not service date.',
   3,
   '{"split_period": "semiannual", "h1_max_usd": 100, "h2_max_usd": 100, "booking_channel": "blacklane_app_or_website_only"}'::jsonb),

  -- 4. Priority Pass Select
  ('lounge_access', 'lounge_priority_pass', 'Priority Pass Select Membership',
   469, 'USD', null, 'annual', null,
   'Complimentary Priority Pass Select membership for primary cardmember and authorized users. Access to 1,500+ airport lounges worldwide; restaurant/cafe/market benefits in the Priority Pass network are NOT included (lounge access only). Up to 2 guests per visit included; additional guests $35 each. Some lounges may have admission restrictions or guest limits.',
   4,
   '{"lounge_count": 1500, "guests_included": 2, "guest_fee_usd": 35, "restaurants_included": false, "valued_at_usd": 469}'::jsonb),

  -- 5. Admirals Club Passes
  ('lounge_access', 'lounge_other', '4 Admirals Club Citi Strata Elite Passes',
   null, null, null, 'annual', null,
   'Four digital Admirals Club Citi Strata Elite Passes per calendar year, redeemable at any of ~50 Admirals Club lounges. Citi values the set at $300+. Each pass: primary cardmember must be present; up to 3 children under 18 traveling with the primary may also enter without redeeming a pass; once redeemed a pass is valid for 24 hours and can be used at multiple locations. Requires same-day boarding pass on AA, oneworld carrier, or Alaska Airlines. Passes not redeemed by December 31 are forfeited.',
   5,
   '{"passes_per_year": 4, "valid_hours_after_redemption": 24, "eligible_carriers": ["American Airlines","oneworld","Alaska Airlines"], "children_under_18_free_with_adult": 3, "annual_period": "calendar", "issuance_year": "calendar", "valued_at_usd": 300}'::jsonb),

  -- 6. Global Entry / TSA PreCheck Credit
  ('statement_credit', 'global_entry_credit', 'Global Entry or TSA PreCheck Application Credit',
   120, 'USD', 120, 'one_time', null,
   'Up to $120 statement credit every 4 years toward Global Entry or TSA PreCheck application fee. Application fee must be charged to the Strata Elite Card. Credit applies to whichever program (GE or PreCheck) is charged first; approval is not required to receive the credit.',
   6,
   '{"reimbursement_window_years": 4, "eligible_programs": ["Global Entry","TSA PreCheck"], "approval_not_required": true}'::jsonb),

  -- 7. Citigold relationship credit
  ('statement_credit', 'other', 'Citigold Banking Relationship Credit',
   145, 'USD', 145, 'annual', null,
   'For Citigold-tier deposit customers (not Citigold Private Client): a $145 statement credit each year the Annual Membership Fee is assessed. Primary cardmember must own an open Citigold deposit account on the date the AF posts. New Citigold customers must meet balance requirements for 3 consecutive months to up-tier. Effectively rebates a portion of the $595 annual fee.',
   7,
   '{"requires_relationship": "citigold", "first_year_credit_usd": 145, "ongoing_annual_credit_usd": 145, "deposit_balance_requirement_months": 3}'::jsonb),

  -- 8. Citigold Private Client first-year refund
  ('statement_credit', 'other', 'Citigold Private Client First-Year + Annual Credit',
   595, 'USD', 595, 'annual', null,
   'For Citigold Private Client (CPC) deposit customers: a $595 first-year banking relationship credit and a $145 credit each year thereafter. Effectively comps the annual fee in year 1 and rebates $145 each year after. Requires the primary cardmember to own an open CPC-tier deposit account on the date the AF posts.',
   8,
   '{"requires_relationship": "citigold_private_client", "first_year_credit_usd": 595, "ongoing_annual_credit_usd": 145}'::jsonb),

  -- 9. The Reserve by Citi Travel
  ('travel_credit', 'hotel_credit', 'The Reserve by Citi Travel Benefits',
   100, 'USD', null, 'per_use', null,
   'When booking The Reserve hotel rates via Citi Travel: $100 on-property experience credit (form varies by hotel), room upgrade subject to availability, daily breakfast for two, complimentary Wi-Fi, early check-in and late check-out subject to availability. Available to Strata Elite, Strata Premier, and Prestige cardmembers. Back-to-back stays within 24 hours at the same hotel count as one stay; benefits awarded once per stay; unused $100 credit forfeited if not consumed.',
   9,
   '{"booking_channel": "cititravel_reserve_rates", "experience_credit_usd": 100, "available_to": ["strata_elite","strata_premier","prestige"], "amenities": ["room_upgrade","breakfast_for_two","wifi","early_checkin","late_checkout"]}'::jsonb),

  -- 10. Hotel Collection (lower tier)
  ('travel_credit', 'hotel_credit', 'Citi Travel Hotel Collection Benefits',
   null, null, null, 'per_use', null,
   'When booking Hotel Collection rates via Citi Travel: daily breakfast for two, complimentary Wi-Fi, early check-in and late check-out subject to availability. Available to all Strata Elite cardmembers and any other Citi cardmember with Citi Travel access. Per-stay basis. Benefits do not stack with other promotions on the same booking.',
   10,
   '{"booking_channel": "cititravel_hotel_collection_rates", "amenities": ["breakfast_for_two","wifi","early_checkin","late_checkout"]}'::jsonb),

  -- 11. Travel and purchase insurance bundle
  ('insurance', 'other', 'Travel and Purchase Protection Bundle',
   null, null, null, 'per_trip', null,
   'Mastercard / New Hampshire Insurance Company (AIG) bundle: Trip Delay Protection, Enhanced Trip Cancellation and Trip Interruption Protection, Lost or Damaged Luggage, MasterRental Coverage (car rental insurance), Extended Warranty, and Purchase Assurance Plus. Coverage is secondary except MasterRental which is primary outside the cardholder''s country of residence. Specific limits and exclusions in the Guide to Protection Benefits provided with the card.',
   11,
   '{"underwriter": "New Hampshire Insurance Company (AIG)", "coverage_type": "secondary_except_masterrental_outside_us", "components": ["trip_delay","trip_cancellation","trip_interruption","lost_damaged_luggage","masterrental_cdw","extended_warranty","purchase_assurance"]}'::jsonb)

) as b(
  category, benefit_type, name,
  value_amount, value_unit, coverage_amount, frequency, spend_threshold_usd,
  description, sort_order, metadata
)
where c.slug = 'citi-strata-elite';

-- ── 4. Welcome bonus ─────────────────────────────────────────────────────
-- Delete existing rows first so the migration is safely re-runnable.

delete from credit_card_welcome_bonuses
 where card_id = (select id from credit_cards where slug = 'citi-strata-elite');

insert into credit_card_welcome_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_required_usd, spend_window_months,
  extras, estimated_value_usd, is_current, source_url, notes
)
select
  c.id,
  75000,
  'ThankYou Points',
  6000,
  3,
  null,
  1275.00,  -- 75K TY x 1.7 cpp (TPG 2026 valuation); conservative given AA transfer access
  true,
  'https://www.citi.com/credit-cards/citi-strata-elite-credit-card',
  'Current standard ongoing offer as of 2026-05-25 - this is the floor, not an elevated offer. Card launched with an 80,000-point bonus at $4,000 spend; a limited-time 100,000-point bonus at $6,000 spend appeared briefly and expired. Watch for higher offers periodically. 48-MONTH FAMILY RULE: no bonus if you received a new-account bonus on Strata Elite in the past 48 months, OR if you product-converted from another Citi credit card on which you earned a new-account bonus in the last 48 months - one of the strictest restrictions in the points space.'
from credit_cards c
where c.slug = 'citi-strata-elite';
