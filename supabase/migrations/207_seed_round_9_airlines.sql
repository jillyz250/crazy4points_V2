-- Round 9 batch: 9 airline / discount-club program pages (Tier D long-tail).
-- Each page draft was researched via WebSearch + cross-checked against
-- official program pages where available. Hedges and verify-before-publish
-- notes are inline.
--
-- Round 9 programs (Tier D - long-tail; Czech OK Plus DEFUNCT, skipped):
--   bulgaria-air, wizz-air, airasia, air-india-express, norwegian,
--   indigo, bamboo, air-tahiti-nui, jetsmart

-- ============================================================
-- PREP: ensure skeleton rows exist for the 9 new slugs
-- ============================================================
insert into programs (slug, type, name) values
  ('bulgaria-air', 'loyalty_program', 'Bulgaria Air FlyMore'),
  ('wizz-air', 'loyalty_program', 'Wizz Discount Club'),
  ('airasia', 'loyalty_program', 'airasia rewards'),
  ('air-india-express', 'loyalty_program', 'Air India Express'),
  ('norwegian', 'loyalty_program', 'Norwegian Reward CashPoints'),
  ('indigo', 'loyalty_program', 'IndiGo BluChip'),
  ('bamboo', 'loyalty_program', 'Bamboo Airways Bamboo Club'),
  ('air-tahiti-nui', 'loyalty_program', 'Air Tahiti Nui Club Tiare'),
  ('jetsmart', 'loyalty_program', 'JetSmart')
on conflict (slug) do nothing;

-- ============================================================
-- 1. BULGARIA AIR FLYMORE (non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Bulgaria Air FlyMore',
  alliance = 'none',
  hubs = ARRAY['SOF'],
  intro = 'Bulgaria Air FlyMore is the loyalty program of Bulgaria Air, the flag carrier of Bulgaria, founded in 2002 and based at SOF (Sofia). The fleet runs roughly 13 aircraft - a mix of A320-family and Embraer 190 - serving European and select Middle East destinations. Despite a frequent misconception, Bulgaria Air is NOT a Star Alliance member. The carrier runs bilateral codeshares with Lufthansa, Air France/KLM, Iberia, Aegean, airBaltic, and Air Serbia, but no alliance reciprocity exists.

For US readers, FlyMore has minimal-to-zero practical relevance. There are no direct US flexible-currency partnerships, no Marriott Bonvoy bridge, no alliance routing options, and no US-issued co-brand card. Points expire 3 years from flight date and award tickets are restricted to direct Bulgaria Air metal - no partner redemption pipe exists. US flyers heading to Bulgaria are far better served by booking Lufthansa, Turkish, or Aegean and crediting miles to those Star Alliance programs. Listing FlyMore here is for cross-program-consistency: when readers see "earn miles on Bulgaria Air?" the honest answer is "credit a Star Alliance partner instead."',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Practical US play: skip FlyMore** - no flexible-currency partner, no alliance, no US co-brand.
- **For travel to Bulgaria, book Lufthansa or Turkish or Aegean** and credit to United, Aeroplan, or Turkish Miles and Smiles.
- **Direct FlyMore redemption is restricted to Bulgaria Air metal only** - no partner pipe.
- **Earn FlyMore points only if you actually fly Bulgaria Air** - they are not fundable from US currencies.',
  sweet_spots = '- **Minimal US-reader relevance** - no US gateway, no flexible-currency partnership, no alliance routing.
- **For Bulgaria travel, redeem Star Alliance miles** (United, Aeroplan, Turkish, Aegean) on Lufthansa or Turkish Airlines metal instead.
- **Aegean Miles+Bonus is a sharper Balkans tool** for US flyers - transfers from Amex MR (foreign carrier, no US federal excise tax).',
  tier_benefits = '[
    {"name": "Basic", "qualification": "Entry tier - join free", "benefits": ["Earn FlyMore points on Bulgaria Air metal"]},
    {"name": "Classic", "qualification": "Mid tier - sustained activity", "benefits": ["Bonus mileage earning", "Member-rate benefits"]},
    {"name": "Silver", "qualification": "Elite tier", "benefits": ["Priority check-in", "Extra baggage allowance", "Bonus mileage earning"]},
    {"name": "Gold", "qualification": "Top tier", "benefits": ["SOF lounge access", "Priority boarding", "Highest mileage bonus", "Top priority benefits"]},
    {"name": "FLY MORE YOUTH", "qualification": "Separate tier for ages 12-26", "benefits": ["Tailored youth benefits and bonus mileage"]}
  ]'::jsonb,
  lounge_access = 'Bulgaria Air operates a lounge at SOF for Gold members and same-day business class passengers. There is no alliance reciprocal lounge access globally - Gold status only opens the SOF lounge. No published public day-pass program.',
  quirks = '- **NOT a Star Alliance member** despite a common misconception - bilateral codeshares only.
- **Codeshare partners include Lufthansa, AF/KLM, Iberia, Aegean, airBaltic, and Air Serbia** - but none of those provide loyalty reciprocity into FlyMore.
- **No major US flexible currency transfers** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **Points expire 3 years from flight date** - long, but no rolling activity reset.
- **Award tickets valid 1 year from issuance**.
- **Award redemption restricted to Bulgaria Air-operated direct flights** - no partner award pipe.
- **No US-issued co-brand card** - Bulgarian-market only.
- **No fuel surcharges on intra-Europe redemptions** (verify before booking).
- **Earning is distance + booking class on Bulgaria Air metal** - no partner accrual into FlyMore from external programs.
- **FLY MORE YOUTH is a separate tier for ages 12-26** with tailored benefits.',
  award_chart = 'Bulgaria Air does not publish a detailed public award chart for FlyMore. Award tickets are restricted to direct Bulgaria Air-operated flights only - no partner redemption. Pricing is distance + booking class based.

For US readers, the practical guidance: do not redeem FlyMore. Book Bulgaria-bound award trips via Star Alliance partners (United MileagePlus, Air Canada Aeroplan, Turkish Miles and Smiles, Aegean Miles+Bonus) on Lufthansa or Turkish or Aegean metal into SOF, where the chart structure is known and US flexible-currency funding paths exist.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'bulgaria-air';

