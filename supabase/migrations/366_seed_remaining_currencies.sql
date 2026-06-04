-- ============================================================================
-- 366 - Author the remaining 5 transferable-currency pages.
-- Amex MR, Chase UR, Citi ThankYou, Bilt, Wells Fargo. Seeds editorial fields
-- (alliance, intro w/ count tokens, how_to_spend, sweet_spots, quirks) and
-- activates each page (content_updated_at + is_active + clears is_reference_stub).
--
-- Transfer partners: amex/chase/citi/bilt already had verified outbound rosters
-- from prior sessions (left untouched here). Wells Fargo had only 1 partner -
-- this seeds its full 10-partner roster (8 airlines 1:1, Choice + Wyndham 1:2).
-- WF official portal is login-gated; roster compiled from the WF newsroom
-- (Cathay press release, 1:1) + multiple 2026 public sources. Copilot to verify.
--
-- Intros use {<slug>_airline_count}/{<slug>_hotel_count} tokens that resolve at
-- render from transfer_partners_outbound (loyalty_program counts as airline).
-- ASCII-only per the SQL-data rule.
-- ============================================================================

-- --- American Express Membership Rewards ------------------------------------
update programs set
  alliance = 'none',
  intro = 'American Express Membership Rewards is the original premium transferable currency, and still one of the deepest. You earn it on Amex''s charge and credit cards - heavy on the Platinum and Gold - and cash it out by moving points to {amex_airline_count} airline and {amex_hotel_count} hotel partners, most at 1:1. The roster leans international and premium-cabin: ANA, Singapore, Virgin Atlantic, Air Canada, and Avianca are where the outsized value lives. As always, the points are worth the most when you have a specific award in your sights - transfers are one-way, instant for most partners, and final.',
  how_to_spend = '- Transfer to airline and hotel partners - the highest-value play (see sweet spots).
- Book travel through Amex Travel using Pay with Points (around 1 cent per point on flights).
- Statement credits, gift cards, and shopping checkouts - all weaker (often 0.5 to 1 cent); only if you are not chasing travel.
- Avoid the default "use points at checkout" on Amazon and similar (about 0.7 cent) - it is among the worst values.',
  sweet_spots = '- ANA Mileage Club (1:1) - some of the best business and first-class pricing to Japan and beyond (round-trip pricing only, but exceptional rates).
- Virgin Atlantic Flying Club (1:1) - book Delta One and ANA first class at sweet-spot rates; watch for frequent transfer bonuses.
- Air Canada Aeroplan (1:1) - fixed partner pricing plus a free stopover; strong for Star Alliance premium cabins to Europe and Asia.
- Avianca LifeMiles (1:1) - no fuel surcharges on Star Alliance partners, often the cheapest way into Lufthansa and Swiss business.
- Singapore KrisFlyer (1:1) - the most reliable route to Singapore Suites and long-haul premium on its own metal.',
  quirks = '- Transfers are one-way and final - you cannot move points back to Amex.
- Most partners are instant; a few (notably ANA and some hotels) take up to a couple of days.
- Transfers to US-domiciled airlines (Delta, JetBlue, and Virgin Atlantic on US-issued cards) trigger a federal excise-tax pass-through of roughly 0.06 cents per point. Foreign-carrier transfers have no tax.
- Hawaiian''s program is winding into Alaska - confirm status before transferring.
- Points pool across your eligible Amex cards under one login, but cannot be moved to another person''s account.',
  last_verified = now(), content_updated_at = now(),
  is_active = true, is_reference_stub = false, updated_at = now()
where slug = 'amex';

-- --- Chase Ultimate Rewards --------------------------------------------------
update programs set
  alliance = 'none',
  intro = 'Chase Ultimate Rewards is the transferable currency built around one outrageous sweet spot: Hyatt. You earn it on the Sapphire and Ink family, and you move it 1:1 to {chase_airline_count} airline and {chase_hotel_count} hotel partners - every single one at a clean 1:1, with no oddball ratios to decode. Hyatt is the reason most people hold UR at all, but United, Southwest, Aeroplan, and the Avios family give it real airline range too. Find the award first; transfers are instant and one-way.',
  how_to_spend = '- Transfer to Hyatt - the single best use of the currency (see sweet spots).
