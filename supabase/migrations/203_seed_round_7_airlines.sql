-- Round 7 batch: 10 airline / discount-club program pages.
-- Each page draft was researched via WebSearch + cross-checked against
-- official program pages where available. Hedges and verify-before-publish
-- notes are inline. Note: iberia already exists as a skeleton row from
-- prior carrier-vs-loyalty-program split (see project_carrier_vs_loyalty_program_split.md).

-- ============================================================
-- PREP: ensure skeleton rows exist for the 9 new slugs (iberia exists)
-- ============================================================
insert into programs (slug, type, name) values
  ('aer-lingus', 'loyalty_program', 'Aer Lingus AerClub'),
  ('air-india', 'loyalty_program', 'Air India Maharaja Club'),
  ('royal-air-maroc', 'loyalty_program', 'Royal Air Maroc Safar Flyer'),
  ('ethiopian', 'loyalty_program', 'Ethiopian ShebaMiles'),
  ('south-african-airways', 'loyalty_program', 'South African Airways Voyager'),
  ('egyptair', 'loyalty_program', 'EgyptAir Plus'),
  ('aerolineas-argentinas', 'loyalty_program', 'Aerolineas Argentinas Plus'),
  ('azul', 'loyalty_program', 'Azul Fidelidade'),
  ('volaris', 'loyalty_program', 'Volaris v.club')
on conflict (slug) do nothing;

-- ============================================================
-- 1. IBERIA PLUS / CLUB IBERIA PLUS (oneworld)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Club Iberia Plus',
  alliance = 'oneworld',
  hubs = ARRAY['MAD','BCN'],
  intro = 'Club Iberia Plus (the rebrand of Iberia Plus that landed in April 2025) is the loyalty program of Iberia, the MAD-based oneworld founding member and the Spanish flagship of IAG. The fleet runs roughly 80-95 aircraft - A320 family, A330, A350, plus the A321XLR enabling thinner US transatlantic city pairs - and the program shares Iberia''s Avios currency with the rest of the IAG Avios family (BA, Aer Lingus, Vueling, Finnair, Qatar, Loganair) via Combine My Avios. April 2025 added a new top tier (Platino Prime), and the May/June 2025 chart devalued long-haul redemptions roughly 15-19%. February 2026 brought Family Accounts (pool with up to 7 members on a 12-month commitment).

For US travelers the headline pitch is simple: Iberia is the YQ-light Avios program. On identical Avios redemptions on the same metal, Iberia typically saves $200-500 versus BA in fuel surcharges, which is the whole reason this program exists in a points-and-miles US wallet. Transfer access is broad (Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, plus Marriott Bonvoy at 3:1) and foreign-carrier Amex MR transfers carry no US federal excise tax. Sweet spots are the East Coast and Chicago to Madrid in business off-peak, intra-Europe short-haul economy from 5,000 Avios, and one-stop Latin America via MAD.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1, near-instant. No US federal excise tax (foreign carrier). Verified May 2026.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "1:1", "notes": "1:1, near-instant. 20% transfer bonus active through Mar 31 2026 - verify on Chase Ultimate Rewards portal before transferring.", "bonus_active": true},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1, near-instant. Verified May 2026.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "1:1, near-instant. Verified May 2026.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1, Rent Day only. Bilt transfers fire only on the 1st of the month.", "bonus_active": false},
    {"from_slug": "wells-fargo-rewards", "ratio": "1:1", "notes": "1:1, verified May 2026.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Avios + 5,000-Avios bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **MAD-US East Coast / Chicago in business** off-peak at 40,500 Avios one-way - the program''s flagship value.
- **Intra-Europe economy short-haul from 5,000 Avios off-peak** - cheap one-off connections.
- **One-stop Latin America via MAD** in business from 40,500 Avios off-peak.
- **Combine My Avios** to pool balances across IAG family (BA, Aer Lingus, Vueling, Finnair, Qatar, Loganair) before redeeming.
- **Iberia metal over BA metal** when both price the same - Iberia charges materially less YQ.',
  sweet_spots = '- **MAD-US East / ORD in business** at 40,500 (off-peak) / 59,000 (peak) Avios one-way - the post-devaluation sweet spot.
- **MAD-US economy from 20,000-30,000 Avios one-way off-peak**.
- **Intra-Europe short-haul economy at 5,000 Avios one-way off-peak** - the cheapest Avios redemption in the IAG family.
- **South America via MAD in business from 40,500 Avios off-peak** - one-stop access to GRU/EZE/SCL/LIM.
- **Iberia''s YQ advantage versus BA** - typically $200-500 cheaper in surcharges on identical metal. The headline reason to pick Iberia.
- **Family Accounts (Feb 2026)** - pool with up to 7 members on a 12-month commitment.',
  tier_benefits = '[
    {"name": "Plata (oneworld Ruby)", "qualification": "3,500 Elite Points or 20 flights", "benefits": ["Priority check-in", "Extra checked bag", "Iberia lounge access on Iberia metal", "Avios bonus on Iberia"]},
    {"name": "Oro (oneworld Sapphire)", "qualification": "7,500 Elite Points or 40 flights", "benefits": ["oneworld lounge access globally on same-day oneworld international flights", "Priority boarding and baggage", "25% Avios bonus", "Guest into Iberia lounges"]},
    {"name": "Platino (oneworld Emerald)", "qualification": "20,000 Elite Points or 90 flights", "benefits": ["First-class lounge access globally", "50% Avios bonus", "Guest passes", "Top priority on waitlists"]},
    {"name": "Platino Prime", "qualification": "30,000 Elite Points (no flight-count path); added April 2025", "benefits": ["All Platino benefits", "Concierge-style recognition", "Top-tier perks layered above oneworld Emerald"]}
  ]'::jsonb,
  lounge_access = 'Iberia operates Premium Lounges at MAD T4 and BCN, plus contracted lounges at outstations. Plata gets Iberia lounge access on Iberia metal. Oro and above get oneworld business lounge access globally on same-day oneworld international flights, and Platino / Platino Prime get oneworld first-class lounges. There is no published public day-pass program for Iberia Premium Lounges.',
  quirks = '- **Rebranded "Iberia Plus" -> "Club Iberia Plus" April 2025** with new top tier Platino Prime added at the same time.
- **Award chart devalued 15-19% in May/June 2025** on long-haul - the current chart is the post-devaluation one.
- **Family Accounts launched February 2026** - pool Avios with up to 7 members on a 12-month commitment.
- **Iberia charges materially lower YQ than BA on identical Avios redemptions** - the headline Avios-program advantage and the reason most US users hold Iberia.
- **Avios expire 18 months from last activity** - any earn or spend resets the clock.
- **Combine My Avios family (free, instant)** with BA, Aer Lingus, Vueling, Finnair, Qatar, Loganair.
- **Combine My Avios 90-day account-age rule (new 2026)** - newly created accounts must wait 90 days before transferring Avios out.
- **Change/cancel fee approximately Eur 25 / $40 per ticket**.
- **Distance-based award chart with peak/off-peak dating** - chart is published.
- **No US-issued co-brand card** - all access is via flexible-currency transfers or partner earning.
- **All major US flexible currencies transfer in** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, plus Marriott at 3:1.
- **No US federal excise tax on Amex MR transfers** (foreign carrier).
- **Online award booking is solid** for own metal; partner award booking sometimes still requires phone.',
  award_chart = 'Iberia uses a distance-based award chart with peak/off-peak dating. Sample one-way saver pricing on Iberia metal as of May 2026 (post-2025 devaluation):

