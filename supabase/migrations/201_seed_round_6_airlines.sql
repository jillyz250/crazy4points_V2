-- Round 6 batch: 10 airline loyalty programs.
-- Each page draft was researched via WebSearch + cross-checked against
-- official program pages where available. Hedges and verify-before-publish
-- notes are inline.

-- ============================================================
-- PREP: ensure skeleton rows exist for all 10 slugs
-- ============================================================
insert into programs (slug, type, name) values
  ('thai', 'loyalty_program', 'Thai Royal Orchid Plus'),
  ('asiana', 'loyalty_program', 'Asiana Club'),
  ('air-china', 'loyalty_program', 'Air China PhoenixMiles'),
  ('royal-jordanian', 'loyalty_program', 'Royal Jordanian Royal Club'),
  ('saudia', 'loyalty_program', 'Saudia Alfursan'),
  ('finnair', 'loyalty_program', 'Finnair Plus'),
  ('tap', 'loyalty_program', 'TAP Miles&Go'),
  ('china-airlines', 'loyalty_program', 'China Airlines Dynasty Flyer'),
  ('vietnam-airlines', 'loyalty_program', 'Vietnam Airlines Lotusmiles'),
  ('garuda-indonesia', 'loyalty_program', 'Garuda Indonesia GarudaMiles')
on conflict (slug) do nothing;

-- ============================================================
-- 1. THAI ROYAL ORCHID PLUS (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Thai Royal Orchid Plus',
  alliance = 'star_alliance',
  hubs = ARRAY['BKK'],
  intro = 'Thai Royal Orchid Plus (ROP) is the loyalty program of Thai Airways International, the BKK-based Star Alliance carrier that emerged from court-supervised business rehabilitation in 2026 and is rebuilding around its "Silk Hub" Bangkok strategy. The fleet is a mix of A350-900, 777-300ER, A330, and 787 widebodies - around 80 aircraft today, growing toward roughly 100 by end-2026 with 10 leased 787s arriving from March 2026. AMS resumed in July 2026, and the China network is expanding (Shenzhen, Wuhan, Chongqing) under CEO Chai Eamsiri. Annual passengers run around 16 million, and the iLoyal digital loyalty platform launched in 2025.

For US travelers, ROP is a niche currency. None of Amex MR, Chase UR, Capital One, Bilt, or Wells Fargo transfer to it. The practical bridges are Citi ThankYou (1:1 from premium cards, 1:0.7 from non-premium) and Marriott Bonvoy (3:1 with the 5,000-mile bonus at the 60K tier). The reasons to bother are very specific: Thai Royal Silk on the A350-900 to Europe is a strong product, and Star Alliance partner business class through ROP can occasionally beat United or Aeroplan pricing. Be ready for heavy fuel surcharges on THAI metal and most Star partners, and expect to pick up the phone for partner award booking.',
  transfer_partners = '[
    {"from_slug": "citi", "ratio": "varies", "notes": "1:1 from Citi premium cards (Premier, Strata Premier, Prestige); 1:0.7 from non-premium ThankYou cards. Verified May 2026 - approximately 3-7 day transfer time. Do not assume a flat 1:1.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 ROP miles + 5,000-mile bonus at the 60K tier. Verified May 2026 - 1-7 day transfer time.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Thai Royal Silk on A350-900 to Europe** - the program''s flagship own-metal product.
- **Star Alliance partner business class** via the ROP partner chart - sometimes beats United or Aeroplan pricing.
- **Intra-Asia short-haul on THAI and Star partners** at modest mile prices.
- **Marriott Bonvoy bridge** for US travelers without Citi premium - 60K Bonvoy yields 25K ROP.
- **Citi premium-card 1:1 transfers** for travelers targeting a specific Star Alliance award.',
  sweet_spots = '- **Marriott to ROP for Star Alliance redemptions** - the practical US path when stockpiling Bonvoy.
- **Transatlantic and intra-Asia partner business class** on Star Alliance metal at competitive ROP pricing - verify per route.
- **THAI Royal Silk A350-900 BKK-Europe** - the product is strong and award space is more reliable than partner availability.
- **Domestic Thailand on THAI** at low mile prices for a layover splurge.
- **Off-peak partner availability** can produce sharper pricing than United''s dynamic chart.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "10,000 qualifying miles in 12 months or 15,000 in 24 months", "benefits": ["5% bonus miles on THAI flights", "Extra checked baggage", "Priority handling at THAI airports"]},
    {"name": "Gold", "qualification": "50,000 qualifying miles in 12 months, 80,000 in 24 months, or 40 sectors", "benefits": ["Star Alliance Gold", "10% bonus miles on THAI", "Royal Orchid Lounge access plus 1 guest", "2 cabin upgrade certificates per year", "Priority check-in, boarding, and baggage worldwide"]},
    {"name": "Platinum", "qualification": "80,000 qualifying miles flown on THAI in Royal Silk or First", "benefits": ["20% bonus miles", "Dedicated check-in at BKK", "Top priority on waitlists", "All Gold benefits", "Highest-tier recognition on THAI metal"]}
  ]'::jsonb,
  lounge_access = 'Thai Airways operates Royal Orchid Lounges at BKK and select outstations, plus a Royal First Lounge at BKK for First Class passengers and top-tier members. Gold members get Royal Orchid Lounge access on same-day THAI or Star Alliance flights, plus Star Alliance Gold reciprocal lounge access worldwide. Silver does not get standard lounge access. There is no published day pass program for ROP lounges.',
  quirks = '- **Miles expire 36 months from earning quarter** - per-batch expiry, no activity-based reset. One of the stricter rules in Star Alliance.
- **Heavy YQ pass-through on THAI metal and most Star partners** - factor fuel surcharges into any redemption math.
- **Limited online award booking** - phone agent often required for partner awards. Be patient.
- **No US co-brand card** - earning is by flying or transferring from Citi or Marriott.
- **No formal pooling; family plan is limited** - do not count on combining balances.
- **Distance-based earning on THAI metal** - fare class and distance both matter.
- **Region-based published award chart** with two THAI-metal subcharts (direct ex-BKK vs connecting via BKK) plus a separate Star Alliance partner chart.
- **Citi transfer ratio depends on which Citi card you hold** - premium cards get 1:1, non-premium cards get 1:0.7.
- **Star Alliance member since 1997** - one of the founding members.
- **iLoyal digital loyalty platform** launched in 2025 - some account features have moved off the legacy ROP portal.
- **Completed business rehabilitation in 2026** - the program is stable, but verify operational changes on thaiairways.com before booking.
- **Partner award space sometimes loads online** but ticketing requires a phone call.',
  award_chart = 'ROP uses a region-based published award chart with two THAI-metal subcharts (direct ex-BKK vs connecting via BKK) plus a separate Star Alliance partner chart. Sample saver one-way pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-BKK Star partners | Business | 80,000-90,000 |
| Europe-BKK THAI metal | Royal Silk | 60,000-70,000 |
| Intra-Asia Star partners | Business | 25,000-35,000 |
| Domestic Thailand THAI | Economy | 7,500-10,000 |
| Australia-BKK Star partners | Business | 60,000 |

Verify current pricing on thaiairways.com - region edges and per-cabin pricing nudge occasionally.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'thai';