-- ============================================================
-- 2. WIZZ DISCOUNT CLUB (PAID DISCOUNT CLUB - NOT POINTS)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Wizz Discount Club',
  alliance = 'none',
  hubs = ARRAY['BUD','LTN','OTP','KTW','WAW','VIE'],
  intro = 'Wizz Discount Club (WDC) is the paid annual subscription of Wizz Air, the European ultra-low-cost carrier with roughly 225 A320 / A321neo aircraft and bases at BUD (Budapest), LTN (London Luton), OTP (Bucharest), KTW (Katowice), WAW (Warsaw), and VIE (Vienna). The critical reader fact: WDC is NOT a points program. It is a paid discount membership - the same mental model as Sun Country UClub, Avelo PLUS, Volaris v.club, and VivaAerobus VivaFan. There are no miles, no award chart, no transfer partners, and no co-brand cards.

For US readers, WDC has minimal direct relevance. Wizz Air does not fly to the US, so the only audience is North American travelers planning 6+ Wizz flights per year while based in or traveling extensively across Europe. Standard membership is around EUR 39.99 promo / EUR 59.99 regular for a year and covers the member plus one companion, and the headline benefit is EUR 10 off any ticket priced at or above EUR 29.99 plus EUR 5 off bags. A meaningful 2025 change: the lowest sub-EUR 30 fares now sit BELOW the discount threshold, which significantly narrows the math for cheapest-fare hunters. The separately priced Wizz MultiPass (UK relaunch March 12 2026) is a different product - GBP 55 per month one-way or GBP 110 per month return after a first-month setup fee, with bookings required at least 5 days before departure. For most one-off intra-Europe trips, cash beats subscription.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **WDC is NOT a points program** - there is no miles balance, no transfer pipe, no award chart.
- **Membership is purely a paid discount: EUR 10 off tickets >= EUR 29.99 + EUR 5 off bags**.
- **Useful only if you fly Wizz 6+ times per year** at fares above EUR 30 - below that threshold, no discount applies post-2025.
- **Skip for US-resident occasional travelers** - standalone Wizz cash fares are typically lower than the WDC subscription delta after a couple of trips.
- **MultiPass is a separate product** with rigid >= 5-day booking windows.',
  sweet_spots = '- **Minimal US-reader relevance** - no US service, no flexible-currency tie-in, no points to redeem.
- **WDC math works only for Europe-based or extended-Europe-trip flyers** taking 6+ Wizz flights per year above EUR 30 face value.
- **Watch the new lowest-fare exclusion** - sub-EUR 30 base fares now sit below the discount threshold (2025 change), which removes WDC value from cheapest-fare bookings.
- **For one-off intra-Europe travel, cash typically beats WDC subscription**.',
  tier_benefits = '[
    {"name": "WDC Standard", "qualification": "Approximately EUR 39.99 promo / EUR 59.99 regular per year", "benefits": ["EUR 10 off tickets >= EUR 29.99", "EUR 5 off bags", "Member + 1 companion covered"]},
    {"name": "WDC Standard Plus", "qualification": "Approximately EUR 59.99 promo / EUR 99.99 regular per year", "benefits": ["Same discounts as Standard", "Up to 5 companions covered per booking"]},
    {"name": "WDC Premium / Premium Plus", "qualification": "Approximately EUR 389.99 per year", "benefits": ["Priority service line", "Exclusive promotional fares", "Higher discount allowances"]}
  ]'::jsonb,
  lounge_access = 'WDC includes no lounge access. Wizz Air does not operate or partner with airport lounges as part of the discount club.',
  quirks = '- **WDC is a paid annual subscription discount club, NOT a points program** - the closest mental models are Sun Country UClub, Avelo PLUS, Volaris v.club, and VivaAerobus VivaFan.
- **No miles, no chart, no transfer partners, no co-brand card**.
- **Subscription is 12-month and non-refundable** - useful only if you have ~6+ Wizz flights planned in Europe within the year.
- **Major 2025 change: discount excludes the lowest sub-EUR 30 fares** - removing the WDC math from cheapest-fare bookings.
- **MultiPass (UK relaunch March 12 2026) is a separate product** at GBP 55 per month one-way or GBP 110 per month return, with a GBP 152/303 first-month setup fee.
- **MultiPass requires booking at least 5 days before departure** - no last-minute use.
- **No cabin upgrades** (Wizz is single-cabin) and no priority anything except in Premium tier.
- **Wizz does not fly to or from the US** - membership is irrelevant for US-resident travelers without an extended European trip planned.
- **No fuel surcharges on Wizz Air fares** - Wizz fares are simple cash; WDC is just a flat-discount overlay.',
  award_chart = 'WDC has no award chart. It is a paid annual discount club, not a miles currency. Members pay full cash fare on every booking, then receive a flat EUR 10 off the ticket (when >= EUR 29.99) plus EUR 5 off bags. There is no redemption math, no peak/off-peak structure, and no partner award pricing.

The MultiPass product (separate from WDC) is also not a chart - it is a flat monthly subscription that grants one-way or return travel rights subject to availability and a >= 5-day booking window.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'wizz-air';

-- ============================================================
-- 3. AIRASIA REWARDS (formerly BIG Loyalty; Asian LCC consortium)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'airasia rewards',
  alliance = 'none',
  hubs = ARRAY['KUL'],
  intro = 'airasia rewards (rebranded from BIG Loyalty) is the lifestyle and coalition platform of the AirAsia consortium - AirAsia Malaysia, AirAsia X (long-haul), AirAsia Philippines, AirAsia Indonesia, and Thai AirAsia - operating roughly 200+ aircraft primarily out of KUL (Kuala Lumpur). AirAsia is a loose Value Alliance member (a budget consortium, not a global FFP alliance). The rebrand reflects the program''s evolution into a 300+ partner lifestyle ecosystem covering F&B, retail, financial services, BigPay, the airasia Mastercard, hotels, Agoda, and booking.com.