| Route | Cabin | Avios |
|---|---|---|
| MAD-US East / ORD | Business off-peak | 40,500 |
| MAD-US East / ORD | Business peak | 59,000 |
| MAD-US East / ORD | Economy off-peak | 20,000-30,000 |
| Intra-Europe short-haul | Economy off-peak | 5,000 |
| MAD-South America | Business off-peak | 40,500-50,000 |

Verify current pricing on iberia.com - Iberia charges materially lower YQ than BA on identical metal.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'iberia';

-- ============================================================
-- 2. AER LINGUS AERCLUB (NON-ALIGNED 2026; Atlantic Joint Business)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Aer Lingus AerClub',
  alliance = 'none',
  hubs = ARRAY['DUB','ORK','MAN'],
  intro = 'Aer Lingus AerClub is the loyalty program of Aer Lingus, the Irish flag carrier and IAG sister to BA, Iberia, and Vueling. As of May 2026, Aer Lingus is NOT a oneworld member - it sits in the Atlantic Joint Business (AJB) with American, British Airways, Iberia, and Finnair, which produces transatlantic earn and tier-credit reciprocity but no formal alliance. The fleet runs roughly 50-55 aircraft (A320, A321neo, A321LR, A321XLR, plus A330 widebodies), and the A321XLR is enabling thinner US transatlantic routes from BOS, EWR, MIA, BDL, and beyond.

For US travelers, AerClub is an Avios program that inherits the IAG Combine My Avios family (BA, Iberia, Vueling, Finnair, Qatar, Loganair). Direct flexible-currency transfers are limited - Amex, Chase, Bilt, and Wells Fargo go in directly; Capital One and Citi do NOT (you have to route those via BA Avios first, then Combine My Avios into AerClub). The headline value is the East Coast - Dublin city pair: 13,000 Avios one-way economy off-peak from BOS/JFK/EWR, with US Customs Preclearance at DUB making it the easiest US-Europe re-entry. Aer Lingus passes lower YQ than BA but more than Iberia on the same metal. Concierge and Platinum tiers also unlock 1-4 transatlantic business upgrades per year, the program''s standout elite perk.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1, near-instant. No US federal excise tax (foreign carrier). Verified May 2026.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "1:1", "notes": "1:1, near-instant. 20% transfer bonus active through Mar 31 2026 - verify on Chase Ultimate Rewards portal before transferring.", "bonus_active": true},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1, Rent Day only. Bilt transfers fire only on the 1st of the month.", "bonus_active": false},
    {"from_slug": "wells-fargo-rewards", "ratio": "1:1", "notes": "1:1, verified May 2026 - Aer Lingus is on the Wells Fargo Rewards 6-7 partner list.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Avios + 5,000-Avios bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **East Coast (BOS/JFK/EWR) to DUB economy from 13,000 Avios one-way off-peak** - the headline US sweet spot.
- **East Coast to DUB business at 50,000-62,750 Avios one-way** - sharp value relative to other transatlantic options.
- **Combine My Avios** to pool balances across IAG family before redeeming on Aer Lingus metal.
- **Concierge / Platinum transatlantic business upgrade certificates** - the program''s standout elite perk.
- **AJB partner earning** on AA / BA / Iberia / Finnair transatlantic.',
  sweet_spots = '- **BOS-DUB from 13,000 Avios one-way economy off-peak** - shortest US-Europe Atlantic crossing.
- **East Coast - DUB business 50,000-62,750 Avios one-way** - solid post-redemption value.
- **US Preclearance at DUB** - clear US Customs in Ireland before flying back to the US.
- **Concierge tier: 4 transatlantic biz upgrades per year** - genuinely valuable for a frequent transatlantic flyer.
- **AerClub passes lower YQ than BA** on the same metal (more than Iberia, less than BA).
- **Citi gap** - Citi ThankYou is the one major US flexible currency that does not transfer directly; route via BA Avios and Combine My Avios.',
  tier_benefits = '[
    {"name": "Green", "qualification": "Entry tier (free)", "benefits": ["Earn Avios and Tier Credits", "Member-only fares"]},
    {"name": "Silver", "qualification": "301 Tier Credits per membership year", "benefits": ["25% Avios bonus", "AerClub check-in", "Fast Track at DUB / LHR / AMS", "Extra baggage"]},
    {"name": "Platinum", "qualification": "601 Tier Credits per membership year", "benefits": ["50% Avios bonus", "1 transatlantic business-class upgrade per year", "Lounge access on AJB partners", "Priority boarding"]},
    {"name": "Concierge", "qualification": "1,051 Tier Credits per membership year", "benefits": ["75% Avios bonus", "4 transatlantic business-class upgrades per year", "Dedicated concierge line", "First-class lounges via AJB partners"]}
  ]'::jsonb,
  lounge_access = 'Aer Lingus operates lounges at DUB and JFK Terminal 5 (partner-operated). Platinum and above get oneworld Sapphire-tier lounge access via AJB partners (AA / BA / Iberia / Finnair) on transatlantic routes. Concierge unlocks first-class lounges via AJB partners. There is no published Aer Lingus public day-pass program.',
  quirks = '- **Aer Lingus is NOT a oneworld member as of May 2026** - the program is non-aligned. AJB (Atlantic Joint Business) reciprocity with AA / BA / Iberia / Finnair is the practical equivalent on transatlantic routes only.
- **AerClub is an Avios program** - part of the Combine My Avios family (BA, Iberia, Vueling, Finnair, Qatar, Loganair).
- **Citi ThankYou does NOT transfer directly to Aer Lingus** - route via BA Avios + Combine My Avios.
- **Combine My Avios 90-day account-age rule (new 2026)** - newly created accounts must wait 90 days before transferring out.
- **Avios expire 18 months from last activity** - any earn or spend resets.
- **Distance-based 6-zone chart with peak/off-peak dating** - 4,000 Avios short-haul economy to 75,000 Avios long-haul business one-way.
- **AerClub passes lower YQ than BA** but more than Iberia on the same metal.
- **A321XLR enabling thinner US transatlantic routes** - BOS, EWR, MIA, BDL, and others.
- **US Preclearance at DUB** - clear US Customs in Ireland.
- **No US co-brand card**.
- **Concierge / Platinum transatlantic business-upgrade certs** are the standout elite perk.
- **All major US flexible currencies transfer in except Citi**.
- **No US federal excise tax on Amex MR transfers** (foreign carrier).',
  award_chart = 'AerClub uses a distance-based 6-zone chart with peak/off-peak dating. Sample one-way saver pricing on Aer Lingus metal as of May 2026:

| Route | Cabin | Avios |
|---|---|---|
| BOS / JFK / EWR-DUB | Economy off-peak | 13,000 |
| BOS / JFK / EWR-DUB | Business off-peak | 50,000-62,750 |
| Intra-Europe short-haul | Economy off-peak | 4,000-7,000 |
| Long-haul transatlantic | Business peak | 70,000-75,000 |

Verify current pricing on aerlingus.com - peak/off-peak edges shift seasonally.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aer-lingus';