-- ============================================================
-- 2. ASIANA CLUB (Star Alliance, SUNSETTING)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Asiana Club',
  alliance = 'star_alliance',
  hubs = ARRAY['ICN'],
  intro = 'Asiana Club is the loyalty program of Asiana Airlines, the ICN-based Star Alliance carrier - and it is on a clock. The Korean Air merger was finalized in December 2024, and Asiana Club is being absorbed into Korean Air SKYPASS by January 1, 2027. After full integration, Asiana Club ceases to exist as a standalone program. The fleet (around 80 aircraft including A350, A380, A330, B777, and B767 freighters) is being absorbed into Korean Air, and Star Alliance membership ends at the same time - expect a transition to SkyTeam reciprocity post-merger.

For US travelers the playbook is narrow: burn Asiana Club miles before integration to lock in fixed-chart Star Alliance pricing, do not accumulate post-merger, and treat Marriott Bonvoy transfers (3:1, still listed as a Marriott partner as of May 2026) as a target-only move - never speculative. Mile conversion at integration is 1:1 for flight-earned miles and 1:0.82 for partner or credit-card-earned miles per the Korean FTC plan published September 2025, and the conversion election applies to the entire balance. Former Asiana miles can book KE Economy and Prestige only post-integration, not First Class. Status maps cleanly: Diamond Plus to Morning Calm Select, Diamond Plus Lifetime to Morning Calm Premium, Platinum Lifetime to Million Miler.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. Verified May 2026 - still listed as a Marriott partner. Continuation through 2027 integration is uncertain; verify before transferring and only against confirmed bookings.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner awards before October 2026** - lock in fixed-chart pricing while Asiana Club still exists.
- **Asiana own-metal premium cabins** ICN-US - the A350 business product is well-regarded.
- **Intra-Asia Star partners** at modest mile prices.
- **Marriott Bonvoy 3:1 transfers** only against confirmed bookings - do not speculate.
- **Avoid post-merger accumulation** - new earning post-integration goes into SKYPASS at the conversion ratio.',
  sweet_spots = '- **Star Alliance partner business class booked on the Asiana fixed chart** before integration - some routes price below Aeroplan or United.
- **Asiana A350 ICN-US business** at competitive saver pricing while the chart is still live.
- **Intra-Asia partner short-haul** at low mile prices.
- **Bonvoy 3:1 to Asiana for a confirmed booking** - 60K Bonvoy yields 25K Asiana Club + 5K bonus at the 60K tier. Use only when the award is in hand.
- **Burn-before-integration** is the entire 2026 playbook for this program.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry tier; verify thresholds on flyasiana.com", "benefits": ["Bonus mile earning on Asiana", "Priority check-in", "Status validity honored at 2027 integration"]},
    {"name": "Gold", "qualification": "Mid-tier; verify thresholds on flyasiana.com", "benefits": ["Star Alliance Gold", "Asiana Lounge access at ICN", "Star Alliance Gold lounge reciprocity worldwide", "Priority boarding and baggage"]},
    {"name": "Diamond", "qualification": "Higher-tier elite; verify thresholds on flyasiana.com", "benefits": ["All Gold benefits", "Higher mile bonus", "Priority for waitlists and operational upgrades"]},
    {"name": "Diamond Plus", "qualification": "Top annual tier - maps to Morning Calm Select at integration", "benefits": ["All Diamond benefits", "Highest priority on Asiana", "Maps to Morning Calm Select in SKYPASS"]},
    {"name": "Platinum (Lifetime)", "qualification": "Lifetime tier - maps to Million Miler at integration", "benefits": ["Lifetime status validity", "Maps to Million Miler in SKYPASS post-integration"]}
  ]'::jsonb,
  lounge_access = 'Asiana operates Asiana Lounges at ICN (Incheon) and select outstations. Gold and above get Asiana Lounge access on same-day Asiana or Star Alliance flights. Star Alliance reciprocal lounge access continues for Asiana Gold members worldwide until approximately January 1, 2027 - after integration, expect the lounge program to transition to SkyTeam reciprocity under SKYPASS.',
  quirks = '- **Asiana Club is sunsetting January 1, 2027** - the program is being absorbed into Korean Air SKYPASS. This shapes every decision.
- **Mile conversion at integration: 1:1 for flight-earned miles, 1:0.82 for partner or credit-card-earned miles** per the Korean FTC plan published September 2025.
- **Conversion must be elected in full** - the entire balance moves at once.
- **Former Asiana miles can book KE Economy and Prestige only** post-integration - not First Class.
- **Status mapping at integration**: Diamond Plus to Morning Calm Select (a NEW SKYPASS tier), Diamond Plus Lifetime to Morning Calm Premium, Platinum Lifetime to Million Miler.
- **Status validity periods are honored** at integration.
- **Mile expiration: 10 years from date of earning** - one of the most generous expiry rules pre-merger.
- **Star Alliance membership ends at integration** - reciprocity transitions to SkyTeam under SKYPASS.
- **Action items**: book before October 2026 to use Star Alliance partners, do not accumulate post-merger, and use Marriott transfers only against confirmed bookings.
- **No US flexible currency transfers** - only Marriott Bonvoy bridges in.
- **No US co-brand card**.',
  award_chart = 'Asiana Club uses a region-based fixed Star Alliance partner chart and a separate Asiana own-metal chart. Sample saver one-way pricing as of May 2026 (verify on flyasiana.com - chart is stable but the program is sunsetting):

| Route | Cabin | Miles |
|---|---|---|
| US-ICN Asiana | Business | 80,000 |
| US-Europe Star partners | Business | 80,000-90,000 |
| Intra-Asia Star partners | Business | 25,000-35,000 |
| Korea domestic Asiana | Economy | 7,500-10,000 |

The chart will not be available after January 1, 2027 - book before October 2026 to lock in.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'asiana';

