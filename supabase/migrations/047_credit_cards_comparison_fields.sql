-- Comparison-tool support: three small additions so the future /cards hub
-- can filter and rank by structured criteria.
--
-- 1. credit_card_benefits.value_estimate_usd
--    Editorial dollar-value estimate per benefit row. Lets the comparison tool
--    sum total benefit value per card and rank "best card for travel benefits."
--    Distinct from coverage_amount (a cap, e.g. "$5K trip cancel ceiling") --
--    value_estimate_usd is realized expected annual value (e.g. "$30/yr expected
--    value of cellphone protection given typical claim rates").
--
-- 2. programs.is_transferable_currency
--    Boolean distinguishing flexible currencies (Chase UR, Amex MR, Citi TY,
--    Cap One miles, Bilt) from co-brand-only currencies (Hyatt, Hilton, Delta).
--    Lets the comparison tool filter "cards that earn flexible points."
--
-- 3. credit_card_benefits.metadata.status_tier_rank (CONVENTION ONLY -- no
--    schema change; documented here so the admin layer enforces it)
--    For benefits in category='status_conferred', metadata MUST include:
--      "status_tier_rank": 1 | 2 | 3 | 4
--    Where:
--      1 = entry  (Hyatt Discoverist, Hilton Silver, Marriott Silver, etc.)
--      2 = mid    (Hyatt Explorist, Hilton Gold, Marriott Gold)
--      3 = high   (Hyatt Globalist, Hilton Diamond, Marriott Platinum)
--      4 = ultra  (Hilton Diamond from Aspire, etc. -- rare)
--    Lets the comparison tool filter "give me at least mid-tier hotel status."
--
-- This migration also backfills value_estimate_usd for the WoH card's existing
-- 13 benefit rows with editorially reasonable starting values (tunable later).

-- ── Schema additions ────────────────────────────────────────────────────

alter table credit_card_benefits
  add column if not exists value_estimate_usd numeric(10,2)
    check (value_estimate_usd is null or value_estimate_usd >= 0);

comment on column credit_card_benefits.value_estimate_usd is
  'Editorial estimate of realized annual value, in USD. Distinct from coverage_amount (a cap). Used by the comparison tool to rank cards by total benefit value. NULL if no value estimable (e.g. concierge, referral services).';

alter table programs
  add column if not exists is_transferable_currency boolean not null default false;

comment on column programs.is_transferable_currency is
  'True for flexible currencies that can transfer to multiple partners (Chase UR, Amex MR, Citi TY, Cap One miles, Bilt). False for co-brand or terminal currencies (Hyatt, Hilton, airline miles).';

create index if not exists programs_transferable_currency_idx
  on programs (is_transferable_currency)
  where is_transferable_currency = true;

-- ── Set is_transferable_currency=true for the flexible-points programs ──
-- Slugs that don't exist in the DB are silent no-ops; safe to re-run.

update programs set is_transferable_currency = true
where slug in (
  'chase-ur',
  'amex-mr',
  'citi-thankyou',
  'capital-one',
  'bilt'
);

-- ── Backfill value_estimate_usd for Chase World of Hyatt benefits ───────
-- Editorial estimates representing realistic expected annual value for a
-- moderate-engagement cardholder. Adjust as data improves. Notes after each
-- value explain the reasoning.

update credit_card_benefits set value_estimate_usd = 250.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'free_night_award';
-- Anniversary Cat 1-4 cert: ~$250 realized. Cat 4 properties retail $200-400/night;
-- $250 is a conservative midpoint assuming most cardholders use it but not always at peak.

update credit_card_benefits set value_estimate_usd = 200.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'free_night_after_spend';
-- $15K-spend cert: $200. Same Cat 1-4 cap, but conditional on $15K spend so realized
-- value is lower (some cardholders never trigger it; others get it but at off-peak dates).

update credit_card_benefits set value_estimate_usd = 30.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'status_hyatt_discoverist';
-- Discoverist: $30. 10% bonus points + 2pm late checkout when available. Modest
-- standalone value; the real prize is using the card to climb to Explorist/Globalist.

update credit_card_benefits set value_estimate_usd = 50.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and name = '5 Tier-Qualifying Night Credits per Calendar Year';
-- 5 TQN credits/yr: $50. Only valuable if pursuing Hyatt status. For the avg user, low.

update credit_card_benefits set value_estimate_usd = 0.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and name = '2 Tier-Qualifying Night Credits per $5,000 Spend';
-- 2 TQN per $5K: no inherent value. Only useful when summed toward status tiers.

update credit_card_benefits set value_estimate_usd = 40.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'rental_car_cdw_secondary';
-- Auto rental CDW: $40. Saves $20-40/day at the rental counter occasionally; secondary
-- in US limits real value but primary internationally is meaningful.

update credit_card_benefits set value_estimate_usd = 5.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'baggage_delay_insurance';
-- Baggage delay: $5. Rarely triggers (6h+ delay) and the $300 cap is shallow.

update credit_card_benefits set value_estimate_usd = 5.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'lost_luggage_insurance';
-- Lost luggage: $5. Rare event; $3K cap.

update credit_card_benefits set value_estimate_usd = 20.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'purchase_protection';
-- Purchase protection: $20. Occasional small claims add up over the year.

update credit_card_benefits set value_estimate_usd = 30.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'extended_warranty';
-- Extended warranty: $30. Modest value, mostly on big-ticket electronics or appliances.

update credit_card_benefits set value_estimate_usd = 5.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and benefit_type = 'travel_accident_insurance';
-- Travel accident insurance: $5. High cap but morbid trigger; basically a free add-on.

update credit_card_benefits set value_estimate_usd = 0.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and name = 'Roadside Assistance (Pay-Per-Use)';
-- Roadside (pay-per-use): $0. Cardholder pays the dispatch fee; the only real benefit
-- is access to a vetted provider. No realized $$ value.

update credit_card_benefits set value_estimate_usd = 5.00
  where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
    and name = 'Travel and Emergency Assistance Services';
-- T&E Assistance: $5. Referral-only, cardholder pays for actuals. Convenience only.

-- ── Backfill status_tier_rank in metadata for Discoverist ───────────────

update credit_card_benefits
set metadata = metadata || '{"status_tier_rank": 1}'::jsonb
where card_id = (select id from credit_cards where slug = 'chase-world-of-hyatt')
  and benefit_type = 'status_hyatt_discoverist';
-- Discoverist = entry tier (rank 1). Hyatt's tiers: Discoverist (1), Explorist (2),
-- Globalist (3), Lifetime Globalist (4-equivalent).