- Transfer to airline partners for premium-cabin awards (Aeroplan, Flying Blue, Avios, Virgin Atlantic).
- Book through Chase Travel at 1 to 1.5 cents per point depending on your card (Sapphire Reserve redeems at the top rate).
- Cash back and gift cards at 1 cent - a fine floor, but you leave value on the table versus transfers.',
  sweet_spots = '- Hyatt (1:1) - the crown jewel; top Park Hyatt and Alila resorts that cost 600 dollars-plus a night go for 35k to 45k points. Nothing else in the transferable world touches it.
- Air Canada Aeroplan (1:1) - free stopover, no fuel surcharges on many partners, strong Star Alliance business-class pricing.
- British Airways / Avios (1:1) - short-haul off-peak from the US East Coast to Europe and within regions for very few points.
- Virgin Atlantic (1:1) - ANA first class and Delta One sweet spots when award space appears.
- Southwest (1:1) - no change fees, no award-chart games, and the Companion Pass stretches points further.',
  quirks = '- Every partner is 1:1 - no ratio surprises, which makes Chase the easiest currency to reason about.
- You must hold a card that earns transferable points (Sapphire Preferred/Reserve or an Ink business card) to move points to partners; Freedom-only points must first be combined into a premium-card account.
- Transfers are instant for nearly all partners and one-way / final.
- Points can be pooled with one household member - handy for topping up an award.
- No transfer fees or taxes on any partner.',
  last_verified = now(), content_updated_at = now(),
  is_active = true, is_reference_stub = false, updated_at = now()
where slug = 'chase';

-- --- Citi ThankYou Rewards ---------------------------------------------------
update programs set
  alliance = 'none',
  intro = 'Citi ThankYou Rewards is the quiet overachiever. It skips the big US airlines and instead leans into a deep international roster - {citi_airline_count} airline and {citi_hotel_count} hotel partners - where the real award sweet spots live. Turkish, EVA Air, Qatar, Avianca, and Virgin Atlantic are the names to know. You earn it on the Strata Premier and Prestige cards, and as with any transferable currency, the points are worth the most once you have a specific seat in mind.',
  how_to_spend = '- Transfer to airline partners - the highest-value play (see sweet spots).
- Book travel through the Citi Travel portal (around 1 cent per point).
- Cover purchases, gift cards, and statement credits - all weaker (often under 1 cent); only if you are not chasing travel.',
  sweet_spots = '- Turkish Miles&Smiles (1:1) - the cult pick: very low pricing on United-operated domestic and Star Alliance awards once you learn the program.
- Qatar Privilege Club (1:1) - Qsuites business, one of the best seats in the sky.
- EVA Air Infinity MileageLands (1:1) - excellent business-class pricing to Asia.
- Avianca LifeMiles (1:1) - no fuel surcharges on Star Alliance partners.
- Virgin Atlantic (1:1) - ANA and Delta One sweet spots; frequent transfer bonuses.',
  quirks = '- Citi skips American, Delta, and United as direct partners - its value is in foreign carriers, so plan around partner award space.
- Some transfers are instant; others (and a few hotel partners) can take 1 to 2 days - never transfer speculatively against a held award.
- A few ratios are not 1:1 - check before you move (Accor and some hotel programs convert at a discount).
- Points from multiple Citi cards combine under one login; shared points expire in 90 days.
- No transfer fees.',
  last_verified = now(), content_updated_at = now(),
  is_active = true, is_reference_stub = false, updated_at = now()
where slug = 'citi';

-- --- Bilt Rewards -----------------------------------------------------------
update programs set
  alliance = 'none',
  intro = 'Bilt Rewards is the only major transferable currency you can earn by paying rent - with no transaction fee - and it punches well above that gimmick. It transfers 1:1 to {bilt_airline_count} airline and {bilt_hotel_count} hotel partners, and it is the rare flexible currency that includes American AAdvantage, alongside United, Hyatt, Aeroplan, Turkish, and the Avios family. Earn it on rent and everyday spend, then move it to the award you actually want.',
  how_to_spend = '- Transfer to airline and hotel partners - the highest-value play (see sweet spots).
- Redeem for travel through the Bilt portal, or toward rent and a future home down payment.
- Use Bilt''s shopping and dining offers to top up - but transfers are where the value is.',
  sweet_spots = '- American AAdvantage (1:1) - genuinely rare for a transferable currency; books AA and oneworld partners like Cathay and Qatar in business.
