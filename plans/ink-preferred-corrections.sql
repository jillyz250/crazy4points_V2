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

-- 3. Removed: the "Points Boost" insert that was here previously came from
--    a WebSearch summary of frequent-miler / nerdwallet articles, not from
--    a Chase-authoritative URL. Per the data-source policy in
--    plans/card-data-source-policy.md, third-party sources are not
--    acceptable for card facts. If Points Boost should be on the page,
--    re-add it via an extraction that scrapes a Chase URL describing it.