For US readers, airasia rewards has minimal US-flyer relevance. There is no US-issued co-brand card, no direct US flexible-currency transfer pipe (not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott), and no US gateway routes - AirAsia X discontinued KUL-LAX/HNL years ago. The program is most useful for Southeast-Asia-based travelers who use BigPay daily and book on the airasia Superapp. Earning is revenue-based on flights and via 300+ lifestyle partners; two-way conversion exists with Petronas Mesra (Malaysia fuel loyalty). Redemption is dynamic and cash-equivalent for flights, add-ons, and lifestyle deals. The Platinum tier is auto-granted with airasia credit card approval (Malaysia issuance).',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Practical US play: skip airasia rewards** - no transfer pipe, no US co-brand, no US gateway.
- **For SE Asia travel from the US, route via oneworld** (Cathay, Qatar) or Star Alliance (Singapore, Thai) and credit to those programs.
- **The airasia rewards platform is most useful for Southeast-Asia residents** using BigPay, the airasia Mastercard, and Superapp lifestyle redemptions.
- **Two-way conversion with Petronas Mesra** (Malaysia fuel loyalty) is a niche regional perk only.',
  sweet_spots = '- **Minimal US-reader relevance** - no US co-brand, no transferable currency partnerships, no US gateway routes.
- **AirAsia X long-haul to North America is discontinued** - the LAX/HNL routes from KUL ended years ago.
- **For US flyers heading to KUL, use Star Alliance** (Singapore, Thai, ANA) or oneworld (Cathay, JAL) instead.
- **Heavy lifestyle / F&B redemption focus** means the program is engineered for Malaysia/Indonesia/Philippines residents, not transient long-haul tourists.',
  tier_benefits = '[
    {"name": "Red", "qualification": "Entry tier - join free", "benefits": ["Base earning on AirAsia flights and 300+ lifestyle partners"]},
    {"name": "Gold", "qualification": "Sustained earning activity", "benefits": ["Bonus earning multipliers", "Priority check-in privileges", "Member-only deals"]},
    {"name": "Platinum", "qualification": "Top tier - auto-granted with airasia credit card approval (Malaysia issuance)", "benefits": ["Top tier benefits", "Highest earning rate on flights and partners", "Premium service touchpoints"]}
  ]'::jsonb,
  lounge_access = 'Lounge access is limited. Premium Flatbed passengers and select tier members access specific lounges in KUL. There is no alliance reciprocal lounge access globally and no US-side benefit. No published public day-pass program.',
  quirks = '- **Rebranded BIG Loyalty to "airasia rewards"** - now positioned as a lifestyle/coalition platform, not a pure FFP.
- **300+ lifestyle partners** including F&B, retail, financial services, BigPay, the airasia Mastercard, hotels, Agoda, and booking.com.
- **Loose Value Alliance member** (a budget consortium) - not a global FFP alliance like Star/oneworld/SkyTeam.
- **No major US flexible currency transfers** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **No US-issued co-brand card** - airasia Mastercard is Malaysia-issued only.
- **AirAsia X long-haul KUL-LAX / KUL-HNL discontinued** years ago - no US gateway today.
- **Two-way conversion with Petronas Mesra** (Malaysia fuel loyalty).
- **Points expire 24 months from earning**.
- **Platinum auto-granted with airasia credit card approval** in Malaysia.
- **Dynamic redemption pricing** against cash fares and ancillaries on the airasia.com / Superapp platform.',
  award_chart = 'airasia rewards does not publish a fixed flight award chart. Redemption is dynamic and cash-equivalent: airasia points apply against the live cash price of flights, add-ons, and lifestyle deals on the airasia.com platform and Superapp. There is no peak/off-peak fixed-price structure and no partner award redemption.

For US readers, the practical guidance: there is no chart math to learn here. The platform is engineered for Southeast-Asia residents who earn through BigPay, the airasia Mastercard, and Superapp lifestyle partners. Verify any earn or redeem ratio on airasia.com before relying on it.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'airasia';

-- ============================================================
-- 4. AIR INDIA EXPRESS (LCC - Maharaja Club integration in progress)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air India Express',
  alliance = 'star_alliance',
  hubs = ARRAY['COK','BLR','DEL','BOM'],
  intro = 'Air India Express (AIX) is the LCC subsidiary of Air India under Tata Group, with roughly 95 aircraft - primarily 737-800 / 737 MAX - operating out of COK (Kochi), BLR, DEL, and BOM after the AIX Connect merger. AIX falls under the Star Alliance umbrella via parent Air India (post-merger). The loyalty side is in active transition. Currently, AIX bookings reward Tata NeuPass / NeuCoins (the Tata wallet platform). Maharaja Club redemption on AIX flights enabled progressively from April 1, 2026, and AIX earning into Maharaja Club is scheduled to follow later in 2026.

For US readers, AIX has limited direct relevance - it is an LCC with no US service, and there is no separate AIX FFP currency to fund from US flexible programs. The strategic reading: track the parent Air India Maharaja Club program (which IS a Star Alliance member program) for transfer-partner status, and earn United MileagePlus or Aeroplan on Air India metal flights. Once AIX-into-Maharaja Club earning goes live later in 2026, AIX domestic India redemptions will become useful as cheap positioning legs onto a long-haul Air India award routing. Until then, the practical takeaway is wait-and-see: this is the kind of program page that needs a refresh as the integration completes.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Track the parent Air India Maharaja Club page** for transfer-partner status and award chart - that is where US flexible-currency funding will land.
- **Earn United MileagePlus or Aeroplan** on Air India metal flights via Star Alliance reciprocity.
- **AIX-into-Maharaja Club earning is not live yet** (scheduled later 2026) - check before assuming credit on AIX bookings.
- **NeuCoins from AIX bookings are India-wallet-only** - no US-flyer utility.
- **Vistara CV points migrated to Maharaja Club at 1:1** (completed) - check old Vistara balances.',
  sweet_spots = '- **Low direct US-flyer relevance** - AIX is LCC with no US service.