-- ============================================================
-- 3. AIR INDIA MAHARAJA CLUB (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air India Maharaja Club',
  alliance = 'star_alliance',
  hubs = ARRAY['DEL','BOM','BLR','HYD'],
  intro = 'Air India Maharaja Club is the loyalty program of Air India, the Tata-owned post-privatization flag carrier and Star Alliance member since July 2014. The fleet sits at 200+ aircraft post-Vistara merger and is growing fast on a massive Airbus and Boeing order with deliveries through 2030. The November 2024 Vistara merger absorbed roughly 4.5 million Club Vistara members into Maharaja Club at 1:1 with a one-year tier-validity extension, and the April 2026 award-chart overhaul cut economy pricing by up to 60% on Air India metal - the chart moved DOWN, which is unusual.

For US travelers the program is hard to access. None of Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo, or Marriott Bonvoy currently transfer directly. Indian-issued bank co-brand cards (Axis, HSBC, ICICI) earn into Maharaja Club but require Indian residency. The niche US bridge is Rove Miles (rove.io), a flexible currency aggregator transferring 1:1; verify before relying. The headline post-April-2026 sweet spot is DEL to 12 international destinations - BKK, SIN, KUL, DPS, MNL, HKT, SGN, DXB, DOH, JED, RUH, NBO - at 12,000 points one-way economy. Status and Star Alliance reciprocity work normally; the challenge is getting points into the account.',
  transfer_partners = '[
    {"from_slug": "rove-miles", "ratio": "1:1", "notes": "Niche US flexible-currency aggregator. Verify on rove.io before transferring. The only US-accessible bridge as of May 2026.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **DEL to 12 international cities at 12,000 points one-way economy** post-April-2026 chart - the headline sweet spot.
- **Domestic India from 1,500 points** - cheap intra-India one-offs.
- **Star Alliance partner awards** routed through Maharaja Club at the published partner chart.
- **United US domestic short-haul partner award from 3,500 points** (per AwardWallet).
- **Status credit for the 4.5 million migrated Club Vistara members** - one-year tier-validity extension at the merger.',
  sweet_spots = '- **DEL-BKK / SIN / DPS / DXB economy at 12,000 points one-way** - 60% chart cut in April 2026 made this one of Asia''s sharpest economy redemptions.
- **Domestic India from 1,500 points** - the cheapest intra-Asia award in the Star Alliance set.
- **United US domestic short-haul partner award from 3,500 points** when off-peak.
- **Star Alliance partner business class** at the published chart - verify post-2026 pricing.
- **Vistara migration credit** - migrated balances retained original expiry, which is more generous than fresh Maharaja accounts.',
  tier_benefits = '[
    {"name": "Red", "qualification": "Entry tier (free)", "benefits": ["Earn Maharaja Club points", "Booking and management on airindia.com"]},
    {"name": "Silver", "qualification": "Approximately 15,000 Tier Points", "benefits": ["Star Alliance Silver", "Priority check-in", "Extra baggage", "Bonus point earning"]},
    {"name": "Gold", "qualification": "Approximately 30,000 Tier Points", "benefits": ["Star Alliance Gold", "Maharaja Lounge access at DEL / BOM / BLR / HYD / MAA / GOI", "Priority boarding and baggage", "Star Alliance Gold reciprocal lounge access globally"]},
    {"name": "Platinum", "qualification": "45,000 Tier Points with at least 13,500 on AI metal, or 90 flights", "benefits": ["Star Alliance Gold", "Highest-tier recognition on Air India", "Top priority on waitlists and operational upgrades", "Higher mile bonus"]}
  ]'::jsonb,
  lounge_access = 'Air India operates Maharaja Lounges at DEL, BOM, BLR, HYD, MAA, and GOI. Gold and Platinum members get Maharaja Lounge access on same-day Air India or Star Alliance flights, plus Star Alliance Gold reciprocal lounges globally. Silver does not get standard lounge access. There is no published public day-pass program.',
  quirks = '- **Vistara fully merged into Air India November 2024** - 4.5M Club Vistara members migrated to Maharaja Club at 1:1 with one-year tier-validity extension.
- **April 2026 award-chart overhaul cut economy pricing up to 60%** on Air India metal - the chart moved DOWN, the rare positive revaluation.
- **DEL to 12 international cities at 12,000 points one-way economy** is the post-April-2026 headline (BKK, SIN, KUL, DPS, MNL, HKT, SGN, DXB, DOH, JED, RUH, NBO).
- **No major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, and Marriott do not transfer directly as of May 2026 (verify Marriott - was historically a partner).
- **Rove Miles (rove.io) transfers 1:1** - niche US-accessible bridge; verify before relying.
- **Indian bank co-brand cards** (Axis, HSBC, ICICI) require Indian residency.
- **Points valid 3 years from earning** - hard expiry, not rolling.
- **Vistara legacy points retained their original expiry** at the merger.
- **Booking partner awards often phone-only** - online flow is improving but inconsistent.
- **Star Alliance benefits work normally** - the program''s main weakness is earning, not redemption rules.
- **Massive widebody order through 2030** - more US routes likely as deliveries land.
- **No US co-brand card**.',
  award_chart = 'Maharaja Club uses a flat zone-based award chart (post April 2026). Sample one-way saver pricing as of May 2026:

| Route | Cabin | Points |
|---|---|---|
| Domestic India Air India | Economy | 1,500-5,000 |
| DEL-BKK / SIN / DPS / DXB | Economy | 12,000 |
| DEL-DOH / RUH / NBO / JED | Economy | 12,000 |
| US domestic United partner award | Economy | 3,500-7,500 |
| US-India business via Star partners | Business | Verify post-2026 chart |

Verify current pricing on airindia.com - April 2026 chart is recent and per-route edges may settle.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-india';

-- ============================================================
-- 4. ROYAL AIR MAROC SAFAR FLYER (oneworld)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Royal Air Maroc Safar Flyer',
  alliance = 'oneworld',
  hubs = ARRAY['CMN'],
  intro = 'Royal Air Maroc Safar Flyer is the loyalty program of Royal Air Maroc, the CMN-based Moroccan flag carrier and oneworld''s 14th member (joined April 1, 2020). The fleet runs roughly 55-60 aircraft - B737, B787-8/-9, E190, ATR - and a fleet-doubling plan announced in 2023 is reshaping the network. RAM moves to the new JFK Terminal One in 2026, and Casablanca is the program''s only meaningful hub.

For US travelers the redemption story is thin and the status story is the headline. None of the major US flexible currencies (Amex, Chase, Capital One, Citi, Bilt, Wells Fargo) transfer to Safar Flyer, and Marriott Bonvoy is not a direct partner either. The Accor ALL hotel-side bridge (2,000 ALL = 1,000 Safar Flyer) is a niche double-dip. The real value is the **oneworld status match**: 2026 pricing through StatusMatch.com is Silver $149 / Gold $349 / Platinum $749, valid through Dec 31 2026, which is the cheapest documented path to oneworld Emerald in the industry. As of November 25, 2025, the match excludes US airline status holders and hotel elites - so this is for travelers without existing US elite status.',
  transfer_partners = '[
    {"from_slug": "accor-all", "ratio": "2:1", "notes": "Hotel-side double-dip: 2,000 Accor ALL points = 1,000 Safar Flyer miles. Niche; useful for hotel-flier crossover.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Safar Flyer status-match offers** - the program''s headline US-reader play.
- **CMN connections to West Africa and the Levant** on RAM metal.
- **oneworld partner awards on RAM** - book via BA Avios, AA AAdvantage, or Atmos using RAM as oneworld partner.
- **AA Flagship Lounge access on AA flights for Gold and above** via oneworld Sapphire reciprocity.
- **Accor ALL double-dip** for travelers earning ALL points on Morocco hotel stays.',
  sweet_spots = '- **Status match into oneworld Emerald via Platinum at $749** - cheapest documented path to Emerald in 2026.
- **Status match into oneworld Sapphire via Gold at $349** - cheapest documented path to Sapphire.
- **2x / 3x status mile booster promos** RAM ran in 2025 - watch for repeats.
- **JFK / IAD / MIA / ORD-CMN economy at approximately 50,000 miles one-way** (verify on royalairmaroc.com).
- **JFK / IAD / MIA / ORD-CMN business at approximately 80,000-100,000 miles one-way** on the RAM 787 (verify).
- **AA Flagship Lounge on AA flights for Safar Flyer Gold** - useful US-domestic lounge unlock.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier (free)", "benefits": ["Earn Safar Flyer miles", "Booking and management on royalairmaroc.com"]},
    {"name": "Silver (oneworld Ruby)", "qualification": "Verify thresholds on royalairmaroc.com", "benefits": ["Priority check-in", "Extra baggage", "Mile bonus on RAM"]},
    {"name": "Gold (oneworld Sapphire)", "qualification": "Verify thresholds on royalairmaroc.com", "benefits": ["oneworld business lounge access globally", "AA Flagship Lounge access on AA flights", "Priority boarding and baggage", "Mile bonus"]},
    {"name": "Platinum (oneworld Emerald)", "qualification": "Verify thresholds on royalairmaroc.com", "benefits": ["First-class lounge access globally", "Additional baggage", "Top priority on waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Royal Air Maroc operates the Casablanca Pearl Lounge at CMN. Safar Flyer Gold and above get the Pearl Lounge on same-day RAM flights, plus oneworld Sapphire and Emerald reciprocal lounges globally. There is no published RAM public day-pass program.',
  quirks = '- **2026 status-match pricing through StatusMatch.com** - Silver $149 / Gold $349 / Platinum $749, valid through Dec 31 2026.
- **Status match excludes US airline status holders and hotel elites since November 25, 2025** - this offer targets US travelers without existing US elite status.
- **Cheapest documented path to oneworld Emerald in the industry** - the status-match itself is the standout US-reader value.
- **No major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, and Marriott do not transfer directly (Marriott not on standard partner list as of May 2026).
- **Accor ALL bilateral 2:1** - hotel-side double-dip is the only currency bridge worth knowing.
- **Etihad Guest bilateral earn/burn partner** (non-alliance).
- **Qatar Privilege Club + Iberia Plus partner-side links** for award booking.
- **Heavy YQ on RAM metal** - factor into redemption math.
- **Award booking on partners often requires phone** - limited online flow.
- **Miles expire 36 months from earning** - hard expiry, not rolling.
- **2025: 2x / 3x status mile booster promos** ran periodically; watch for repeats.
- **No US co-brand card**.
- **Casablanca is RAM''s only meaningful hub** - all routings funnel through CMN.
- **JFK Terminal One operations 2026**.',
  award_chart = 'Safar Flyer uses a region-based award chart for own metal and the published oneworld partner chart for partner awards. Sample one-way saver pricing on RAM metal as of May 2026 (verify on royalairmaroc.com - online flow limited):

| Route | Cabin | Miles |
|---|---|---|
| US (JFK/IAD/MIA/ORD)-CMN | Economy | ~50,000 (verify) |
| US-CMN | Business on 787 | ~80,000-100,000 (verify) |
| Domestic Morocco | Economy | 4,750 |
| Intra-Africa via CMN | Economy | 15,000-25,000 |
| oneworld partner long-haul biz | Business | per oneworld partner chart |

Phone booking often required for partner awards; YQ pass-through on RAM metal.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'royal-air-maroc';

-- ============================================================
-- 5. ETHIOPIAN SHEBAMILES (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Ethiopian ShebaMiles',
  alliance = 'star_alliance',
  hubs = ARRAY['ADD'],
  intro = 'Ethiopian ShebaMiles is the loyalty program of Ethiopian Airlines, the ADD-based African flag carrier and Star Alliance member since December 2011. The fleet sits around 150 aircraft (the largest in Africa) - B737, B787, B777, A350 - and the network spans 130+ destinations across 80+ countries. Ethiopian is one of the few consistently profitable African flag carriers and Skytrax''s Best Airline in Africa.

For US travelers, the headline 2026 news is the **March 27, 2026 launch of the Marriott Bonvoy two-way partnership** - the first major US currency bridge into ShebaMiles. Marriott to ShebaMiles transfers at 3:1 with a 5,000-mile bonus per 60,000 points moved in a single transaction. ShebaMiles to Marriott runs 2:1. Members can also choose to earn Marriott Bonvoy points OR ShebaMiles when staying at Marriott hotels (no account linking required). No other major US flexible currency (Amex, Chase, Capital One, Citi, Bilt, Wells Fargo) transfers directly. The redemption story centers on US-ADD business class and intra-Africa economy on Ethiopian metal, plus Star Alliance partner awards for US domestic and Europe.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "LAUNCHED March 27, 2026. Two-way partnership. Marriott -> ShebaMiles at 3:1 with 5,000-mile bonus per 60,000 points transferred in a single transaction. ShebaMiles -> Marriott at 2:1. Members can also elect to earn Marriott Bonvoy OR ShebaMiles on Marriott stays without account linking.", "bonus_active": true}
  ]'::jsonb,
  how_to_spend = '- **US-ADD business class on Ethiopian metal** post-2026 chart at approximately 85,000 miles one-way.
- **Intra-Africa economy on Ethiopian from 15,000 miles** - cheap one-off African awards.
- **Star Alliance partner awards from 30,000 miles one-way** for US domestic and Europe.
- **Marriott Bonvoy bridge** - 60K Bonvoy = 25K ShebaMiles + 5K bonus, the new 2026 US headline.
- **Earn ShebaMiles on Marriott stays** as an alternative to Marriott Bonvoy points.',
  sweet_spots = '- **US (IAD / EWR / ORD) - ADD business class at approximately 85,000 miles one-way** on Ethiopian metal post-2026 chart.
- **Intra-Africa economy from 15,000 miles** on Ethiopian - the cheapest African-network entry point.
- **Marriott Bonvoy 3:1 + 5K bonus per 60K transferred** - the headline 2026 US bridge.
- **Star Alliance partner awards from 30,000 miles one-way** - useful for US domestic and short-haul Europe.
- **25 Star Alliance airlines + 1,150+ destinations accessible through ShebaMiles** - the alliance breadth is the underrated story.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "3,000 ShebaMiles or 2 qualifying segments", "benefits": ["Earn ShebaMiles", "Booking and management on ethiopianairlines.com"]},
    {"name": "Silver", "qualification": "25,000 ShebaMiles or 25 segments", "benefits": ["Star Alliance Silver", "Priority check-in", "Extra baggage", "Bonus mile earning"]},
    {"name": "Gold", "qualification": "50,000 ShebaMiles or 50 segments", "benefits": ["Star Alliance Gold", "Cloud Nine Lounge access at ADD", "Star Alliance Gold reciprocal lounge access globally", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "100,000 ShebaMiles or 80 segments", "benefits": ["Star Alliance Gold", "Highest-tier recognition on Ethiopian", "Top priority on waitlists and operational upgrades", "Higher mile bonus"]}
  ]'::jsonb,
  lounge_access = 'Ethiopian operates the Cloud Nine Lounge at Addis Ababa Bole and contracted lounges at outstations. Gold and Platinum members get Cloud Nine Lounge access on same-day Ethiopian or Star Alliance flights, plus Star Alliance Gold reciprocal lounges globally. Silver does not get standard lounge access. There is no published public day-pass program.',
  quirks = '- **Marriott Bonvoy <-> ShebaMiles two-way partnership LAUNCHED MARCH 27, 2026** - the new US currency bridge.
- **Marriott to ShebaMiles 3:1 with 5,000-mile bonus per 60,000 points transferred in a single transaction** - structure transfers in 60K blocks.
- **ShebaMiles to Marriott 2:1**.
- **Members can elect to earn Marriott Bonvoy OR ShebaMiles on Marriott stays** without account linking.
- **No other major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo do not transfer.
- **Fuel surcharges pass through on Ethiopian metal awards** - material on long-haul.
- **ShebaMiles validity typically 3 years rolling** - verify on ethiopianairlines.com.
- **Booking partner awards often phone-only** with Ethiopian.
- **150-aircraft fleet is the largest in Africa** - operational footprint matters for connection reliability.
- **130+ destinations across 80+ countries** through ADD.
- **Skytrax Best Airline in Africa** - useful brand context for skeptical US readers.
- **Star Alliance member since December 2011**.
- **No US co-brand card**.
- **The Marriott pipeline (March 2026) makes this program suddenly accessible to US travelers** - the headline 2026 development.',
  award_chart = 'ShebaMiles uses a zone-based award chart for own metal and a separate Star Alliance partner chart. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US (IAD/EWR/ORD)-ADD | Business Ethiopian metal | ~85,000 |
| US-ADD | Economy Ethiopian metal | ~50,000-65,000 |
| Intra-Africa Ethiopian | Economy | 15,000+ |
| Star partner awards | Business | 30,000+ one-way |
| Star partner awards | Economy | 15,000+ one-way |

Verify current pricing on ethiopianairlines.com - YQ pass-through on Ethiopian metal awards.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ethiopian';

-- ============================================================
-- 6. SOUTH AFRICAN AIRWAYS VOYAGER (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'South African Airways Voyager',
  alliance = 'star_alliance',
  hubs = ARRAY['JNB','CPT'],
  intro = 'SAA Voyager is the loyalty program of South African Airways, the JNB-based flag carrier and Star Alliance member since April 10, 2006 (the first African Star carrier). Post-business-rescue SAA is operating with roughly 10-20 aircraft - A319 / A320 / A330 - drastically smaller than its pre-2020 footprint. The Takatso Consortium privatization deal collapsed March 14, 2024, returning SAA to full state ownership. CEO transition in April 2026 (John Lamola resigned; Matshela Seshibe acting CEO; verify current). Sao Paulo route relaunched in 2025 (verify).

For US travelers Voyager is mostly a niche - a program more relevant to South African residents and African-travel specialists than to flexible-currency optimizers. None of Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo transfer directly, and Marriott Bonvoy is not on the standard 40-airline partner list as of May 2026 (historically yes; verify). The carrier is operationally fragile post-business-rescue; service-reliability concerns are real and worth flagging in any travel plan. Voyager was historically YQ-light for partner Star Alliance redemptions, but the reduced own-metal fleet limits redemption upside on SAA itself.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Star Alliance partner awards** routed through Voyager at the published partner chart.
- **JNB-Africa intra-region** on SAA metal at modest mile prices.
- **Cape Town and Johannesburg domestic** for South Africa-based members.
- **Voyager status match via Star Alliance status match** - a path to Star Gold for committed African-travel specialists.
- **JNB-US / JNB-Europe own-metal awards** - limited by reduced fleet; verify availability before transferring.',
  sweet_spots = '- **Star Alliance partner business class** booked through Voyager when its YQ pass-through is lighter than other Star programs.
- **Status match path to Star Gold** via Voyager when promos run.
- **Domestic South Africa on SAA at modest mile prices** - useful for in-country travel.
- **Lifetime Platinum** is achievable via 4 consecutive years of Platinum - rare in Star Alliance.
- **Mile-extension promo through March 31 2026** at ZAR 250 per 1,000 (non-SAA) / ZAR 100 per 1,000 (SAA) - one of the cheapest mile-extension fees in the industry.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier (free)", "benefits": ["Earn Voyager miles", "Booking and management on flysaa.com"]},
    {"name": "Silver", "qualification": "Verify thresholds on flysaa.com", "benefits": ["Star Alliance Silver", "Priority check-in", "Extra baggage", "Bonus mile earning"]},
    {"name": "Gold", "qualification": "Verify thresholds on flysaa.com", "benefits": ["Star Alliance Gold", "SAA Cycad and Baobab Lounge access at JNB / CPT", "Star Alliance Gold reciprocal lounge access globally", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "Top annual tier; verify thresholds on flysaa.com", "benefits": ["Star Alliance Gold", "Highest-tier recognition on SAA", "Top priority on waitlists and operational upgrades"]},
    {"name": "Lifetime Platinum", "qualification": "4 consecutive years of Platinum (SAA-only path)", "benefits": ["Lifetime Star Alliance Gold", "All Platinum benefits"]}
  ]'::jsonb,
  lounge_access = 'SAA operates Cycad Lounges and Baobab Lounges at JNB and CPT. Voyager Gold and above get Cycad / Baobab access on same-day SAA or Star Alliance flights, plus Star Alliance Gold reciprocal lounges globally. Silver does not get standard lounge access. There is no published public day-pass program.',
  quirks = '- **SAA is operationally fragile post-business-rescue** - service reliability concerns are real; flag in user-facing copy.
- **Takatso Consortium privatization deal collapsed March 14, 2024** - SAA returned to full state ownership.
- **Reduced fleet (10-20 aircraft) limits own-metal redemption upside**.
- **Sao Paulo route relaunched 2025** (verify).
- **CEO transition April 2026** - John Lamola resigned; Matshela Seshibe acting CEO (verify).
- **No major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo do not transfer.
- **Marriott Bonvoy NOT on standard partner list as of May 2026** - historically yes; verify before relying.
- **Annual mile expiry on March 31** - calendar-year clock, not rolling.
- **Mile-extension promo through March 31 2026** - ZAR 250 per 1,000 (non-SAA) or ZAR 100 per 1,000 (SAA).
- **Tier miles earnable across Star Alliance** since 2024 update for Silver / Gold / Platinum; Lifetime Platinum still SAA-only.
- **Status match available via Star Alliance status match program**.
- **Voyager was historically YQ-light for partner Star redemptions** - verify per route.
- **Limited US-earning paths** - mostly relevant to South African residents and African-travel specialists.
- **Star Alliance member since April 10, 2006** - first African Star carrier.
- **No US co-brand card**.',
  award_chart = 'Voyager uses a zone-based award chart for own metal and a separate Star Alliance partner chart. Sample one-way saver pricing as of May 2026 (verify on flysaa.com - reduced fleet limits availability):

| Route | Cabin | Miles |
|---|---|---|
| JNB-US SAA metal | Business | Verify - reduced fleet |
| JNB-Europe SAA metal | Business | Verify - reduced fleet |
| Intra-Africa SAA | Economy | 12,500-25,000 |
| Domestic South Africa | Economy | 7,500-12,500 |
| Star partner long-haul | Business | per partner chart |

Verify current pricing on flysaa.com - operational fragility shapes availability.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'south-african-airways';

-- ============================================================
-- 7. EGYPTAIR PLUS (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'EgyptAir Plus',
  alliance = 'star_alliance',
  hubs = ARRAY['CAI'],
  intro = 'EgyptAir Plus is the loyalty program of EgyptAir, the CAI-based Egyptian flag carrier and Star Alliance member since July 2008. Founded in 1932, EgyptAir is one of the world''s oldest airlines. The fleet runs roughly 60-70 aircraft (A220, A320 family, B737, B777, B787-9, with 777-300ER specificity), and the network spans 75+ destinations across 50+ countries. US service to JFK and IAD is expanding, and a future hub shift may follow when New Cairo Airport opens.

For US travelers, EgyptAir Plus has zero direct flexible-currency transfer partners (Amex, Chase, Capital One, Citi, Bilt, Wells Fargo none direct; Marriott not on standard list - verify). The reason this program is worth knowing is the **Family Account / Family Miles feature**: pool earnings across up to 8 family members to fast-track Star Gold via household earning. That is one of the cheapest backdoors to Star Alliance Gold elite status in the industry. Beyond the household-pooling angle, redemptions are US-CAI in business and Star Alliance partner awards via EgyptAir Plus, with notable YQ pass-through on long-haul awards.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **US-CAI business on EgyptAir 787-9** at the published own-metal chart (verify rate).
- **Star Alliance partner awards** routed through EgyptAir Plus.
- **Star Alliance Upgrade Award** is available through EgyptAir Plus.
- **CAI to Africa / Middle East intra-region** at low mile prices.
- **Family Account pooling for cheap Star Gold** via household earning.',
  sweet_spots = '- **Family Account pooling across up to 8 members for Star Gold** - one of the cheapest backdoors to Star Alliance Gold in the industry.
- **US-CAI business on EgyptAir 787-9** at the published own-metal chart.
- **CAI-Africa and CAI-Middle East short-haul** at low mile prices.
- **1,000,000 lifetime EgyptAir miles = lifetime Star Gold** at the Platinum tier.
- **Star Alliance Upgrade Award** available through EgyptAir Plus for cabin-upgrade redemptions.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier (free)", "benefits": ["Earn EgyptAir Plus miles", "Booking and management on egyptairplus.com"]},
    {"name": "Silver", "qualification": "30,000 tier miles", "benefits": ["Star Alliance Silver", "Priority check-in", "Extra baggage", "Bonus mile earning"]},
    {"name": "Gold", "qualification": "Approximately 50,000 tier miles (verify on egyptairplus.com)", "benefits": ["Star Alliance Gold", "EgyptAir lounge access at CAI", "Star Alliance Gold reciprocal lounge access globally", "Priority boarding and baggage"]},
    {"name": "Platinum (Lifetime)", "qualification": "1,000,000 lifetime miles on EgyptAir = lifetime Star Gold", "benefits": ["Lifetime Star Alliance Gold", "All Gold benefits", "Top recognition on EgyptAir"]}
  ]'::jsonb,
  lounge_access = 'EgyptAir operates lounges at CAI. Gold and Platinum members get EgyptAir lounge access on same-day EgyptAir or Star Alliance flights, plus Star Alliance Gold reciprocal lounges globally. Silver does not get standard lounge access. There is no published public day-pass program.',
  quirks = '- **Family Account / Family Miles - pool across up to 8 family members** to fast-track Star Gold via household earning. The standout feature.
- **One of the cheapest backdoors to Star Alliance Gold** in the industry via Family Account pooling.
- **No major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo do not transfer.
- **Marriott Bonvoy NOT on standard partner list as of May 2026** - verify before relying.
- **YQ passes through on award tickets** - material on long-haul.
- **Miles expire 36 months from accrual date** - hard expiry, not rolling.
- **Booking partner awards often phone-only**.
- **75+ destinations across 50+ countries** through CAI.
- **Founded 1932** - one of the world''s oldest airlines.
- **Star Alliance member since July 2008**.
- **Star Alliance Upgrade Award is available** through EgyptAir Plus.
- **1,000,000 lifetime EgyptAir miles = lifetime Star Gold**.
- **No US co-brand card**.
- **777-300ER specificity** in the long-haul fleet.
- **Future hub shift potential when New Cairo Airport opens** - verify timing.',
  award_chart = 'EgyptAir Plus uses a region-based award chart, calculator-driven on egyptairplus.com. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US (JFK/IAD)-CAI | Business EgyptAir metal | Verify on calculator |
| US-CAI | Economy EgyptAir metal | Verify on calculator |
| CAI-Africa intra-region | Economy | 15,000-25,000 |
| CAI-Middle East | Economy | 12,500-20,000 |
| Star partner long-haul | Business | per partner chart |

Verify current pricing on egyptairplus.com - YQ pass-through on most long-haul awards.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'egyptair';

-- ============================================================
-- 8. AEROLINEAS ARGENTINAS PLUS (SkyTeam)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Aerolineas Argentinas Plus',
  alliance = 'skyteam',
  hubs = ARRAY['AEP','EZE'],
  intro = 'Aerolineas Argentinas Plus is the loyalty program of Aerolineas Argentinas, the Buenos Aires-based flag carrier and SkyTeam member since August 2012. The fleet sits at roughly 80 aircraft (B737-800/MAX, A330-200, E190), and operations split across AEP (Aeroparque - domestic) and EZE (Ezeiza - international). Founded in 1950 and re-nationalized in 2008, AR has been under periodic privatization pressure under the Milei administration. Codeshares run with GOL, LATAM, Avianca, El Al, and ITA Airways.

For US travelers AR Plus is hard to access directly. None of Amex MR, Chase UR, Capital One, Citi, Bilt, or Wells Fargo transfer to it, and Marriott Bonvoy is not on the standard partner list as of May 2026 (verify). US-relevant earning is mostly via flying SkyTeam partners (Delta, KLM, Air France, ITA) crediting to AR Plus, or via SAS EuroBonus or Delta crediting flexibility. The redemption sweet spots are real but narrow: BUE-Madrid in business at 70,000 miles one-way is a strong own-metal play, and Argentina-US economy round-trip around 40,000 miles is solid mid-haul value.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **BUE-Madrid business at 70,000 miles one-way** on AR metal - the program''s flagship own-metal sweet spot.
- **Argentina-US economy round-trip approximately 40,000 miles** - solid mid-haul value.
- **AR-US business on Delta** at approximately 100,000 miles one-way (verify partner pricing).
- **Domestic Argentina from 8,000 miles round-trip** - valuable for Patagonia and wine-country trips.
- **SkyTeam partner awards** routed through AR Plus.',
  sweet_spots = '- **BUE-Madrid business at 70,000 miles one-way on AR metal** - strong sweet spot vs Flying Blue or Delta SkyMiles from Europe.
- **Argentina-US economy round-trip around 40,000 miles** - solid mid-haul value.
- **Domestic Argentina from 8,000 miles round-trip** - the cheap entry point for Patagonia / wine country / Iguazu.
- **AR-US business on Delta** at approximately 100,000 miles one-way (verify partner pricing).
- **Awards bookable up to 330 days out** - rare in SkyTeam.
- **Miles fund Patagonia and Andes domestic travel** at sharper rates than cash given peso volatility.',
  tier_benefits = '[
    {"name": "Oro (Gold)", "qualification": "25,000 basic miles or 30 segments per qualifying period", "benefits": ["SkyTeam Elite", "Priority check-in and boarding", "Extra baggage", "Bonus mile earning on AR"]},
    {"name": "Platino (Platinum)", "qualification": "50,000 basic miles or 60 segments per qualifying period", "benefits": ["SkyTeam Elite Plus", "Salones Condor lounge access at EZE / AEP plus 1 guest", "SkyTeam reciprocal lounge access globally", "Priority handling worldwide"]},
    {"name": "Diamante", "qualification": "Invite-only ultra-elite (added 2019)", "benefits": ["All Platino benefits", "Top-tier recognition", "Concierge-style perks"]}
  ]'::jsonb,
  lounge_access = 'AR operates Salones Condor at EZE and AEP. Platino and Diamante members get Salones Condor on same-day AR or SkyTeam flights, plus SkyTeam reciprocal lounges globally. Oro does not get standard lounge access on AR. There is no published public day-pass program.',
  quirks = '- **Partner award chart not published** - calculator only on aerolineas.com. Limits transparency for US users.
- **No major US flexible-currency direct partner** - Amex, Chase, Capital One, Citi, Bilt, Wells Fargo do not transfer.
- **Marriott Bonvoy NOT on standard partner list as of May 2026** - verify before relying.
- **Periodic privatization pressure under Milei administration** - operational changes possible.
- **Argentine peso volatility** - cash fares swing materially; mile redemptions provide stability.
- **Miles validity 24 months from no qualifying activity** (verify).
- **Awards bookable up to 330 days out** - generous booking window.
- **Not all SkyTeam partners bookable online** - phone often required.
- **Diamante added 2019 as an invite-only ultra-elite tier**.
- **Tier miles vs basic miles distinction** - tier qualification uses tier miles only.
- **Codeshares with GOL, LATAM, Avianca, El Al, ITA Airways** layer non-SkyTeam partner earning.
- **SkyTeam member since August 2012**.
- **Hubs split AEP (domestic) / EZE (international)** - factor into routing.
- **No US co-brand card**.
- **Spanish-only support is common** - English support exists but inconsistent.',
  award_chart = 'AR Plus uses a zone-based award chart for own metal, published on aerolineas.com. Partner awards are calculator-only. Sample one-way saver pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| BUE-Madrid AR metal | Business | 70,000 |
| Argentina-US AR/Delta | Economy round-trip | ~40,000 |
| AR-US business via Delta | Business | ~100,000 (verify) |
| Domestic Argentina | Economy round-trip | 8,000+ |
| Intra-South America | Economy | 12,500-20,000 |

Verify current pricing on aerolineas.com - partner pricing requires the calculator.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aerolineas-argentinas';

-- ============================================================
-- 9. AZUL FIDELIDADE (non-aligned; Brazil)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Azul Fidelidade',
  alliance = 'none',
  hubs = ARRAY['VCP','REC','CNF','MAO'],
  intro = 'Azul Fidelidade is the loyalty program of Azul Linhas Aereas Brasileiras, the largest domestic Brazilian network by city count and a non-aligned carrier. The fleet runs roughly 180 aircraft - A320neo, A330neo, ATR-72, E195 - serving 160+ destinations. The program rebranded from TudoAzul to Azul Fidelidade in April 2024, and Azul S.A. is publicly traded with reported Brazilian financial-restructuring discussions. Founded in 2008 by David Neeleman (also founder of JetBlue, Breeze Airways, WestJet, and Morris Air), Azul moves roughly 35 million passengers annually. Azul has been a Star Alliance connecting partner via United since 2020 - Azul flights earn United MileagePlus miles.

For US travelers, Azul Fidelidade is a hard-to-access program. None of Amex MR, Chase UR, Citi, Bilt, or Wells Fargo transfer directly. **Capital One is NOT a current direct partner as of May 2026** - the partnership lapsed (verify against Capital One''s official transfer-partner list before relying). Marriott Bonvoy is also not on the standard partner list (verify). The working access points are partnerships: Accor ALL (double-dip earning on Azul flights), Etihad Guest (redeems on Azul from 6,000 miles), and the Azul Pelo Mundo partner network with United, Copa, and TAP. The January 13, 2026 tier overhaul added Diamante Unique and Azul One at the top.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Domestic Brazil economy heavily promo''d** from a few thousand points one-way.
- **Etihad redemptions via Azul from 6,000 miles** (verify route eligibility).
- **United / Copa via Azul Pelo Mundo** to North America at niche pricing.
- **Accor ALL double-dip** - earn ALL points on Azul flights for hotel-flier crossover.
- **Tier-based point validity** - Diamante Unique gets 10-year validity, the program''s elite long-tail benefit.',
  sweet_spots = '- **Domestic Brazil from a few thousand points one-way** - heavily promo''d on the Azul website.
- **Etihad redemptions on Azul from 6,000 miles** (verify route eligibility) - niche but cheap.
- **Azul Pelo Mundo via United / Copa / TAP Miles&Go** for North America connections at niche pricing.
- **Accor ALL double-dip** - earn ALL points on Azul flights for hotel-flier crossover.
- **Diamante Unique 10-year point validity** - the longest validity in the Brazilian market.
- **Star Alliance connecting via United (since 2020)** - Azul flights earn United MileagePlus miles.',
  tier_benefits = '[
    {"name": "Topazio", "qualification": "Entry-paid tier (verify thresholds on voeazul.com.br)", "benefits": ["Earn Azul Fidelidade points", "Bonus point earning", "Priority check-in"]},
    {"name": "Safira", "qualification": "Verify thresholds on voeazul.com.br", "benefits": ["Priority boarding", "Extra baggage", "Higher mile bonus"]},
    {"name": "Diamante", "qualification": "Verify thresholds on voeazul.com.br", "benefits": ["Azul Lounge access at VCP and REC", "Concierge support", "Higher mile bonus"]},
    {"name": "Diamante Unique", "qualification": "26 segments + 26,000 qualifying points OR R$50,000 air spend (effective Jan 13 2026)", "benefits": ["5 points per real spent on Azul", "10-year point validity", "4 companion certificates per year", "15 vouchers of 50,000 points for special redemptions", "40% discount on cabin upgrades with points", "Same-day flight advancement included", "Unlimited Espaco Azul and Economy Xtra courtesies"]},
    {"name": "Azul One", "qualification": "Invite-only; no public threshold (effective Jan 13 2026)", "benefits": ["Ultra-exclusive concierge tier", "All Diamante Unique benefits layered above"]}
  ]'::jsonb,
  lounge_access = 'Azul operates Azul Lounges at VCP and REC. Diamante and above get Azul Lounge access on same-day Azul flights. Diamante Unique gets unlimited Espaco Azul and Economy Xtra courtesies. Diamante and above also get Accor ALL Silver reciprocity through the Azul-Accor partnership. Azul is non-aligned, so there is no alliance lounge access. There is no published public day-pass program.',
  quirks = '- **Rebranded TudoAzul -> Azul Fidelidade in April 2024**.
- **January 13, 2026 tier overhaul** - added Diamante Unique and Azul One at the top.
- **Capital One is NOT a current direct partner as of May 2026** - partnership lapsed; verify against Capital One''s official 2026 transfer-partner page before relying.
- **No major US flexible-currency direct partner** - Amex, Chase, Citi, Bilt, Wells Fargo do not transfer.
- **Marriott Bonvoy NOT on standard partner list as of May 2026** - verify before relying.
- **Star Alliance connecting partner via United (since 2020)** - Azul flights earn United MileagePlus miles.
- **Accor ALL double-dip** - earn ALL points on Azul flights for hotel-flier crossover.
- **Etihad Guest redeems on Azul from 6,000 miles** (verify route eligibility).
- **Azul Pelo Mundo partner network**: United, Copa ConnectMiles, TAP Miles&Go.
- **Points validity tier-dependent** - 3-10 years; Diamante Unique gets 10-year validity.
- **Pooling and family-transfer options exist within the program** - verify rules on voeazul.com.br.
- **Brazilian taxes and YQ on award tickets** are material.
- **Founded 2008 by David Neeleman** (also founded JetBlue, Breeze Airways, WestJet, Morris Air).
- **160+ destinations** - largest Brazilian network by city count.
- **No US co-brand card**.
- **Brazilian financial-restructuring discussions reported** - verify operational changes on voeazul.com.br.',
  award_chart = 'Azul Fidelidade uses dynamic / revenue-based pricing for own-metal redemptions. Partner pricing varies by partner (Etihad redemptions from 6,000 miles). Sample saver-band one-way pricing as of May 2026:

| Route | Cabin | Points |
|---|---|---|
| Domestic Brazil Azul | Economy | A few thousand+ (dynamic) |
| Etihad redemptions on Azul | Economy | 6,000+ (verify route) |
| Azul Pelo Mundo via United | Economy | per United partner pricing |
| Azul Pelo Mundo via Copa | Economy | per Copa pricing |
| TAP Miles&Go via Azul Pelo Mundo | Economy | per TAP pricing |

Pricing is dynamic on Azul metal - verify on voeazul.com.br before redeeming.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'azul';

-- ============================================================
-- 10. VOLARIS V.CLUB (Mexican ULCC paid discount club - NOT a points program)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Volaris v.club',
  alliance = 'none',
  hubs = ARRAY['MEX','GDL','TIJ','CUN'],
  intro = 'Volaris v.club is a paid annual subscription discount club operated by Volaris, the Mexican ULCC. Critically, **v.club is NOT a points program**: there is no miles currency, no transfer partners, no elite tiers, no award chart, and no lounges. It belongs to the same category as Sun Country UClub, Avelo PLUS, Frontier Discount Den, and the now-defunct Spirit Savers Club. The fleet is 120-130 A320-family aircraft serving MEX, GDL, TIJ, CUN, and a growing US-Mexico cross-border network. Volaris carries roughly 30 million passengers per year.

For US travelers the value math is straightforward subscription economics. Pricing as of May 2026: Individual $29.99/year, Duo (2 travelers) $49.99/year, Friends & Family (up to 9 travelers) $149.99/year. Each year you get up to MXN 500 (~$25-30) off every Volaris fare, an additional 20% discount, exclusive Thursday-only deals, and a 22-lb extra checked bag on Vuela Classic and Vuela Plus fares. The break-even sits around 3 Volaris flights per year. Note: v.club is distinct from v.pass, Volaris''s separate annual flight-pass subscription product.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Member-only fare floor** - up to MXN 500 (~$25-30) off every Volaris fare.
- **Additional 20% discount** stacks on already-low Volaris cash fares.
- **Thursday-only deals** - member-only promo cycle.
- **22-lb extra checked bag** included on Vuela Classic / Vuela Plus.
- **Yavas.com hotel discounts** through Volaris''s hotel partner platform.',
  sweet_spots = '- **Friends & Family tier (up to 9 travelers) at $149.99/year** is the best value when traveling with a group - works out to roughly $17/year per traveler.
- **3+ Volaris US-Mexico flights per year** is the rough break-even on the Individual subscription.
- **Member fares only visible when logged in** - non-members never see them.
- **Compare to Spirit Savers Club ($69.95/yr - now defunct), Frontier Discount Den ($59.99/yr), Avelo PLUS ($59-99/yr)** - v.club is the cheapest-entry US-relevant discount club.
- **22-lb extra checked bag** is unusual in the ULCC space - most charge separately.',
  tier_benefits = '[
    {"name": "Individual", "qualification": "$29.99/year", "benefits": ["1-traveler subscription", "Up to MXN 500 off every fare", "20% additional discount", "Thursday-only deals", "22-lb extra checked bag on Vuela Classic / Plus"]},
    {"name": "Duo", "qualification": "$49.99/year", "benefits": ["2-traveler subscription", "All Individual benefits applied to both travelers"]},
    {"name": "Friends & Family", "qualification": "$149.99/year", "benefits": ["Up to 9-traveler subscription", "All Individual benefits applied to all 9 travelers", "Best per-traveler value"]}
  ]'::jsonb,
  lounge_access = 'Volaris v.club does not include lounge access. Volaris is a ULCC and does not operate lounges.',
  quirks = '- **v.club is NOT a loyalty / points program** - it is a paid annual subscription discount club, like Sun Country UClub, Avelo PLUS, or Frontier Discount Den.