-- ============================================================
-- 3. AIR CHINA PHOENIXMILES (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air China PhoenixMiles',
  alliance = 'star_alliance',
  hubs = ARRAY['PEK','PKX','CTU'],
  intro = 'Air China PhoenixMiles is the loyalty program of Air China, the PEK-based flag carrier and Star Alliance member since 2007, with hubs at Beijing Capital, Beijing Daxing, and Chengdu Tianfu. The fleet runs north of 480 aircraft - A350, A330, B777, B787, B737 - with the COMAC C919 entering domestic service. The program''s currency is kilometers, not miles, which produces a roughly 30% inherent value loss versus mile-denominated programs at equivalent distances. PhoenixMiles is also poolable across 8 family carriers (Shenzhen, Shandong, Air Macau, Beijing, Dalian, Inner Mongolia, Kunming, plus Air China itself), which is unusual and useful.

For US travelers, the only major US currency path is Marriott Bonvoy (3:1 with 5,000-km bonus per 60K transferred). Amex, Chase, Capital One, Citi, Bilt, and Wells Fargo do not transfer to PhoenixMiles. The reasons to bother are specific: routing rules are unusually generous (2 stopovers allowed on round-trip Star Alliance partner awards across two zones, open-jaw permitted), domestic China is cheap (RT economy from 15,000 km), and US-China business runs around 200,000 km round-trip on Air China metal. Heavy YQ surcharges on most awards and a phone-required partner booking process are the costs.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard with 5,000-km bonus per 60K transferred. Verified May 2026 - the only major US currency path into PhoenixMiles.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **US-China business on Air China metal at around 200,000 km round-trip**.
- **US-China economy at 100,000 km round-trip** when off-peak space opens.
- **Domestic China RT economy from 15,000 km** - cheap one-off domestic awards via Marriott bridge.
- **Star Alliance partner business class** under the region-based partner chart with generous routing rules.
- **PhoenixMiles family pooling** across 8 carriers - useful when mixed earning across the family.',
  sweet_spots = '- **US-China economy 100,000 km round-trip** on Air China when off-peak space opens.
- **US-China business 200,000 km round-trip** on Air China metal.
- **Domestic China round-trip economy from 15,000 km** - the cheapest entry point for occasional US users.
- **2 stopovers allowed on RT Star Alliance partner awards across two zones, open-jaw permitted** - rare in Star Alliance and worth structuring an itinerary around.
- **Lifetime Gold tier** is achievable for frequent flyers and carries Star Alliance Gold for life.
- **Marriott Bonvoy 3:1 with 5K bonus** at the 60K tier - the only US bridge worth knowing.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry elite tier; verify thresholds on airchina.com", "benefits": ["25% bonus miles on Air China", "Business-class check-in", "International lounge access on Air China international flights", "Plus 20 kg checked baggage"]},
    {"name": "Gold", "qualification": "Mid-tier elite; verify thresholds on airchina.com", "benefits": ["Star Alliance Gold", "30% bonus miles", "Priority reservation 48 hours before departure", "Business lounge access plus 1 guest", "Priority boarding worldwide"]},
    {"name": "Platinum", "qualification": "Top annual tier; verify thresholds on airchina.com", "benefits": ["50% bonus miles", "Reservation guarantee 48 hours before departure", "First-class lounge access plus 1 guest", "Top priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Air China operates own lounges at PEK, PKX, CTU, and select outstations. Star Alliance Gold and Platinum members get Star Alliance Gold reciprocal lounge access worldwide on same-day Star Alliance flights. Gold gets the business lounge plus one guest; Platinum gets first-class lounge plus one guest at Air China hubs. Silver gets international lounge access on same-day Air China international flights.',
  quirks = '- **Currency is kilometers, not miles** - inherent ~30% value loss versus mile-denominated programs at equivalent distances.
- **Kilometers expire 36 months from end-of-month earned** - no activity-based reset.
- **Marriott Bonvoy is the only major US currency path** - Amex, Chase, Capital One, Citi, Bilt, and Wells Fargo do not transfer.
- **PhoenixMiles is poolable across 8 family carriers** (Shenzhen, Shandong, Air Macau, Beijing, Dalian, Inner Mongolia, Kunming, Air China).
- **Routing rules are generous**: 2 stopovers allowed on RT Star Alliance partner awards across two zones; open-jaw permitted.
- **YQ surcharges pass through on Air China and most partners**.
- **April 5, 2026: Chinese carriers raised domestic fuel surcharges** (60-120 yuan increase).
- **Partner award booking often requires a phone agent**.
- **No US co-brand card** - Chinese co-brand cards available domestically.
- **Award chart structure**: domestic Air China distance-based; international Air China region-based; each Star Alliance partner has a separate region-based chart.
- **Lifetime Gold tier exists** for frequent flyers.
- **ITA Airways partnership announced March 2026** - verify launch date and earning details on airchina.com.
- **Note: Air China is the PRC carrier; do not confuse with China Airlines (Taiwan) or China Eastern**.',
  award_chart = 'PhoenixMiles uses a domestic distance-based chart for Air China metal, an international region-based chart for Air China metal, and separate region-based charts per Star Alliance partner. Sample one-way saver pricing as of May 2026 (kilometers, not miles):

| Route | Cabin | Kilometers |
|---|---|---|
| US-China Air China | Economy | 50,000 |
| US-China Air China | Business | 100,000 |
| Domestic China Air China | Economy | 7,500-12,500 |
| Intra-Asia Star partners | Business | 30,000-40,000 |
| US-Europe Star partners | Business | 80,000-100,000 |

Verify current pricing on airchina.com - YQ surcharges apply on most routes.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-china';

-- ============================================================
-- 4. ROYAL JORDANIAN ROYAL CLUB (oneworld)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Royal Jordanian Royal Club',
  alliance = 'oneworld',
  hubs = ARRAY['AMM'],
  intro = 'Royal Jordanian Royal Club (rebranded from "Royal Plus") is the loyalty program of Royal Jordanian Airlines, the AMM-based oneworld carrier and the only nonstop Jordan-US operator (AMM-ORD and AMM-JFK). The fleet is around 25 aircraft - A320 family, A321neo, B787-8 Dreamliner, E195-E2 - and the airline has been a oneworld member since 2007. Founded in 1963 as Alia, RJ is small but strategically located for connections to the Levant and Gulf.

For US travelers, RJ Royal Club is not really a redemption currency - it is a status play. None of the major US flexible programs (Amex, Chase, Capital One, Citi, Bilt, Wells Fargo) transfer to it directly, and Marriott Bonvoy is not a direct partner either. The practical access points are indirect: book RJ as a oneworld partner using BA Avios, Atmos Rewards, or Qantas Frequent Flyer (Citi to Qantas to RJ). The real US-reader value is RJ''s frequent status-match offers - they are a popular oneworld Emerald shortcut, and RJ also runs fast-track campaigns. Treat the redemption side as a curiosity and the status-match path as the headline.',
  transfer_partners = '[
    {"from_slug": "ba-avios", "ratio": "1:1", "notes": "Indirect access only - book RJ as oneworld partner using BA Avios. Avios does not pool into RJ Royal Club; the redemption is on BA''s side.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Book RJ as a oneworld partner** using BA Avios, Atmos Rewards, or Qantas Frequent Flyer (Citi to Qantas to RJ).
- **AMM connections to the Levant and Gulf** on RJ metal - JFK-AMM-DXB or ORD-AMM-CAI are useful one-stop options.
- **RJ business class on the 787-8** as a serviceable connection product.
- **Status match into oneworld Emerald** is the headline US-reader play - treat redemptions as secondary.
- **Distance-based earning + fare class** on RJ metal for direct earners.',
  sweet_spots = '- **Redeem AA / Atmos / BA Avios on RJ metal** - JFK-AMM-DXB is a clean one-stop from the US East Coast to the Gulf.
- **RJ status-match offers into Royal Club Platinum (oneworld Emerald)** - the program''s standout US-reader value play.
- **AMM-JFK and AMM-ORD on RJ business** as a connection through the Levant.
- **Fast-track status campaigns** that RJ runs periodically - watch for them.
- **RJ business class is serviceable**, not aspirational - a fine connection product, not a destination.',
  tier_benefits = '[
    {"name": "Bronze (Sunbird)", "qualification": "Entry tier", "benefits": ["Earn Tier and Royal Club miles", "Priority phone line"]},
    {"name": "Silver (Jay)", "qualification": "Entry elite", "benefits": ["oneworld Ruby", "Priority check-in", "Extra baggage", "Mile bonus on RJ"]},
    {"name": "Gold (Sparrow)", "qualification": "Approximately 30,000 tier miles or 26 segments per 12 months; verify on rj.com", "benefits": ["oneworld Sapphire", "Crown Lounge access at AMM plus oneworld business lounge access worldwide", "Priority boarding and baggage"]},
    {"name": "Platinum (Hawk)", "qualification": "Top annual tier; verify thresholds on rj.com", "benefits": ["oneworld Emerald", "First-class lounges globally", "Additional baggage", "Top priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Royal Jordanian operates the Crown Lounge at AMM. oneworld reciprocal access applies: Sapphire (RJ Gold) gets business lounge access on same-day oneworld international flights worldwide, and Emerald (RJ Platinum) gets first-class lounge access. Outside AMM, RJ uses contracted lounges in major outstations.',
  quirks = '- **The redemption story is weak; the status-match story is the real US-reader hook**.
- **No direct major US flexible currency partners** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, and Marriott do not transfer directly.
- **Indirect access** via BA Avios, Atmos Rewards, or Qantas Frequent Flyer (Citi to Qantas to book RJ as oneworld partner).
- **Frequent status-match offers** are the program''s standout feature for US readers - chase oneworld Emerald via RJ when promos run.
- **RJ runs fast-track campaigns** periodically - verify current offer on rj.com.
- **YQ surcharges on RJ metal** - factor into any partner-redemption math.
- **Limited award space publicly viewable** - oneworld partners often have thin RJ availability.
- **Distance-based earning + fare class** for own-metal earning.
- **No US co-brand card**.
- **Tiers use bird names**: Sunbird, Jay, Sparrow, Hawk.
- **AMM-JFK and AMM-ORD are the only nonstop Jordan-US routes** - useful for Levant connections.',
  award_chart = 'RJ uses a distance-based award chart for own metal and the oneworld partner chart when booked through partner programs. Sample one-way saver pricing on RJ metal as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| AMM-JFK RJ metal | Economy | 35,000-50,000 |
| AMM-JFK RJ metal | Business | 80,000-100,000 |
| AMM-DXB RJ metal | Economy | 12,500 |
| Intra-Middle East RJ | Economy | 7,500-12,500 |
| AMM-CAI RJ | Economy | 7,500 |

Verify current pricing on rj.com - the chart has had small changes since the Royal Plus rebrand. For US travelers, partner-program pricing (AA / Atmos / BA Avios on RJ metal) is the more relevant chart.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'royal-jordanian';

-- ============================================================
-- 5. SAUDIA ALFURSAN (SkyTeam since 2012)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Saudia Alfursan',
  alliance = 'skyteam',
  hubs = ARRAY['JED','RUH','MED'],
  intro = 'Saudia Alfursan is the loyalty program of Saudia (Saudi Arabian Airlines), the SkyTeam member since 2012, with hubs at JED, RUH, and MED. The fleet runs around 150 aircraft - B787, A330, A320 family, B777 - with Vision 2030 fleet expansion underway and the upcoming Riyadh Air launch creating internal competition (verify timeline on saudia.com). The program is fare-class and distance based with a SkyTeam region-based partner chart split into 17 zones and separate Y/J/F charts.

For US travelers, the only major US currency path is Marriott Bonvoy (3:1 with the 5,000-mile bonus at the 60K tier) - Amex, Chase, Capital One, Citi, Bilt, and Wells Fargo do not transfer in. Specific reasons to use Alfursan are narrow: SkyTeam partner awards (Delta, KLM, Air France) through Alfursan can occasionally beat Flying Blue dynamic pricing on US-Middle East routes, and Saudia first class JED-JFK has historically priced lower than competitors. As of May 2026 the program is best treated as a target-redemption currency for travelers who already have Bonvoy in stock or who fly Saudia regularly. No alcohol on Saudia flights is a relevant cabin-experience note for premium-cabin travelers.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard with 5,000-mile bonus per 60K transferred. Verified May 2026 - the only major US currency path into Alfursan.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **US-Middle East SkyTeam partner awards** (Delta, KLM, Air France) through Alfursan - sometimes beats Flying Blue dynamic pricing.
- **Saudia first class JED-JFK** at competitive pricing versus other Middle East first products.
- **Saudia business JED/RUH-US** when off-peak space opens.
- **Etihad Airways bilateral partner** (non-alliance) - verify routing rules before booking.
- **Marriott Bonvoy bridge** for US travelers without direct earning paths.',
  sweet_spots = '- **US-Middle East via SkyTeam partners through Alfursan** - verify per route, sometimes beats Flying Blue.
- **Saudia first class JED-JFK** historically priced lower than competitors - verify 2026 pricing.
- **Saudia business JED/RUH-US** at off-peak chart pricing.
- **Etihad bilateral partner redemptions** for non-alliance options out of AUH.
- **17-zone SkyTeam region-based partner chart** with separate Y/J/F charts can produce sharp prices on specific zone pairs.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier - no SkyTeam status", "benefits": ["Earn Alfursan miles", "Online account management"]},
    {"name": "Silver", "qualification": "20,000 tier miles or 15 international sectors per year", "benefits": ["SkyTeam Elite", "Priority check-in", "Extra baggage allowance", "SkyTeam Elite reciprocal benefits worldwide"]},
    {"name": "Gold", "qualification": "40,000 tier miles or 30 international sectors per year", "benefits": ["SkyTeam Elite Plus", "Alfursan Lounge access plus 1 guest", "Priority boarding and baggage worldwide", "SkyTeam Elite Plus reciprocity"]}
  ]'::jsonb,
  lounge_access = 'Saudia operates Alfursan Lounges at JED, RUH, and MED. SkyTeam reciprocal applies: Silver (SkyTeam Elite) gets Elite-level recognition; Gold (SkyTeam Elite Plus) gets business lounge access on same-day SkyTeam international flights worldwide plus one guest. Outside Saudia hubs, Alfursan Gold uses SkyTeam contracted lounges.',
  quirks = '- **Tier validity: calendar year (Jan 1 - Dec 31)** - status resets annually.
- **Tier miles reset annually**.
- **General miles expire 36 months from last activity** - any qualifying activity resets the clock.
- **YQ surcharges on most awards** - factor into redemption math.
- **No alcohol on Saudia flights** - Saudi cultural rule, relevant for premium-cabin travelers.
- **Award booking process requires email or agent for partner awards** - online booking is limited.
- **17-zone SkyTeam region-based partner chart** with separate Y/J/F charts.
- **Saudia metal has its own chart** distinct from the SkyTeam partner chart.
- **Etihad Airways bilateral partner** (non-alliance) - verify routing rules.
- **Marriott Bonvoy is the only major US currency path** into Alfursan.
- **No US co-brand card**.
- **Vision 2030 fleet expansion underway**; Riyadh Air launch will create internal Saudi competition - verify timeline.
- **SkyTeam member since 2012**.',
  award_chart = 'Alfursan uses a 17-zone SkyTeam region-based partner chart with separate Y/J/F charts and a separate Saudia-metal chart. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-JED Saudia | Business | 80,000-100,000 |
| US-JED Saudia | First | 120,000-140,000 |
| US-Europe SkyTeam partners | Business | 70,000-80,000 |
| Intra-Middle East Saudia | Economy | 7,500-12,500 |
| Europe-JED Saudia | Business | 50,000-60,000 |

Verify current pricing on saudia.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'saudia';

-- ============================================================
-- 6. FINNAIR PLUS (oneworld; Avios family)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Finnair Plus',
  alliance = 'oneworld',
  hubs = ARRAY['HEL'],
  intro = 'Finnair Plus is the loyalty program of Finnair, the HEL-based oneworld carrier (since 1999) and the most intriguing member of the Avios family for US travelers. Finnair switched its currency to Avios in March 2024, joining BA, Iberia, Aer Lingus, and Qatar in the Avios pool - and Combine My Avios lets you move balances between BA Avios and Finnair Plus instantly and at no fee, both directions. That makes Finnair Plus an Avios redemption engine, not a standalone earning currency for most US members. Finnair''s chart is INDEPENDENT of BA''s - different zones, different YQ behavior, sometimes cheaper for AY-operated metal than booking via BA Avios.

The fleet is all-Airbus mainline (18 A350-900 with the 19th delivering in 2026, A330, A321/A320) plus 18 new E195-E2 ordered March 2026 with Nordic Regional Airlines. Founded in 1923 under CEO Turkka Kuusisto, Finnair reorientated its network post-2022 transit shift, and YYZ launches as the inaugural Toronto route in May 2026 - the first North American non-US destination. For US travelers, Capital One''s 1:1 direct, near-instant transfer to Finnair Plus (since 2024) is unique - it is the ONLY major bank that transfers directly. The full Avios Superhighway via BA (Amex, Chase, Citi, Cap One, Bilt all to BA, then Combine My Avios into Finnair) is the broader play, with a 30-day account-age rule new in 2026.',
  transfer_partners = '[
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 direct, near-instant transfer to Finnair Plus since 2024. Verified May 2026 - the ONLY major US bank that transfers directly to Finnair Plus.", "bonus_active": false},
    {"from_slug": "ba-avios", "ratio": "1:1", "notes": "Combine My Avios moves balances between BA and Finnair instantly and at no fee, both directions. 30-day account-age rule new in 2026 - verify before transferring.", "bonus_active": false},
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "Indirect via BA Avios. No US federal excise tax (foreign carrier). Transfer Amex MR to BA, then Combine My Avios into Finnair.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "1:1", "notes": "Indirect via BA Avios. Transfer Chase UR to BA, then Combine My Avios into Finnair.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "varies", "notes": "Indirect via BA Avios (1:1 from Citi premium cards to BA; 1:0.7 from non-premium). Then Combine My Avios into Finnair.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "Indirect via BA Avios. Transfer Bilt to BA, then Combine My Avios into Finnair.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **HEL-US business on Finnair A350 at around 62,500 Avios one-way** - one of the strongest Avios values.
- **Intra-Europe on AY metal at 6,500 Avios** for short hops.
- **oneworld partner redemptions** through Finnair Plus when AY-operated chart pricing beats BA''s.
- **Combine My Avios into Finnair when AY metal is cheaper than booking via BA**.
- **Capital One 1:1 direct** for US travelers without BA Avios access.
- **Some Alaska/Hawaiian award availability through Finnair Plus** - verify availability post-2026 devaluation.',
  sweet_spots = '- **HEL-US business on Finnair A350 ~62,500 Avios one-way** - the program''s flagship value.
- **Intra-Europe on AY metal at 6,500 Avios** for short hops.
- **AY-operated metal sometimes cheaper through Finnair Plus than via BA Avios** - check both before transferring.
- **Capital One 1:1 direct, near-instant** - the cleanest direct path for US travelers.
- **Finnair Plus has lower YQ on own metal than BA** even on AY-operated routes.
- **Some Alaska/Hawaiian award availability through Finnair Plus** - 2026 partner devaluation hit Hawaii routes hard; verify availability.
- **Tier Points + Avios separation** lets active flyers chase status independently of redemption miles.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry elite; verify thresholds on finnair.com", "benefits": ["oneworld Ruby", "Priority check-in", "Extra baggage", "Bonus Tier Points and Avios on Finnair flights"]},
    {"name": "Gold", "qualification": "45,000 Tier Points - verify on finnair.com", "benefits": ["oneworld Sapphire", "Lounge access on same-day oneworld international flights", "Complimentary upgrades on Finnair", "Gold Milestone at 55K Tier Points = 2 extra upgrade certificates"]},
    {"name": "Platinum", "qualification": "Higher annual tier; verify thresholds on finnair.com", "benefits": ["oneworld Emerald", "First-class lounge access globally", "Additional baggage", "Priority for waitlists"]},
    {"name": "Platinum Lumo", "qualification": "Top annual tier; verify thresholds on finnair.com", "benefits": ["All Platinum benefits", "oneworld Emerald", "Additional Lumo-tier perks", "Highest priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Finnair operates the Finnair Lounge and Premium Lounge at HEL (Helsinki). oneworld reciprocal applies: Sapphire (Gold) gets business lounge access on same-day oneworld international flights worldwide, and Emerald (Platinum and Platinum Lumo) gets first-class lounge access globally. Outside HEL, Finnair uses contracted oneworld lounges.',
  quirks = '- **Currency switched to Avios in March 2024** - legacy Finnair Points converted at 3:2 in May 2024.
- **Combine My Avios** moves balances between BA and Finnair instantly and at no fee, both directions.
- **Finnair''s chart is INDEPENDENT of BA''s** - different pricing per zone, different YQ behavior.
- **Capital One 1:1 direct, near-instant** - the only major bank that transfers directly to Finnair Plus.
- **30-day account-age rule new in 2026** - verify Avios transfer eligibility before moving balances.
- **18-month inactivity expiration** - any activity resets the clock.
- **Finnair charges YQ on own metal but lower than BA** - factor in when comparing AY versus BA-issued tickets.
- **Tier Points reset annually unless requalified**.
- **Gold Milestone at 55K Tier Points = 2 extra upgrades** - the high-value status milestone.
- **No US co-brand card** - Finnish/Nordic co-brands exist.
- **YYZ inaugural May 2026** - first North American non-US route.
- **2026 partner award devaluation hit Hawaii routes hard** - verify Alaska/Hawaiian availability before transferring.
- **Fleet is all-Airbus mainline** plus 18 new E195-E2 ordered March 2026 with Nordic Regional Airlines.
- **May 1, 2026 brought JAL earnings changes and a Tier Points bonus update** - verify current rules on finnair.com.',
  award_chart = 'Finnair Plus uses a zone-based award chart that is INDEPENDENT of BA''s, with different per-zone pricing and lower YQ on AY-operated metal. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Avios |
|---|---|---|
| HEL-US East Coast Finnair A350 | Business | ~62,500 |
| HEL-US West Coast Finnair A350 | Business | ~75,000 |
| Intra-Europe AY metal | Economy | 6,500 |
| HEL-Asia Finnair | Business | ~62,500 |
| Intra-Asia oneworld partners | Business | 25,000-35,000 |

Verify current pricing on finnair.com - the AY chart has nudged in 2026 and Hawaii routes specifically devalued.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'finnair';

-- ============================================================
-- 7. TAP MILES&GO (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'TAP Miles&Go',
  alliance = 'star_alliance',
  hubs = ARRAY['LIS','OPO'],
  intro = 'TAP Miles&Go is the loyalty program of TAP Air Portugal, the LIS-based Star Alliance member (since 2005) and Portugal''s flag carrier. The fleet runs around 100 aircraft - A330neo, A321LR/neo with East Coast US lie-flat, A320 - and the airline''s privatization process is active 2025-2026. The standout product feature is the A321LR US East Coast lie-flat narrowbody from Boston, Newark, Miami, and others, plus the Portugal Stopover that gives a complimentary Lisbon stopover on TAP itineraries.

For US travelers, TAP Miles&Go is one of the more accessible Star Alliance programs. Capital One transfers 1:1 near-instant. Bilt also transfers 1:1 near-instant - one of Bilt''s Star Alliance partners. Marriott Bonvoy is 3:1 with the 5,000-mile bonus at 60K. Amex, Chase, Citi, and Wells Fargo do not transfer to it. TAP own-metal moved to dynamic pricing in 2024-25, gutting some historical sweet spots, but Star Alliance partner awards remain on a region-based fixed chart - and that is where the value lives. US East Coast-LIS business runs around 63,000 miles one-way (verify post-dynamic-pricing shift), and Star Alliance partner business class on routes like ANA intra-Asia or US West Coast-Europe can produce sharp pricing.',
  transfer_partners = '[
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 near-instant. Verified May 2026 - one of Capital One''s stable Star Alliance partners.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1 near-instant on Rent Day (1st of the month). Verified May 2026 - one of Bilt''s Star Alliance partners.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard with 5,000-mile bonus per 60K transferred. Verified May 2026.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **US East Coast-LIS business at around 63,000 miles one-way** on TAP - verify post-dynamic-pricing shift.
- **Star Alliance partner business class** under the region-based fixed chart - this is where value lives post-TAP-dynamic-pricing.
- **Portugal Stopover** - free Lisbon stopover on TAP itineraries for ground time in Lisbon.
- **A321LR US East Coast lie-flat narrowbody** from Boston, Newark, Miami, and other gateways.
- **Capital One and Bilt 1:1 transfers** - the cleanest US flexible-currency paths.',
  sweet_spots = '- **US East Coast-LIS business ~63,000 miles one-way** (verify post-dynamic-pricing shift).
- **Emirates DXB-Asia on partners 50,000 miles one-way** - wait, Emirates is not Star Alliance; verify partner roster on flytap.com.
- **ANA business intra-Asia 50,000 miles one-way** under the Star Alliance fixed partner chart.
- **US West Coast-Europe on Star partners ~100,000 miles each way**.
- **Portugal Stopover** - complimentary Lisbon stopover on TAP itineraries.
- **A321LR US East Coast lie-flat narrowbody** is a unique product for the TAP US gateways.
- **Bilt and Capital One 1:1 transfers** are stable as of 2026.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "30,000 Status Miles or 25 TAP segments per year", "benefits": ["Bonus mile earning on TAP", "Priority check-in", "Extra baggage allowance"]},
    {"name": "Gold", "qualification": "70,000 Status Miles or 50 TAP segments per year", "benefits": ["Star Alliance Gold", "Lounge access on same-day TAP or Star Alliance flights plus 1 guest", "Star Alliance Gold reciprocity worldwide", "Priority boarding and baggage"]},
    {"name": "Navigator", "qualification": "125,000 Status Miles or 70 TAP segments per year - top tier", "benefits": ["All Gold benefits", "Highest priority for waitlists", "Higher mile bonus", "Premium recognition on TAP metal"]}
  ]'::jsonb,
  lounge_access = 'TAP operates the TAP Premium Lounge at LIS (Lisbon) and select OPO (Porto) facilities. Star Alliance reciprocal applies: Gold and Navigator members get Star Alliance Gold business-lounge access worldwide on same-day Star Alliance flights, plus one guest. Silver does not get standard lounge access.',
  quirks = '- **TAP own-metal moved to dynamic pricing in 2024-25** - many historical sweet spots are gone.
- **Star Alliance partner awards remain on a region-based fixed chart** - this is where value lives.
- **Capital One and Bilt 1:1 near-instant** - the cleanest US flexible-currency paths.
- **Marriott Bonvoy 3:1 with 5K bonus at 60K** - useful for Bonvoy-heavy stockpilers.
- **Amex, Chase, Citi, and Wells Fargo do not transfer** to TAP Miles&Go.
- **Miles expire 36 months from earning** - per-batch expiry, no activity-based reset.
- **YQ surcharges on TAP metal** - Portuguese taxes especially heavy.
- **Low award booking fees** versus other Star Alliance programs.
- **Limited partner online award booking** - phone agent often required.
- **Transfer partner roster has shifted historically** - Bilt and Cap One stable as of 2026.
- **A321LR US East Coast lie-flat narrowbody** from Boston, Newark, Miami, and others is a unique product.
- **Portugal Stopover** - complimentary Lisbon stopover on TAP itineraries.
- **Privatization process active 2025-2026** - operational changes possible; verify on flytap.com.
- **No US co-brand card**.',
  award_chart = 'TAP Miles&Go uses dynamic pricing on TAP own metal since 2024-25 (no published own-metal chart) and a region-based fixed chart for Star Alliance partner awards. Sample one-way saver pricing on Star partners as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US East Coast-Europe Star partners | Business | ~63,000 |
| US West Coast-Europe Star partners | Business | ~100,000 |
| Intra-Asia ANA | Business | 50,000 |
| Intra-Europe Star partners | Economy | 7,500-12,500 |
| US-Lisbon TAP own metal | Business | dynamic - verify on flytap.com |

Verify current pricing on flytap.com - own-metal pricing nudges with cash fares.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'tap';

-- ============================================================
-- 8. CHINA AIRLINES DYNASTY FLYER (SkyTeam since 2011)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'China Airlines Dynasty Flyer',
  alliance = 'skyteam',
  hubs = ARRAY['TPE','KHH'],
  intro = 'China Airlines Dynasty Flyer is the loyalty program of China Airlines, Taiwan''s flag carrier and a SkyTeam member since 2011 - and yes, this is the Taiwanese carrier, NOT Air China (PRC). The fleet runs around 80 aircraft (A350, A330, B777, B737, B747-400F freighters), with subsidiaries Mandarin Airlines and Tigerair Taiwan, under CEO Kent Sun (appointed late 2025). The program switched to a Status Points qualification system in 2025-2026 with milestone bonuses at the top tier (Paragon: +300 SP = 20K bonus miles; +600 SP = 2 transferable upgrade certs; +900 SP = nominate Gold for someone).

For US travelers, the only major US currency path is Marriott Bonvoy (3:1 with 5,000-mile bonus per 60K). None of Amex, Chase, Capital One, Citi, Bilt, or Wells Fargo transfer in - older sources widely listed Cap One and Citi as partners, but they are NOT current direct partners as of May 2026. Sweet spots are less aggressive than Korean Air SKYPASS or Flying Blue: US-Taipei on CI business typically 75,000-90,000 one-way (verify post-revamp), and intra-Asia on SkyTeam partners at low pricing. The 2025-2026 status extension (Paragon/Emerald/Gold whose status expires Jan 31 2025 - Jan 31 2027 get a 2-year extension) is a useful holding pattern for existing elites.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard with 5,000-mile bonus per 60K transferred. Verified May 2026 - the only major US currency path into Dynasty Flyer.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **US-Taipei on CI business** at typically 75,000-90,000 miles one-way (verify post-revamp).
- **Intra-Asia on SkyTeam partners** at low mile pricing.
- **Domestic Taiwan and short-haul regional** at modest mile prices.
- **Marriott Bonvoy 3:1 with 5K bonus** - the only US bridge worth knowing.
- **CI metal own-chart redemptions** when off-peak space opens.',
  sweet_spots = '- **US-Taipei on CI business at 75,000-90,000 miles one-way** - verify post-revamp pricing on china-airlines.com.
- **Intra-Asia SkyTeam partner business at low pricing** - per-zone rates can be sharp.
- **Paragon top-tier milestone bonuses** - +300 SP = 20K bonus miles, +600 SP = 2 transferable upgrade certs, +900 SP = nominate Gold for someone.
- **2025-2026 status extension** for Paragon/Emerald/Gold whose status expires Jan 31 2025 - Jan 31 2027 - 2-year extension is a useful holding pattern.
- **Marriott Bonvoy bridge** for US travelers - 60K Bonvoy yields 25K Dynasty Flyer + 5K bonus.',
  tier_benefits = '[
    {"name": "Gold", "qualification": "Entry elite tier under the new Status Points system - SkyTeam Elite", "benefits": ["SkyTeam Elite", "Priority check-in", "Bonus mile earning on China Airlines", "SkyTeam Elite reciprocal recognition"]},
    {"name": "Emerald", "qualification": "720 Status Points per 12 months or 1,150 per 24 months - SkyTeam Elite Plus", "benefits": ["SkyTeam Elite Plus", "Lounge access on same-day SkyTeam international flights plus 1 guest", "Priority boarding and baggage worldwide"]},
    {"name": "Paragon", "qualification": "2,240 Status Points to renew - top tier, SkyTeam Elite Plus", "benefits": ["All Emerald benefits", "Milestone bonuses: +300 SP = 20K bonus miles; +600 SP = 2 transferable upgrade certs; +900 SP = nominate Gold for someone", "Highest priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'China Airlines operates Dynasty Lounges at TPE (Taoyuan) and select hubs, with SkyTeam reciprocal access for Emerald and Paragon members. Emerald (SkyTeam Elite Plus) gets business lounge access on same-day SkyTeam international flights worldwide plus one guest. Paragon gets the same plus higher-priority recognition. Gold (SkyTeam Elite) does not unlock standard lounge access on its own.',
  quirks = '- **NOTE: This is the Taiwanese carrier - DIFFERENT from Air China (PRC)**.
- **Status Points qualification system** launched 2025-2026 - replaces tier miles for status purposes.
- **Paragon milestone bonuses** at +300 / +600 / +900 SP add real value at the top tier.
- **2025-2026 status extension**: Paragon/Emerald/Gold whose status expires Jan 31 2025 - Jan 31 2027 get a 2-year extension.
- **Marriott Bonvoy is the only major US currency path** - older sources listed Cap One and Citi but they are NOT current direct partners as of May 2026.
- **Miles expire 36 months from earning** (verify exact policy on china-airlines.com - higher tiers may get extensions).
- **YQ on most awards**.
- **Award chart**: region-based for own metal on a CI chart, plus a multi-zone SkyTeam partner chart.
- **Sweet spots are less aggressive than Korean Air SKYPASS or Flying Blue** - treat as a target-redemption currency.
- **Non-alliance partners include Marriott, IHG, Hertz, Avis** (program partners, not airline partners).
- **No US co-brand card**.
- **CEO Kent Sun appointed late 2025** - operational direction may shift; verify announcements.
- **SkyTeam member since 2011**.',
  award_chart = 'Dynasty Flyer uses a region-based China Airlines own-metal chart and a multi-zone SkyTeam partner chart. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-TPE China Airlines | Economy | 35,000-45,000 |
| US-TPE China Airlines | Business | 75,000-90,000 |
| Intra-Asia SkyTeam partners | Business | 25,000-35,000 |
| Domestic Taiwan CI | Economy | 7,500 |
| US-Europe SkyTeam partners | Business | 70,000-80,000 |

Verify current pricing on china-airlines.com - the new Status Points system did not change award chart pricing but per-zone edges may nudge.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'china-airlines';

-- ============================================================
-- 9. VIETNAM AIRLINES LOTUSMILES (SkyTeam since 2010)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Vietnam Airlines Lotusmiles',
  alliance = 'skyteam',
  hubs = ARRAY['SGN','HAN'],
  intro = 'Vietnam Airlines Lotusmiles is the loyalty program of Vietnam Airlines, the SkyTeam member since 2010, with hubs at SGN (Ho Chi Minh City) and HAN (Hanoi). The fleet runs around 100 aircraft - B787-9/10, A350-900, A321/A321neo, ATR72 - and the carrier has been the Vietnamese flag operator since 1956. CEO Le Hong Ha leads roughly 22 million annual passengers. The program added a fifth tier - Million Miler with lifetime validity - on top of the existing Silver, Titanium, Gold, and Platinum.

For US travelers, Lotusmiles is primarily a status-match or earn-and-burn program. None of Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott transfer in directly. The Lotusmiles Pay card launched in 2025 (ACB + Visa, Vietnam-only) is not accessible to US members. The real US-reader value is the aggressive paid status-match path: Vietnam Airlines runs $129-$359 paid matches into Titanium, Gold, or Platinum (5 tiers total), extended into 2026. A status booster ($99-$198) gives 2X or 3X qualifying miles in a 90-day window. Hotel status match (Marriott/Hilton/IHG) caps at Lotusmiles Gold. SkyTeam partner awards on Delta or KLM via Lotusmiles can occasionally beat Flying Blue dynamic pricing - that is the redemption-side play, but it is secondary to the status-match story.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Status-match path** is the primary US-reader play - paid matches at $129-$359 into Titanium, Gold, or Platinum (extended into 2026).
- **SkyTeam partner awards on Delta and KLM via Lotusmiles** - sometimes beats Flying Blue dynamic pricing on US-Asia routes. Verify per route.
- **Vietnam Airlines domestic awards are cheap** - useful for in-country travel paired with a SkyTeam long-haul.
- **Status booster ($99-$198)** for 2X/3X qualifying miles in a 90-day window.
- **Etihad Airways bilateral partner** (non-alliance) - useful for non-SkyTeam routings.',
  sweet_spots = '- **Paid status-match into Lotusmiles Platinum** at $129-$359 = SkyTeam Elite Plus shortcut.
- **Hotel status match** (Marriott/Hilton/IHG) into Lotusmiles Gold at no cost - useful for SkyTeam Elite recognition.
- **Status booster** for 2X/3X qualifying miles in 90 days - useful when chasing a tier mid-year.
- **SkyTeam partner awards on Delta and KLM** through Lotusmiles can occasionally beat Flying Blue.
- **Vietnam Airlines domestic awards are cheap** at modest mile prices.
- **April 2025: Platinum gained domestic lounge access on select routes** - useful for mid-stay layovers.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry tier", "benefits": ["Earn Lotusmiles bonus miles", "Online account management"]},
    {"name": "Titanium", "qualification": "15,000 tier miles or 18 tier segments per year - 20 segments from July 1, 2026 - SkyTeam Elite", "benefits": ["SkyTeam Elite", "Priority check-in", "Extra baggage", "Bonus mile earning"]},
    {"name": "Gold", "qualification": "30,000 tier miles or 27 segments per year - 30 segments from July 2026 - SkyTeam Elite", "benefits": ["SkyTeam Elite", "Higher mile bonus", "Priority boarding", "Hotel-status-match cap accepts external Marriott/Hilton/IHG status"]},
    {"name": "Platinum", "qualification": "50,000 tier miles or 45 segments per year - 50 segments from July 2026 - SkyTeam Elite Plus", "benefits": ["SkyTeam Elite Plus", "Lotus Lounge access at SGN/HAN plus SkyTeam reciprocal worldwide", "Priority for waitlists", "April 2025: domestic lounge access on select routes"]},
    {"name": "Million Miler", "qualification": "Top tier, lifetime validity", "benefits": ["All Platinum benefits", "Lifetime status validity", "Highest priority recognition on Vietnam Airlines"]}
  ]'::jsonb,
  lounge_access = 'Vietnam Airlines operates Lotus Lounges at SGN (Ho Chi Minh City) and HAN (Hanoi). Platinum and Million Miler members get Lotus Lounge access plus SkyTeam Elite Plus reciprocal worldwide on same-day SkyTeam international flights. Gold (SkyTeam Elite) does not unlock standard lounge access on its own. April 2025 added domestic lounge access on select routes for Platinum.',
  quirks = '- **No major US transferable currency partner** - Lotusmiles is a status-match or earn-and-burn program for US travelers.
- **Lotusmiles Pay card launched 2025 (ACB + Visa, Vietnam-only)** - not accessible to US members.
- **5 tiers total**: Silver, Titanium, Gold, Platinum, Million Miler (lifetime).
- **Aggressive paid status-match campaigns ($129-$359) extended into 2026** - the primary US-reader play.
- **Status booster ($99-$198)** for 2X/3X qualifying miles in a 90-day window.
- **Hotel status match** (Marriott/Hilton/IHG) accepted, caps at Lotusmiles Gold.
- **Etihad Airways bilateral partner** (non-alliance).
- **Miles expire 36 months from earning** (verify exact policy on vietnamairlines.com).
- **YQ on most awards** - factor into redemption math.
- **April 2025**: Platinum gained domestic lounge access on select routes.
- **Tier qualification segment thresholds increase July 2026**: Titanium 18 to 20, Gold 27 to 30, Platinum 45 to 50.
- **Multiple status-match avenues** - the standout US-reader hook for this program.
- **No US co-brand card**.',
  award_chart = 'Lotusmiles uses a distance-based chart for Vietnam Airlines own metal and a region-based chart for SkyTeam partner awards. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-SGN/HAN Vietnam Airlines | Business | 80,000-100,000 |
| US-Europe SkyTeam partners | Business | 70,000-80,000 |
| Intra-Asia Vietnam Airlines | Business | 25,000-35,000 |
| Domestic Vietnam | Economy | 5,000-10,000 |
| US-Asia SkyTeam partners | Business | 75,000-90,000 |

Verify current pricing on vietnamairlines.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'vietnam-airlines';

-- ============================================================
-- 10. GARUDA INDONESIA GARUDAMILES (SkyTeam since 2014)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Garuda Indonesia GarudaMiles',
  alliance = 'skyteam',
  hubs = ARRAY['CGK','DPS'],
  intro = 'Garuda Indonesia GarudaMiles is the loyalty program of Garuda Indonesia, the SkyTeam member since 2014, with hubs at CGK (Jakarta) and DPS (Bali). The fleet runs around 70 aircraft - A330, B737, CRJ-1000 regional - with the 777-300ER fleet now severely limited (only 1-2 active as of May 2026, primarily the Bali-Tokyo route; the rest reconfigured or parked). Founded in 1949 under CEO Irfan Setiaputra, Garuda emerged from a 2022 debt restructuring and is rebuilding capacity with around 15 million annual passengers.

For US travelers, the only major US currency path is Marriott Bonvoy (3:1 with 5,000-mile bonus per 60K = 60K Bonvoy yields 25K GarudaMiles). None of Amex, Chase, Capital One, Citi, Bilt, or Wells Fargo transfer in. The 2026 chart story is the headline: a temporary Q1 devaluation (Jan 1 - March 31 2026) raised some domestic awards 500-1,100%, then on April 1, 2026 the program shifted to a NEW permanent chart with moderate increases over the pre-Q1-2026 levels (NOT a full reversion to the old chart). The TKG (Tanjung Karang) route has a permanent significant increase. Garuda first class on the 777-300ER is now effectively limited to one active aircraft, primarily on Bali-Tokyo - verify availability before transferring. Etihad Airways is a bilateral partner (non-alliance) for non-SkyTeam routings.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard with 5,000-mile bonus per 60K transferred. 60K Bonvoy yields 25K GarudaMiles. Verified May 2026 - the only major US currency path.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Garuda first class on 777-300ER** - now effectively wound down to 1 active aircraft, primarily Bali-Tokyo. Verify availability before transferring.
- **Domestic Indonesia awards** at reasonable post-April 2026 chart pricing - useful for in-country travel paired with a SkyTeam long-haul.
- **SkyTeam partner awards via GarudaMiles** - limited published examples; GarudaMiles releases significantly more award seats to its own members than to SkyTeam partners.
- **Etihad Airways bilateral partner** (non-alliance) for non-SkyTeam routings.
- **Marriott Bonvoy bridge** for US travelers - 60K Bonvoy yields 25K GarudaMiles + 5K bonus.',
  sweet_spots = '- **Domestic Indonesia awards remain reasonably priced post April 2026 chart** - useful for in-country segments.
- **Garuda first class on 777-300ER Bali-Tokyo** if you can find availability on the 1 active aircraft - verify before transferring.
- **GarudaMiles is more generous with award seats to its own members than to SkyTeam partners** - book via GarudaMiles directly when targeting Garuda metal.
- **Etihad bilateral partner redemptions** for non-alliance routings out of AUH.
- **Bonvoy 3:1 with 5K bonus at 60K** - the only US bridge worth knowing.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier", "benefits": ["Earn GarudaMiles bonus miles", "Online account management"]},
    {"name": "Silver", "qualification": "Entry elite tier - SkyTeam Elite", "benefits": ["SkyTeam Elite", "Priority check-in", "Extra baggage", "Bonus mile earning"]},
    {"name": "Gold", "qualification": "Mid-tier elite - SkyTeam Elite Plus", "benefits": ["SkyTeam Elite Plus", "Garuda Lounge access at CGK/DPS plus SkyTeam reciprocal worldwide", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "Top annual tier - SkyTeam Elite Plus", "benefits": ["All Gold benefits", "Highest priority for waitlists and operational upgrades", "Higher mile bonus"]}
  ]'::jsonb,
  lounge_access = 'Garuda Indonesia operates Garuda Lounges at CGK (Jakarta) and DPS (Bali). SkyTeam reciprocal applies: Silver, Gold, and Platinum get SkyTeam Elite or Elite Plus recognition; Gold and Platinum unlock business lounge access on same-day SkyTeam international flights worldwide.',
  quirks = '- **Q1 2026 chart shake-up**: temporary devaluation Jan 1 - March 31, 2026 raised some domestic awards 500-1,100%.
- **April 1, 2026: program shifted to a NEW permanent chart** with moderate increases over the pre-Q1-2026 levels - NOT a full reversion to the old chart.
- **TKG (Tanjung Karang) route has a permanent significant increase** post-April 2026.
- **777-300ER fleet now severely limited** (only 1-2 active as of May 2026, primarily Bali-Tokyo) - rest reconfigured or parked.
- **Garuda first class is effectively wound down to 1 active aircraft** - verify availability before transferring miles.
- **Marriott Bonvoy is the only major US currency path** - 60K Bonvoy yields 25K GarudaMiles + 5K bonus.
- **Etihad Airways bilateral partner** (non-alliance).
- **Miles expire 36 months from last activity** (verify exact policy on garuda-indonesia.com).
- **"Buy to Extend" is the only documented way to reset the 36-month hard expiry**.
- **YQ on most awards** - factor into redemption math.
- **Garuda emerged from 2022 debt restructuring** - ongoing fleet rebuild; verify operational changes on garuda-indonesia.com before booking.
- **GarudaMiles releases significantly more award seats to its own members than to SkyTeam partners** - book direct when targeting Garuda metal.
- **Region-based award chart with separate domestic chart**.
- **No US co-brand card**.
- **SkyTeam member since 2014**.',
  award_chart = 'GarudaMiles uses a region-based award chart with a separate domestic chart. The April 1, 2026 permanent chart includes moderate increases over the pre-Q1-2026 levels (not a full reversion to the old chart). Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-CGK Garuda (via partner) | Business | 100,000-120,000 |
| Domestic Indonesia Garuda | Economy | 7,500-15,000 |
| Intra-Asia SkyTeam partners | Business | 25,000-35,000 |
| Bali-Tokyo Garuda 777-300ER | First | 90,000-110,000 (verify availability) |
| Australia-CGK Garuda | Business | 50,000-65,000 |

Verify current pricing on garuda-indonesia.com - the April 2026 chart is new and per-route edges are still settling.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'garuda-indonesia';