- **Maharaja Club domestic awards from 1,500 points** (post-April-2026 enhancement) become useful as positioning legs onto a long-haul Air India redemption once AIX integration completes.
- **For US-India travel, redeem Star Alliance miles** (United, Aeroplan, Turkish, ANA) on Air India parent metal.
- **AIX cabin upgrades from 4,000 Maharaja Club points** post-April-2026 (verify on airindia.com).
- **Wait-and-see**: revisit AIX-specific redemptions once AIX-into-Maharaja Club earning goes live later 2026.',
  tier_benefits = '[
    {"name": "Red", "qualification": "Entry tier (Maharaja Club inheritance)", "benefits": ["Base earning on Air India / Air India Express metal", "Free to join"]},
    {"name": "Silver", "qualification": "Approximately 15,000 tier points; Star Silver tier", "benefits": ["Star Alliance Silver", "Priority check-in", "Bonus earning"]},
    {"name": "Gold", "qualification": "Approximately 30,000 tier points; Star Gold tier", "benefits": ["Star Alliance Gold", "Lounge access globally on same-day Star international", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "Approximately 45,000 tier points; Star Gold tier", "benefits": ["Star Alliance Gold", "Top mileage bonus", "Highest priority on the network", "Companion benefits expanded April 2026"]}
  ]'::jsonb,
  lounge_access = 'AIX is LCC with limited own-brand lounge access. Star Alliance lounge access is available to Maharaja Club Gold-tier members on Air India-operated metal globally. Day-pass access is not a published program.',
  quirks = '- **AIX falls under Star Alliance via parent Air India** (post-merger) - same alliance umbrella but no separate AIX FFP currency.
- **Loyalty in transition**: AIX bookings currently earn Tata NeuPass / NeuCoins (India wallet platform).
- **Maharaja Club redemption on AIX flights enabled progressively from April 1, 2026**.
- **AIX earning into Maharaja Club is scheduled later 2026** - not yet live as of May 2026.
- **No major US flexible currency transfers into AIX** (track parent Maharaja Club page instead).
- **Vistara CV points migrated to Maharaja Club at 1:1** (completed) - old Vistara balances are now Maharaja.
- **Vistara co-brand cards continue under existing terms until March 31 2026**.
- **No US-issued AIX co-brand**.
- **Domestic Maharaja Club awards start at 1,500 points** post-April-2026 enhancement.
- **AIX is fundamentally an LCC** - this page primarily exists for cross-program-consistency until the FFP integration completes.
- **Refresh recommended late 2026** once AIX-into-Maharaja Club earning is live.',
  award_chart = 'Air India Express does not publish a separate award chart - redemptions go through Maharaja Club post-April-2026. Sample Maharaja Club pricing on AIX/AI metal:

| Route | Cabin | Cost |
|---|---|---|
| Domestic India award (post-April 2026) | Economy | from 1,500 points |
| Domestic India cabin upgrade (post-April 2026) | Upgrade | from 4,000 points |

US-India redemptions: use Star Alliance partners (United MileagePlus, Aeroplan, Turkish Miles and Smiles, ANA Mileage Club) on Air India parent metal. AIX-into-Maharaja Club earning had not gone live as of May 2026; verify status on airindia.com before relying on AIX-side accrual.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-india-express';

-- ============================================================
-- 5. NORWEGIAN REWARD CASHPOINTS (cashback model)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Norwegian Reward CashPoints',
  alliance = 'none',
  hubs = ARRAY['OSL','CPH','ARN'],
  intro = 'Norwegian Reward is the loyalty program of Norwegian Air Shuttle, the Scandinavian short-haul carrier with roughly 80 737-800 / MAX aircraft based at OSL (Oslo), CPH (Copenhagen), and ARN (Stockholm). Norwegian successfully exited examinership and CashPoints earning and redemption are fully restored. The long-haul 787 fleet was retired during 2020-2021, and Norwegian no longer flies to the US. Norwegian co-owns Wideroe (a Norwegian regional carrier) for joint earning.

The defining feature: CashPoints is a cashback-model currency, not a traditional FFP. CashPoints redeem at NOK 1:1 (roughly USD 0.10) against the live cash price of any Norwegian or Wideroe ticket - no award chart, no blackout dates, no peak/off-peak, no partner award redemption. Earning is a percentage of the fare paid (excluding taxes), with LowFare, LowFare Plus, and Flex earning progressively higher percentages. Norwegian uses an unusual non-traditional tier structure: instead of elite levels, members unlock a new benefit every 8 flights within a rolling 12-month window. At 32 flights you reach Reward Priority - which adds free hot drink, priority boarding, free seat selection, priority customer service, no CashPoints expiry, and Avis President''s Club status. There is no current US-issued co-brand (the BoA-issued Norwegian Reward Credit Card was discontinued); current cards are Nordic-issued. For US readers based in or extensively traveling Scandinavia, CashPoints is a predictable but unexceptional tool - cash often beats it.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **CashPoints redeem at NOK 1:1 against any Norwegian / Wideroe ticket** - simple, predictable, and never aspirational.
- **No partner award redemption** - CashPoints work only on Norwegian or Wideroe metal.
- **The math is essentially a cashback rebate** - useful only if you regularly fly Norwegian.
- **Reward Priority (32 flights / 12 months) keeps CashPoints from expiring** - the only meaningful protection from expiry.
- **For US-Scandinavia travel, route via SkyTeam** (Delta, KLM, AF) or Star (United, SAS Eurobonus) instead.',
  sweet_spots = '- **Minimal direct US-flyer relevance** - Norwegian no longer operates US routes.
- **Predictable cash-style rebate on intra-Europe Norwegian metal** for connecting US flyers based in OSL/CPH/ARN.
- **No sweet spots, no aspirational redemption** - 1:1 NOK = 1:1 NOK, every time.
- **For premium-cabin Europe redemption, look elsewhere** (SkyTeam Flying Blue Promo Rewards, Star Alliance partners on SAS).',
  tier_benefits = '[
    {"name": "Member", "qualification": "Entry - join free", "benefits": ["Base CashPoints earning on Norwegian / Wideroe"]},
    {"name": "Reward Priority (1-3)", "qualification": "8 flights within 12 months unlocks the first benefit; new benefit every 8 flights", "benefits": ["Progressive benefit unlocks at 8/16/24 flights", "No traditional elite tier ladder"]},
    {"name": "Reward Priority (Full)", "qualification": "32 flights within 12 months", "benefits": ["No CashPoints expiry", "Free hot drink", "Priority boarding", "Free seat selection", "Priority customer service", "Avis President''s Club status"]}
  ]'::jsonb,
  lounge_access = 'Norwegian operates no own-brand lounges. Reward Priority members get fast-track and select benefits but no lounge access. There is no alliance reciprocal lounge access globally.',
  quirks = '- **CashPoints are a cashback-model currency, not a traditional FFP** - 1 CashPoint = 1 NOK (~USD 0.10).