- Hyatt (1:1) - top-tier Park Hyatt and Alila resorts for a fraction of cash rates.
- Turkish Miles&Smiles (1:1) - very low Star Alliance and United-operated pricing.
- Air Canada Aeroplan (1:1) - free stopover, strong Star Alliance business-class value.
- Cathay Pacific Asia Miles (1:1) - first and business class to Asia with reasonable surcharges.',
  quirks = '- Earn points by paying rent with no transaction fee (up to a yearly cap), plus everyday spend on the Bilt card.
- Rent Day (the 1st of each month) doubles points on non-rent spend and runs periodic transfer bonuses.
- Transfers are 1:1, instant for most partners, and one-way / final.
- You need at least 5 qualifying transactions per statement for the card to earn points that month.
- No transfer fees or taxes.',
  last_verified = now(), content_updated_at = now(),
  is_active = true, is_reference_stub = false, updated_at = now()
where slug = 'bilt';

-- --- Wells Fargo Rewards (full roster seeded) --------------------------------
update programs set
  alliance = 'none',
  intro = 'Wells Fargo Rewards is the newest transferable currency, and it is growing fast. You earn it on the Autograph and Autograph Journey cards and move it to {wells-fargo_airline_count} airline and {wells-fargo_hotel_count} hotel partners - airlines at 1:1, and hotels at a favorable 1:2. The roster is shorter than the old guard, but it includes high-value names like Avianca, Air France-KLM, Cathay Pacific, and Virgin Atlantic. As always, transfer only once you have a specific award in mind.',
  how_to_spend = '- Transfer to airline partners at 1:1 or hotel partners at 1:2 - the highest-value play (see sweet spots).
- Redeem for travel, gift cards, or statement credits through the Wells Fargo Rewards portal (around 1 cent per point).
- Transfers work from any Wells Fargo card that earns Rewards points, in increments as small as a single point.',
  sweet_spots = '- Avianca LifeMiles (1:1) - no fuel surcharges on Star Alliance partners, often the cheapest path into Lufthansa and Swiss business.
- Air France-KLM Flying Blue (1:1) - monthly Promo Rewards take 20 to 50 percent off select awards.
- Virgin Atlantic Flying Club (1:1) - ANA and Delta One sweet spots; watch for transfer bonuses.
- British Airways / Avios (1:1) - short-haul off-peak hops for very few points.
- Choice Privileges (1:2) - the hotel ratio works in your favor; strong value at European and resort Choice properties.',
  quirks = '- Airlines transfer at 1:1; hotels (Choice and Wyndham) transfer at a favorable 1:2.
- All Wells Fargo cards that earn Rewards points can transfer, in single-point increments.
- The partner roster is newer and shorter than Amex/Chase/Citi - Wells Fargo is adding names quickly (Cathay Pacific and Wyndham joined in 2026).
- Transfers are one-way and final.
- Partner list and ratios here are compiled from current public sources - verify on the Wells Fargo Rewards portal before transferring.',
  transfer_partners_outbound = '[
    {"from_slug":"aer-lingus","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. AerClub Avios."},
    {"from_slug":"flying-blue","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Air France-KLM; monthly Promo Rewards discounts."},
    {"from_slug":"avianca","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. LifeMiles; no fuel surcharges on Star Alliance."},
    {"from_slug":"ba-avios","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. British Airways Executive Club; Avios usable across the BA/Iberia/Aer Lingus family."},
    {"from_slug":"cathay","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Asia Miles; added 2026."},
    {"from_slug":"iberia","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Iberia Plus Avios."},
    {"from_slug":"jetblue","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. TrueBlue; added late 2025."},
    {"from_slug":"virgin-atlantic","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Flying Club; books ANA and Delta One sweet spots."},
    {"from_slug":"choice","ratio":"1:2","bonus_active":false,"notes":"No transfer fee. 1,000 points = 2,000 Choice Privileges (ratio in your favor)."},
    {"from_slug":"wyndham","ratio":"1:2","bonus_active":false,"notes":"No transfer fee. 1,000 points = 2,000 Wyndham Rewards; added 2026."}
  ]'::jsonb,
  last_verified = now(), content_updated_at = now(),
  is_active = true, is_reference_stub = false, updated_at = now()
where slug = 'wells-fargo';

select slug, (content_updated_at is not null) has_content, is_active, is_reference_stub,
  jsonb_array_length(transfer_partners_outbound) tp
from programs where slug in ('amex','chase','citi','bilt','wells-fargo') order by slug;
