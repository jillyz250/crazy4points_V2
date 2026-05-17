-- Ink Business Preferred — corrections after Copilot fact-check (2026-05-17)
--
-- Findings:
-- 1. The "$10/quarter non-restaurant DoorDash credit" we added does NOT
--    exist as a separate benefit. Chase's DashPass terms page makes it
--    clear there's only ONE credit: $10/month on one qualifying
--    non-restaurant order. The product page's "$10 a month on grocery
--    and retail" copy is shorthand for the same benefit; "grocery and
--    retail" are subcategories within "non-restaurant."
--
-- 2. Missing benefit: 25% travel redemption uplift when redeeming UR
--    points for travel through the Chase Ultimate Rewards portal. This
--    is an Ink Preferred / Sapphire Preferred-tier perk; the Freedom
--    cards and Ink Cash/Unlimited do NOT get the uplift.

-- 1. Remove the bogus $10/quarter non-restaurant credit row.
delete from credit_card_benefits
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-preferred')
   and name = 'DoorDash $10 Quarterly Non-Restaurant Credit';

-- 2. Update the existing $10/month credit's description to be accurate.
--    "Grocery and retail" was misleading shorthand; the real eligibility
--    is "any qualifying non-restaurant order" (which includes grocery,
--    convenience, retail, liquor, etc. but excludes restaurants + Caviar).
update credit_card_benefits
   set description = 'Once you activate DashPass, get $10 off each calendar month on one qualifying non-restaurant DoorDash order. Qualifying merchants include grocery (Wegmans, Sprouts, etc.), convenience stores (7-Eleven, Wawa), retail (PetSmart, Sephora, DICK''s), liquor stores, flowers, and beauty — anything non-restaurant on DoorDash. Restaurants and Caviar do NOT qualify. Applies to subtotal only (excludes fees, taxes, gratuity). Discount must be used on a single order; unused portion is forfeited.',
       name = 'DoorDash $10/Month Non-Restaurant Credit',
       metadata = '{"qualifying_categories":["grocery","convenience","retail","liquor","flowers","beauty"],"excluded":["restaurants","caviar"],"requires_dashpass":true,"subtotal_only":true,"one_order_per_month":true}'::jsonb,
       verified_at = now(),
       verified_source_url = 'https://creditcards.chase.com/business-credit-cards/ink/business-preferred'
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-preferred')
   and (name = 'DashPass $10/month DoorDash Non-Restaurant Credit'
        or name = 'DoorDash Non-Restaurant Order Credit'
        or name = 'DashPass $10/Month Grocery & Retail Credit');

-- 3. Add Chase Points Boost (the CURRENT redemption mechanic).
--    NOTE: The flat 25% portal uplift that Ink Preferred and Sapphire Preferred
--    historically offered was REMOVED in 2025 and replaced by Points Boost.
--    Existing cardholders / pre-June-23-2025 applications are grandfathered
--    at 1.25 cpp through Oct 26, 2027 — but new applicants get the baseline
--    1 cpp + opportunistic Points Boost uplift on select flights/hotels.
--    Do NOT re-add the flat 25% benefit; that's a regression.
insert into credit_card_benefits (
  card_id, category, benefit_type, name,
  value_amount, value_unit, frequency,
  description, sort_order, metadata,
  verified_at, verified_source_url
) values (
  (select id from credit_cards where slug = 'chase-ink-business-preferred'),
  'portal_redemption', 'portal_redemption_bonus',
  'Chase Points Boost (Variable Travel Redemption Uplift)',
  null, null, 'lifetime',
  'When redeeming Ultimate Rewards points for travel through the Chase Travel portal, eligible Points Boost flights and hotels get a variable point-value uplift — up to 1.75 cents per point on premium airfare, up to 1.5 cents per point on hotels. Boost availability is selective (frequent-miler analysis found ~9% of flights eligible). All other portal redemptions are 1 cent per point baseline. NOTE: existing cardholders and applications before June 23, 2025 retain the legacy 1.25 cpp redemption on travel through October 26, 2027 — for those users, redemption value can be higher than the 1 cpp baseline shown to new applicants. Transferring points to airline/hotel partners remains the highest-value option for most travelers.',
  5,
  '{"baseline_cpp":1.0,"boost_cpp_max":1.75,"boost_availability_estimate_pct":9,"grandfathered_cpp":1.25,"grandfathered_cutoff_date":"2027-10-26"}'::jsonb,
  now(),
  'https://creditcards.chase.com/business-credit-cards/ink/business-preferred'
);