- **No award chart, no blackout dates, no peak/off-peak, no partner award redemption** - pure rebate against the live cash price.
- **Non-traditional tier structure** - unlock a new benefit every 8 flights within 12 months; full Reward Priority at 32 flights.
- **CashPoints expire 24 months end of earning year** (48 months for cardholders, no expiry for full Reward Priority members).
- **Norwegian successfully exited examinership** - long-haul 787 fleet retired 2020-2021 and US service is discontinued.
- **Co-owns Wideroe** for joint earning on Norwegian regional flights.
- **No major US flexible currency transfers** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **US-issued Norwegian Reward Credit Card (BoA) was discontinued** - current co-brand cards are Nordic-issued only.
- **Earning is fare percentage based** - LowFare / LowFare Plus / Flex earn progressively higher rates (excluding taxes).
- **No fuel surcharges** on Norwegian fares (single-cabin LCC).
- **Cash often beats CashPoints math** for one-off bookings.',
  award_chart = 'Norwegian Reward has no award chart in the traditional sense - CashPoints redeem 1:1 against the live cash price of any Norwegian or Wideroe ticket (1 CashPoint = 1 NOK off the fare). There is no peak/off-peak structure, no minimum redemption threshold beyond standard ticketing minimums, no blackout dates, and no partner award redemption.

The practical implication for US readers: there are no sweet spots to learn. The math is a flat rebate. Useful only if you regularly fly Norwegian or Wideroe and accumulate CashPoints faster than you can spend them. For US-Scandinavia travel, redeem SkyTeam (Delta, KLM, AF Flying Blue) or Star Alliance (United, SAS Eurobonus) miles instead.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'norwegian';

-- ============================================================
-- 6. INDIGO BLUCHIP (Indian ULCC; cashback model)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'IndiGo BluChip',
  alliance = 'none',
  hubs = ARRAY['DEL','BOM','BLR','HYD','MAA'],
  intro = 'IndiGo BluChip is the flight-loyalty program of IndiGo, India''s largest carrier, founded in 2006 and operating roughly 400 aircraft - primarily A320 / A321neo with ATR turboprops on regional routes - out of DEL, BOM, BLR, HYD, and MAA. IndiGo is non-aligned, with interline agreements with American, Turkish, KLM, Qatar, and others (verify currency before relying on a specific interline). BluChip launched in 2024, replacing the old 6E Rewards program at the airline level; the 6E Rewards co-brand cards (HDFC, Kotak) continue under that name as the credit-card program, while BluChip is the flight-loyalty layer.

For US readers, BluChip has zero direct relevance. IndiGo has no US service, no US-issued co-brand, and no major US flexible-currency transfer pipe (not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott). The program is structured as cashback - 1 BluChip equals INR 1, redeemable on any IndiGo flight with no blackouts. Earning is revenue-based: 8 BluChips per INR 100 base, scaling up to 16 per INR 100 with elite tier and direct-channel booking on IndiGo.in. Add-ons (Seat Select, Excess Baggage, Fast Forward) earn up to 12 per INR 100. India-based travelers can stack the 6E Rewards XL (HDFC) co-brand for a meaningful effective rebate. US flyers transiting India should book Star Alliance (Air India, United) or oneworld (BA, Qatar) instead.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **BluChips redeem at INR 1:1 on any IndiGo flight** - cash-equivalent, no blackouts, no chart.
- **Practical US play: skip BluChip** - no transfer pipe, no US co-brand, no US gateway.
- **For US-India travel, use Star Alliance** (Air India, United) or oneworld (BA, Qatar) and credit to those programs.
- **6E Rewards (HDFC / Kotak) still earns 6E Rewards points (not BluChips)** - redeemable on IndiGo at 1:1 INR equivalence.
- **Direct booking on IndiGo.in adds 4 BluChip channel bonus** (max 16 per INR 100 with Blu 1 elite + direct).',
  sweet_spots = '- **Zero direct US-flyer relevance** - IndiGo has no US service, no transferable currency partners, no US co-brand.
- **Cash-equivalent redemption only** - 1 BluChip = INR 1, no aspirational redemptions.
- **For US flyers transiting India, redeem Star** (Air India, United, Turkish, ANA) or oneworld (BA Avios, Qatar) instead.
- **The 6E Rewards XL HDFC card** is meaningful only for India-resident flyers stacking 5% on IndiGo plus 3% on dining and groceries.',
  tier_benefits = '[
    {"name": "Blu 3", "qualification": "Entry tier - join free", "benefits": ["8 BluChips per INR 100 base earning", "Free to join"]},
    {"name": "Blu 2", "qualification": "Mid tier - sustained activity", "benefits": ["+2 tier bonus = 10 BluChips per INR 100", "Bonus partner offers"]},
    {"name": "Blu 1", "qualification": "Top elite tier", "benefits": ["+4 tier bonus = 12 BluChips per INR 100", "Free 6E Prime passes (priority check-in, security, snack)", "Bonus partner offers"]}
  ]'::jsonb,
  lounge_access = 'IndiGo operates no own-brand airline lounges. Blu 1 members get free 6E Prime passes (priority check-in, security, snack on IndiGo flights). There is no alliance reciprocal lounge access globally.',
  quirks = '- **BluChip launched 2024 replacing 6E Rewards at the airline level** - the 6E Rewards co-brand cards (HDFC, Kotak) continue but represent the credit-card program, not the flight loyalty layer.
- **1 BluChip = INR 1** - cash-equivalent redemption with no chart and no blackouts.
- **Earning scales 8 to 16 BluChips per INR 100** based on tier + booking channel; direct booking on IndiGo.in adds 4 channel bonus.
- **Add-ons (Seat Select, Excess Baggage, Fast Forward) earn up to 12 BluChips per INR 100**.
- **6E Rewards XL (HDFC) earns 5% on IndiGo and 3% on dining / groceries** - India-issued only.
- **6E Rewards (HDFC / Kotak) co-brand earns 6E Rewards points, not BluChips** - both redeem at 1:1 INR on IndiGo.
- **No major US flexible currency transfers in** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **No US-issued co-brand**.
- **BluChips do not expire while the account remains active**.
- **IndiGo is non-aligned** with interline agreements (verify currency on a specific carrier).
- **No fuel surcharges on IndiGo cash fares** - dynamic-priced ULCC base fares.',
  award_chart = 'IndiGo BluChip has no traditional award chart. BluChips redeem at INR 1:1 against the live cash price of any IndiGo flight, with no blackout dates and no peak/off-peak structure. The math is a pure cash-equivalent rebate.