- **No miles, no award chart, no transfer partners, no elite tiers, no lounges**.
- **Pricing (May 2026)**: Individual $29.99/year, Duo $49.99/year, Friends & Family (up to 9) $149.99/year.
- **12-month validity from purchase**; auto-renews; cancel before renewal date.
- **v.club is DISTINCT from v.pass** - Volaris''s separate annual flight-pass product allowing flat-fee unlimited-flight bundles.
- **Up to MXN 500 (~$25-30) off every Volaris fare** as a member-only fare floor.
- **20% additional discount** on all fares.
- **Member fares visible only when logged in** - non-members never see them.
- **Thursday-only deals** are member-only promo cycle.
- **22-lb extra checked bag** included on Vuela Classic / Vuela Plus fares.
- **Yavas.com hotel discounts** via Volaris''s hotel partner platform.
- **Pricing displayed in MXN by default** - converts on US-side bookings.
- **Comparable discount-club programs covered on the site**: Sun Country UClub, Avelo PLUS, Frontier Discount Den. Spirit Savers Club is defunct as of May 2026.
- **Founded 2006 (Volaris)** - CEO Enrique Beltranena.
- **120-130 A320-family aircraft** serving MEX, GDL, TIJ, CUN.
- **Roughly 30 million passengers per year**.',
  award_chart = 'Volaris v.club is a paid subscription discount club, not a points program. There is no award chart.

Pricing tiers as of May 2026:
| Tier | Price | Travelers |
|---|---|---|
| Individual | $29.99/year | 1 |
| Duo | $49.99/year | 2 |
| Friends & Family | $149.99/year | up to 9 |

Member benefits (all tiers): up to MXN 500 off every fare, 20% additional discount, Thursday-only deals, 22-lb extra checked bag on Vuela Classic / Plus, Yavas.com hotel discounts.

Verify current pricing on volaris.com - subscription pricing nudges occasionally and v.club is distinct from v.pass.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'volaris';