For US readers, the practical guidance: there is no chart math to learn. The program is engineered for India-resident travelers earning through co-brand cards and frequent IndiGo bookings. For US-India long-haul or transit redemptions, redeem Star Alliance (Air India, United, Turkish, ANA Mileage Club) or oneworld (BA Avios, Qatar Avios) miles instead.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'indigo';

-- ============================================================
-- 7. BAMBOO AIRWAYS BAMBOO CLUB (contracted; domestic only)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Bamboo Airways Bamboo Club',
  alliance = 'none',
  hubs = ARRAY['HAN','SGN'],
  intro = 'Bamboo Club is the loyalty program of Bamboo Airways, the Vietnamese carrier founded in 2017 and based at HAN (Hanoi) and SGN (Ho Chi Minh). Bamboo''s near-collapse in 2023 forced a withdrawal from Australia and long-haul routes, retirement of the 787 fleet, and a heavy contraction. As of April 2026 the fleet runs roughly 7-10 narrow-body aircraft on roughly 7 domestic Vietnam destinations, with zero international destinations. The recovery plan targets a 30-aircraft fleet by 2030, but operational uncertainty remains high and founder Trinh Van Quyet''s legal and restart issues continue.

For US readers, Bamboo Club has zero current relevance. There are no international routes, no US partners, no transferable currency partnerships, and no US-issued co-brand. The program''s tier ladder (Member / Gold / Diamond / First) is intact, and Bamboo "restored" prior-year tier statuses in October 2025 as a goodwill gesture. The tier-match program reopened November 8, 2025 - a curiosity for travelers already heading to Vietnam who want a status novelty. For serious Vietnam travel, US flyers should book Vietnam Airlines (SkyTeam) instead and redeem via Delta SkyMiles or Air France/KLM Flying Blue. Verify Bamboo''s current schedule and operational status on bambooairways.com before any redemption planning.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Practical US play: skip Bamboo Club entirely** - no international service, no US partners, no transferable currency.
- **For Vietnam travel, redeem SkyTeam** (Delta, KLM, AF Flying Blue) on Vietnam Airlines instead.
- **Status-match novelty only** for travelers already heading to Vietnam who want a brief status experiment.
- **Verify current Bamboo schedule and operational status before any redemption planning** - heavy operational uncertainty as of May 2026.',
  sweet_spots = '- **Zero US-flyer relevance as of May 2026** - no international routes, no US partners.
- **Status-match curiosity only** for travelers already in Vietnam (tier-match reopened November 8, 2025).
- **For Vietnam travel, redeem Delta SkyMiles or Flying Blue on Vietnam Airlines** (SkyTeam) instead.
- **Recommend re-checking bambooairways.com before booking** - heavy operational uncertainty.',
  tier_benefits = '[
    {"name": "Member", "qualification": "Entry tier - join free", "benefits": ["Base earning on Bamboo metal"]},
    {"name": "Gold", "qualification": "Approximately 690 qualifying points or 6 qualifying flights per 12 months", "benefits": ["Bonus earning", "Priority check-in"]},
    {"name": "Diamond", "qualification": "Approximately 1,390 qualifying points or 15 flights per 12 months", "benefits": ["HAN / SGN Bamboo lounge access", "Higher mileage bonus", "Extra baggage"]},
    {"name": "First", "qualification": "Approximately 2,090 qualifying points or 20 flights per 12 months - top tier", "benefits": ["Top tier benefits", "HAN / SGN Bamboo lounge access", "Priority across the network"]}
  ]'::jsonb,
  lounge_access = 'Diamond and First tier members access Bamboo lounges at HAN and SGN. There is no alliance reciprocal lounge access globally.',
  quirks = '- **Near-collapse in 2023** forced withdrawal from Australia and long-haul routes, retirement of the 787 fleet, and heavy contraction.
- **As of April 2026: roughly 7-10 narrow-body aircraft, ~7 domestic destinations, 0 international destinations**.
- **Recovery plan targets 30-aircraft fleet by 2030** - heavy operational uncertainty.
- **Founder Trinh Van Quyet''s legal and restart issues continue**.
- **October 2025 Bamboo "restored" all prior-year member tier statuses** as a goodwill recovery gesture.
- **Tier-match program reopened November 8, 2025** - status novelty for travelers already in Vietnam.
- **No major US flexible currency transfers** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **No US-issued co-brand**.
- **Earning is distance + booking class on Bamboo metal only** - no meaningful international partner accrual.
- **Verify current schedule and operational status before any redemption planning** - the carrier remains in active recovery.',
  award_chart = 'Bamboo Club does not publish a robust public award chart, and as of May 2026 award redemption is restricted to domestic Vietnam Bamboo metal only (no international redemption available since the 2023 contraction).

For US readers, the practical guidance: do not redeem Bamboo. For Vietnam travel, redeem Delta SkyMiles, Air France/KLM Flying Blue, or other SkyTeam currencies on Vietnam Airlines metal instead. Verify current Bamboo schedule and operational status on bambooairways.com before any planning.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'bamboo';

-- ============================================================
-- 8. AIR TAHITI NUI CLUB TIARE (real US-flyer value via AAdvantage)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air Tahiti Nui Club Tiare',
  alliance = 'none',
  hubs = ARRAY['PPT'],
  intro = 'Club Tiare is the loyalty program of Air Tahiti Nui (ATN), the Tahiti-based boutique long-haul carrier with 4 Boeing 787-9 Dreamliners flying out of PPT (Papeete). Routes include PPT-LAX (daily), PPT-CDG (via LAX), PPT-AKL, PPT-NRT, and PPT-SEA (verify current schedule). ATN is non-aligned but maintains rich bilateral partner agreements - and that is the entire reader story for US flyers. The bilateral partner roster is the loyalty value: AAdvantage, Delta SkyMiles, Air France/KLM Flying Blue, Atmos Mileage Plan, JAL, and Qantas all earn and redeem on ATN metal.

For US readers, ATN is the rare Tier-D-listed program with real US-flyer value - via partners, not Club Tiare itself. The headline sweet spot is AAdvantage at roughly 40,000 miles one-way LAX-PPT economy and 80,000 miles one-way LAX-PPT business in the 787-9 Poerava Business cabin. AAdvantage has the most consistent ATN award availability search experience on aa.com. Citi ThankYou + Bilt transfer to AAdvantage at 1:1, making the Citi/Bilt-to-AA-to-ATN path the most reliable. Atmos Mileage Plan added ATN as a partner in 2024-2025 and offers competitive saver pricing when bookable. Flying Blue Promo Rewards historically priced PPT as low as 25,500 - but ATN availability has reportedly disappeared from Flying Blue online; verify before transferring. Skip Delta - SkyMiles agents are notoriously unaware that ATN is even a partner. Club Tiare itself does not have direct US flexible-currency transfer-in pipes; Club Tiare''s main job is the on-metal status and lounge benefits via Air France business lounges.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **AAdvantage 40,000 miles one-way LAX-PPT economy** - the cleanest US sweet spot.
- **AAdvantage 80,000 miles one-way LAX-PPT business** in 787-9 Poerava Business - aspirational but pricey by AAdvantage standards.
- **Citi ThankYou or Bilt 1:1 to AAdvantage -> ATN** is the most reliable US flexible-currency path.
- **Atmos Mileage Plan saver redemptions to PPT** (added 2024-2025) - likely best-value path when bookable.
- **Flying Blue Promo Rewards to PPT historically as low as 25,500** - but ATN availability has reportedly disappeared online (verify).
- **Skip Delta SkyMiles for ATN bookings** - agents are notoriously unaware ATN is a partner.
- **Award availability is most consistent and generous on aa.com search**.',
  sweet_spots = '- **AAdvantage 40K one-way LAX-PPT economy** - solid value, no fuel surcharges, dependable aa.com availability.
- **AAdvantage 80K one-way LAX-PPT business** in 787-9 Poerava Business - aspirational redemption for the 787 product.
- **Atmos Mileage Plan saver redemptions to PPT** - 2024-2025 expansion makes this the likely best-value path when bookable.
- **Flying Blue Promo Rewards** historically priced PPT as low as 25,500 - but ATN availability has reportedly disappeared from Flying Blue online (verify before transferring).
- **No fuel surcharges on AAdvantage redemptions on ATN** - YQ pass-through avoided.
- **Daytime LAX-PPT westbound is the gold-standard award flight** when available.
- **4-aircraft fleet means limited award availability** - book early, stay flexible on dates.',
  tier_benefits = '[
    {"name": "Member", "qualification": "Entry tier - join free", "benefits": ["Earning + redemption access on Club Tiare", "3,000 welcome miles on first ATN trip"]},
    {"name": "Silver", "qualification": "Approximately 30,000 status miles in qualifying period", "benefits": ["50% bonus mileage", "Priority check-in", "Extra checked baggage allowance"]},
    {"name": "Gold", "qualification": "Approximately 60,000 status miles in qualifying period", "benefits": ["75% bonus mileage", "Air France business lounge access at LAX, CDG, PPT, NRT for member + guest", "Priority security and bags", "Free seat selection"]}
  ]'::jsonb,
  lounge_access = 'Club Tiare Gold members access Air France business lounges at LAX, CDG, PPT, and NRT for member plus one guest (verify current contract status). There is no broader alliance reciprocal lounge access. Day-pass access at PPT may be available - verify on airtahitinui.com.',
  quirks = '- **4-aircraft fleet (Boeing 787-9 Dreamliner) means limited award availability** - book early, stay flexible.
- **Non-aligned with rich bilateral partner agreements** - AAdvantage, Delta SkyMiles, Flying Blue, Atmos Mileage Plan, JAL, and Qantas all earn / redeem on ATN.
- **AAdvantage is the most reliable redemption path** with consistent aa.com search availability and no fuel surcharges.
- **Atmos Mileage Plan added ATN as a partner in 2024-2025** with competitive saver pricing when bookable.
- **ATN availability on Flying Blue online has reportedly disappeared** - verify before transferring Amex MR / Cap One / Citi.
- **Skip Delta SkyMiles for ATN bookings** - agents notoriously do not know ATN is a partner; phone bookings frequently go nowhere.
- **No direct US flexible currency transfers into Club Tiare** - all US flexible-currency funding routes through partner programs.
- **Daytime LAX-PPT westbound, redeye eastbound** schedule.
- **Fuel surcharges (YQ) apply to Flying Blue redemptions; AAdvantage avoids most YQ on ATN**.
- **Routes: PPT-LAX (daily), PPT-CDG (via LAX), PPT-AKL, PPT-NRT, PPT-SEA** (verify current schedule).
- **787-9 Poerava Business is the premium product** for the LAX-PPT 80K AAdvantage redemption.',
  award_chart = 'Club Tiare uses a distance / route / cabin-based earning structure on its own metal but does not publish a robust public award chart. For US readers, the practical chart is whichever partner program you redeem through:

| Route | Currency | Cabin | Cost |
|---|---|---|---|
| LAX-PPT one-way | AAdvantage | Economy | ~40,000 miles |
| LAX-PPT one-way | AAdvantage | Business (787-9) | ~80,000 miles |
| LAX-PPT one-way | Atmos Mileage Plan | Economy / Business | competitive saver - verify |
| US-PPT via Flying Blue | Flying Blue | Economy | from 25,500 (Promo Reward; availability inconsistent) |

AAdvantage offers the most consistent search availability on aa.com and avoids most fuel surcharges. Verify Flying Blue and Atmos pricing on each program''s engine before transferring.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-tahiti-nui';

-- ============================================================
-- 9. JETSMART (uses AAdvantage; All You Can Fly subscription)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'JetSmart',
  alliance = 'oneworld',
  hubs = ARRAY['SCL','EZE','LIM'],
  intro = 'JetSmart is the South American ULCC under Indigo Partners (the same investor group as Frontier, Volaris, and Wizz), founded in 2016 and operating roughly 30 A320 / A321neo aircraft from SCL (Santiago), EZE (Buenos Aires Ezeiza), and LIM (Lima). JetSmart serves Chile, Argentina, Peru, Colombia, Brazil, Uruguay, Paraguay, Ecuador, and the Dominican Republic. The defining loyalty fact: since September 24, 2024, JetSmart uses AAdvantage as its loyalty program - the first non-American airline ever to fully adopt AAdvantage. JetSmart has no separate points currency at all. The arrangement is paired with a strategic partnership with American Airlines plus an AA minority stake.

For US readers, this is an unusually direct setup. AAdvantage miles + Loyalty Points earn on JetSmart marketed and operated flights, plus AA-marketed JetSmart codeshares. The All You Can Fly subscription launched April 2026 at roughly CLP 630,190 (~USD 650, verify) annual fee, granting unlimited direct routes across South America for 12 months - subject to availability and booking windows of at least 24 hours before domestic and at least 72 hours before international departures. The funding paths for US flexible currencies are wide: Citi ThankYou and Bilt transfer 1:1 to AAdvantage, Marriott Bonvoy moves 3:1 with the standard 5K bonus per 60K, while Amex MR, Chase UR, Capital One, and Wells Fargo all lack direct AAdvantage transfer. Sweet spots include AAdvantage saver awards on JetSmart for South America positioning (~7,500-12,500 miles short hops, verify) and cheap Loyalty Points runs on JetSmart fares to chase AA elite status.',
  transfer_partners = '[
    {"from_slug": "citi", "ratio": "1:1", "notes": "Citi ThankYou added AAdvantage as a transfer partner; cleanest path for JetSmart redemption funding from US flexible currency.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "Bilt to AAdvantage 1:1 - reliable monthly transfer pipe.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1.1", "notes": "Marriott Bonvoy 3:1 to AAdvantage with 5,000-mile bonus per 60,000 transferred.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **AAdvantage saver awards on JetSmart for South America positioning** at roughly 7,500-12,500 miles short hops (verify on aa.com).
- **Earn Loyalty Points on cheap JetSmart fares** to chase AA elite status - low-cost LP runs.
- **Citi ThankYou or Bilt 1:1 to AAdvantage** is the cleanest US flexible-currency path.
- **Marriott Bonvoy 3:1 to AAdvantage** with 5K bonus per 60K - viable funding source.
- **All You Can Fly subscription** (~CLP 630,190 / ~USD 650 per year) - useful only for non-US-resident frequent regional travelers.
- **Skip Amex MR / Chase UR / Capital One / Wells Fargo** as direct funding - none transfer to AAdvantage directly.',
  sweet_spots = '- **AAdvantage saver awards on JetSmart for South America positioning** at ~7,500-12,500 miles short hops (verify on aa.com).
- **Cheap Loyalty Points runs on JetSmart fares** for AA elite status chasing - real US-flyer angle.
- **Citi ThankYou + Bilt 1:1 to AAdvantage -> JetSmart** is a practical US flexible-currency path.
- **All You Can Fly subscription** only useful for non-US-resident frequent regional travelers - tax + fees per flight on top of subscription, no last-minute booking inside the cutoff window.
- **First airline ever to drop its own loyalty program in favor of AAdvantage** - novel structure with predictable AA chart math.
- **No separate JetSmart currency to manage or redeem**.',
  tier_benefits = '[
    {"name": "AAdvantage Gold", "qualification": "Earn via AAdvantage Loyalty Points threshold (40,000 LP)", "benefits": ["oneworld Ruby benefits", "Priority check-in and boarding", "Free preferred seats"]},
    {"name": "AAdvantage Platinum", "qualification": "75,000 LP", "benefits": ["oneworld Sapphire", "Lounge access on international", "Priority on upgrades and waitlists"]},
    {"name": "AAdvantage Platinum Pro", "qualification": "125,000 LP", "benefits": ["oneworld Sapphire", "Higher upgrade priority", "Free Main Cabin Extra"]},
    {"name": "AAdvantage Executive Platinum", "qualification": "200,000 LP", "benefits": ["oneworld Emerald", "Top priority on the AA / oneworld network", "Systemwide upgrade certificates"]}
  ]'::jsonb,
  lounge_access = 'JetSmart is ULCC with no own-brand lounges. AAdvantage elite tiers receive Admirals Club and oneworld lounge access where the standard AAdvantage rules apply (oneworld Sapphire / Emerald reciprocity on international itineraries). Day-pass access is via standard AAdvantage / oneworld lounge passes.',
  quirks = '- **First airline ever to drop its own loyalty program in favor of AAdvantage** - JetSmart has NO separate points currency at all.
- **AAdvantage is the loyalty engine since September 24, 2024** - paired with a strategic AA partnership and AA minority stake.
- **All You Can Fly subscription launched April 2026** at ~CLP 630,190 (~USD 650, verify) per year for unlimited direct South America routes.
- **All You Can Fly booking windows: >= 24h before domestic and >= 72h before international** - no last-minute use.
- **All You Can Fly: tax and fees per flight on top of subscription** - subscription is not "all-in" on every booking.
- **Citi ThankYou added AAdvantage as a transfer partner** - direct 1:1 path.
- **Bilt 1:1 to AAdvantage** - reliable monthly transfer.
- **Marriott Bonvoy 3:1 to AAdvantage** with 5K bonus per 60K.
- **Amex MR, Chase UR, Capital One, and Wells Fargo do NOT transfer to AAdvantage** - skip those for JetSmart funding.
- **JetSmart-only itineraries are bookable on aa.com**.
- **Loyalty Points earning on JetSmart marketed and operated flights** - real angle for AA elite chasing on cheap fares.
- **Indigo Partners portfolio sibling of Frontier, Volaris, and Wizz Air** - same ULCC investor structure.',
  award_chart = 'JetSmart redemptions price on the AAdvantage chart since September 24, 2024 - JetSmart has no separate points currency. JetSmart-only itineraries are bookable on aa.com. Distance and region price per AA web specials and saver awards.

Sample AAdvantage saver pricing on JetSmart positioning:

| Route | Cabin | Miles |
|---|---|---|
| Intra-Chile / intra-Argentina short-haul one-way | Economy | ~7,500-12,500 |
| Cross-border South America short-haul one-way | Economy | ~12,500-17,500 |

Verify current pricing on aa.com - AA web specials shift frequently and saver inventory varies by route.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'jetsmart';
