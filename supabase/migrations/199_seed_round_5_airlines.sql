-- Round 5 batch: 10 airline loyalty programs.
-- Each page draft was researched via WebSearch + cross-checked against a
-- Copilot fact sheet before being written here. Where Copilot and our
-- research disagreed, the resolution is documented in inline comments.

-- ============================================================
-- PREP: slug renames (kebab-case convention) + air-new-zealand seed
-- ============================================================
update programs set slug = 'eva-air' where slug = 'eva_air';
update programs set slug = 'korean-air' where slug = 'korean_air';
update programs set slug = 'virgin-australia' where slug = 'virgin_australia';

insert into programs (slug, type, name)
  values ('air-new-zealand', 'loyalty_program', 'Air New Zealand Airpoints')
  on conflict (slug) do nothing;

-- ============================================================
-- 1. AVIANCA LIFEMILES (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Avianca LifeMiles',
  alliance = 'star_alliance',
  hubs = ARRAY['BOG','SAL','LIM'],
  intro = 'Avianca LifeMiles is the loyalty program of the Bogota-based Star Alliance carrier, and it is one of the most US-traveler-friendly mileage currencies in the world thanks to a long bench of US transferable-points partners and a structural promise that it does not pass fuel surcharges through on partner award tickets. That single rule turns a transatlantic Lufthansa or SWISS premium-cabin redemption from a 700 Euro tax bill into something close to taxes-only, which is why LifeMiles keeps showing up in every "best Star Alliance program for Americans" list.

The program runs on a region-based published award chart, sells miles aggressively (the cash-and-points combo is genuinely useful when targeting specific awards), and routinely runs 25-30% transfer bonuses out of Amex, Citi, and Capital One. The trade-offs are real: their booking engine has well-documented quirks, customer service is hit-or-miss, and a $25 award booking fee applies per ticket. As of May 2026 LifeMiles remains a top-tier choice for US-Europe and US-South-America premium-cabin awards.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1 standard. No US federal excise tax (foreign carrier). Periodic 25-30% transfer bonuses; verify current promo on americanexpress.com.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "1:1", "notes": "1:1 standard. Verify on chase.com - Avianca was added to Chase UR''s lineup in 2023.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 standard. Capital One ran a 15% transfer bonus to LifeMiles in January 2026; verify current promo.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "1:1 standard. Citi ran a 25% transfer bonus to LifeMiles in March 2026; verify current promo.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1 on Rent Day only (1st of the month). Outside Rent Day, Bilt typically does not transfer to LifeMiles at this ratio.", "bonus_active": false},
    {"from_slug": "wells-fargo-rewards", "ratio": "1:1", "notes": "1:1 standard via the Autograph Journey Visa lineup; verify on wellsfargo.com.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 LifeMiles + 5,000-mile bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner premium cabins** - the headline play; no fuel surcharges on partner awards.
- **United domestic** - from 6,500 LifeMiles each way in saver economy, single-zone pricing across the contiguous US.
- **US-Europe in business** - typically 63,000-70,000 LifeMiles one-way on saver Lufthansa/SWISS/Austrian.
- **US-Europe in first** - 120,000-130,000 LifeMiles one-way when Lufthansa First space opens (usually inside 14 days).
- **Cash and points combos** - mix miles with cash when you are short on a target award; the conversion math is sometimes better than buying miles outright.
- **GOL Linhas Aereas** - bookable as a non-alliance partner; useful for intra-Brazil itineraries paired with a Star Alliance long-haul.',
  sweet_spots = '- **Transatlantic economy from 17,500 LifeMiles each way** at saver level on Star Alliance partners.
- **Lufthansa/SWISS/Austrian business class US-Europe** at 63,000-70,000 one-way with no YQ - the program''s flagship value.
- **Lufthansa First Class** at 120,000-130,000 one-way; space opens inside 14 days of departure.
- **Star Alliance intra-Asia business** in the 25,000-35,000 range one-way for short hops on EVA, ANA, or Singapore.
- **United US domestic from 6,500 each way** in saver economy.
- **South America premium cabin** on Avianca metal at sharp prices ex-BOG/LIM/SAL.',
  tier_benefits = '[
    {"name": "Red Plus", "qualification": "6,000 qualifying miles per year (1,000 must be on Avianca metal)", "benefits": ["Entry tier", "Mile expiry extended from 12 to 24 months", "Discounts on award booking fees"]},
    {"name": "Silver", "qualification": "12,000 qualifying miles per year (3,000 on Avianca)", "benefits": ["Star Alliance Silver", "Priority check-in on Avianca", "Avianca VIP Lounge access at hub airports", "2 domestic upgrade certificates per year (effective Feb 18, 2026)"]},
    {"name": "Gold", "qualification": "Threshold between Silver and Diamond; verify current number on lifemiles.com", "benefits": ["Star Alliance Gold", "Star Alliance Gold lounge access worldwide", "Priority boarding and baggage", "4 domestic upgrade certificates per year"]},
    {"name": "Diamond", "qualification": "45,000 qualifying miles per year (22,500 on Avianca)", "benefits": ["Star Alliance Gold", "Access to the new Diamond International VIP Lounge at BOG (opened 2026, near Gate 32 Terminal 1)", "8 domestic upgrade certificates per year", "Highest priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Avianca operates VIP Lounges at BOG, SAL, and LIM, with the new Diamond International VIP Lounge opening at BOG in 2026 (about 7,535 sq ft, near Gate 32 in Terminal 1). Silver and above get Avianca VIP Lounge access; Diamond unlocks the new Diamond lounge. Gold and Diamond members enjoy Star Alliance Gold lounge access worldwide on same-day Star Alliance flights. Non-elites can buy a day pass at BOG for around Col$128,000 (about $32) or 1,800 LifeMiles with a same-day Avianca or Star Alliance boarding pass.',
  quirks = '- **No fuel surcharges on partner awards** - the structural advantage that defines the program.
- **$25 award booking fee** per ticket whether you book online or by phone.
- **Mile expiry: 12 months activity-based** for non-elites (24 months for elites). Reinstate expired miles for $10 per 1,000.
- **Region-based award chart** with 20 regions; the contiguous US is split into 3 zones for partner pricing.
- **Cash and points combos** are genuinely useful and sometimes cheaper than buying miles outright.
- **GOL Linhas Aereas** is bookable as a non-alliance partner.
- **Booking engine quirks** - phantom space, partner availability that does not load, and occasional ticketing delays. Be patient or call.
- **Customer service is hit-or-miss** - English-speaking agents available but hold times vary.
- **Sells miles aggressively** with frequent buy-miles bonuses up to 145%.
- **Transfer bonuses run 25-30%** roughly quarterly out of Amex, Citi, and Cap One.
- **Diamond tier path requires 22,500 miles flown on Avianca metal** - hard for non-Latin-America-based members to reach.
- **2/4/8 domestic upgrade certificates** for Silver/Gold/Diamond effective Feb 18, 2026.',
  award_chart = 'LifeMiles uses a published region-based award chart with roughly 20 regions and per-cabin pricing for each region pair. The contiguous US is divided into 3 zones for partner pricing. Sample saver one-way pricing as of May 2026:

| Route | Economy | Business | First |
|---|---|---|---|
| US domestic on United | 6,500 | 12,500 | n/a |
| US-Europe (Star partners) | 30,000 | 63,000-70,000 | 120,000-130,000 |
| US-South America (Avianca) | 20,000 | 45,000 | n/a |
| US-North Asia (Star partners) | 40,000 | 75,000 | 120,000 |
| Intra-Europe short-haul | 7,500 | 15,000 | n/a |

Verify current pricing on lifemiles.com - the chart has been stable for several years but per-region pricing nudges occur.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'avianca';

-- ============================================================
-- 2. EMIRATES SKYWARDS (non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Emirates Skywards',
  alliance = 'none',
  hubs = ARRAY['DXB'],
  intro = 'Emirates Skywards is the loyalty program of the Dubai-based widebody specialist, and it is the only currency in the world that lets you redeem for "The Residence" - the three-room private suite on Emirates A380s. Beyond that headline, Skywards is a complicated currency: transferable from most major US flexible programs (Amex, Citi, Cap One, Bilt, Marriott), but at ratios that have moved repeatedly in 2025-2026 and a per-batch mile expiry that is one of the harshest in the industry.

The program is best treated as a targeted-redemption currency, not a long-term hoarding play. Heavy fuel surcharges on Emirates own metal (especially ex-Europe) and a March 4, 2026 partner distance chart that reshuffled which short-haul partner awards are cheap or expensive mean that Skywards rewards research over autopilot. Used well - JFK to Milan in business off-peak, JetBlue or Qantas short-haul under the new chart, an occasional Residence splurge - it is a useful complement to a US flexible-points stack.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "5:4", "notes": "5:4 effective Sept 16, 2025 (devalued from 1:1). No US federal excise tax (foreign carrier). 1,000 MR yields 800 Skywards Miles.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "n/a", "notes": "Partnership ENDED Oct 16, 2025. Chase UR no longer transfers to Emirates Skywards.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "4:3", "notes": "4:3 effective Jan 13, 2026 (devalued from 2:1.5 path). 1,000 Cap One miles yields 750 Skywards.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1000:800", "notes": "1,000:800 effective Jul 27, 2025 (devalued from 1:1). 1,000 ThankYou Points yields 800 Skywards.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1 on Rent Day only (1st of the month). Currently the only remaining 1:1 transfer partner from a major US flexible currency.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Skywards + 5,000-mile bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Emirates own-metal premium cabins** - business and first to/from the US, Europe, and Asia. Watch the YQ.
- **The Residence on A380** - the only program globally where this redemption exists.
- **JetBlue, Qantas, Japan Airlines short-haul** - new partner distance chart effective March 4, 2026 made some short-haul partner awards much cheaper.
- **Bilateral partners** - Copa, ITA Airways, TAP Air Portugal, and others bookable through Skywards.
- **Skywards Miles + Cash** at the booking flow, useful when topping off a target award.',
  sweet_spots = '- **JFK-MXP (Milan) Emirates business** at around 62,500 miles + low YQ off-peak - the cleanest US-Europe sweet spot in the program.
- **JetBlue short-haul under the March 4, 2026 partner chart** from as low as 3,000 miles one-way for the shortest-distance band.
- **Qantas intra-Australia** at sharp distance-band pricing post-March 2026.
- **Emirates US-Dubai-Asia in business** when YQ is tolerable; first class only available to Silver, Gold, and Platinum since May 12, 2025.
- **The Residence DXB-JFK** - the bucket-list redemption. Only one of these exists per A380, and pricing is steep, but it is the only way to get in for points.
- **Off-peak pricing** is real - target shoulder seasons for the deepest discounts.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier", "benefits": ["Earn Tier and Skywards Miles", "Priority Skywards customer service line"]},
    {"name": "Silver", "qualification": "25,000 Tier Miles within membership year", "benefits": ["30% mileage bonus on Emirates flights", "Priority check-in and boarding", "Lounge access on select fare classes", "Extra 12 kg checked baggage"]},
    {"name": "Gold", "qualification": "50,000 Tier Miles within membership year", "benefits": ["75% mileage bonus on Emirates flights", "Business class lounge access worldwide for self plus one guest", "Free seat selection", "Priority airport services", "Extra 16 kg checked baggage"]},
    {"name": "Platinum", "qualification": "150,000 Tier Miles within membership year + at least 1 First or Business segment", "benefits": ["100% mileage bonus on Emirates flights", "First class lounge access worldwide for self plus one guest", "Gold-for-companion nomination (one guest gets Gold benefits)", "Home check-in service in DXB", "Highest priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Emirates operates dedicated lounges at DXB (multiple by concourse and class), JFK, LAX, SFO, IAD, BOS, ORD, LHR, CDG, FRA, MUC, BKK, HKG, SIN, SYD, MEL, AKL, JNB, and other major destinations. First class lounges are accessible to Platinum members and First Class passengers; business class lounges to Gold members and Business Class passengers. Silver gets lounge access on select premium fare classes only. A typical reduced tier threshold + bonus tier miles promo runs May 8 through Aug 31, 2026 - verify on emirates.com.',
  quirks = '- **Per-batch mile expiry** - each mile expires 36 months from the month earned, individually, not on a rolling activity basis. One of the strictest rules in the industry.
- **The Residence** - bookable only via Skywards; no other program offers it.
- **First Class redemption restricted to Silver, Gold, and Platinum** since May 12, 2025.
- **March 4, 2026 partner distance chart** introduced 10 distance bands with very different pricing than the old chart - some short-haul partner awards got dramatically cheaper.
- **Heavy YQ on Emirates own metal**, especially ex-Europe.
- **Family pooling: My Family** allows up to 8 members (1 head + 7).
- **Co-brand: Emirates Skywards Premium World Elite Mastercard** issued by Barclays in the US.
- **Bilateral partners** include JetBlue, Qantas, Japan Airlines, Copa, ITA Airways, TAP Air Portugal, and others; Korean Air partnership status changes occasionally - verify before transferring.
- **Chase UR partnership ended Oct 16, 2025** - do not assume Chase UR is a route into Skywards.
- **Multiple US flexible-currency ratio devaluations in 2025-2026** - Amex 5:4, Citi 1000:800, Cap One 4:3.
- **Reduced tier thresholds + bonus tier miles promo** typically runs May 8 - Aug 31, 2026.',
  award_chart = 'Skywards uses a hybrid model: own-metal redemptions follow a published region-based saver chart with peak/off-peak pricing, and partner redemptions follow a 10-band distance chart effective March 4, 2026. Sample one-way saver pricing as of May 2026:

| Route | Economy | Business | First |
|---|---|---|---|
| JFK-DXB Emirates own metal | 42,500 (off-peak) | 90,000 (off-peak) | 136,000 (off-peak) |
| JFK-MXP Emirates own metal | 27,500 | 62,500 | n/a |
| JetBlue short-haul (band 1) | 3,000 | 7,500 | n/a |
| Qantas intra-Australia (band 2) | 6,000 | 12,000 | n/a |
| Japan Airlines intra-Japan (band 1-2) | 3,000-6,000 | 7,500-12,000 | n/a |

Verify current pricing on emirates.com/skywards.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'emirates';

-- ============================================================
-- 3. ETIHAD GUEST (non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Etihad Guest',
  alliance = 'none',
  hubs = ARRAY['AUH'],
  intro = 'Etihad Guest is the loyalty program of Abu Dhabi-based Etihad Airways, and it is at an inflection point in 2026. Amex Membership Rewards is ending its transfer relationship with Etihad on June 30, 2026 - flag this prominently in any planning, because Amex is currently the largest US bridge into the program. Etihad still has Capital One, Citi, Bilt, and Marriott on the bench, plus Rove Miles (a newer UAE-based transferable currency), but the post-June 2026 picture is meaningfully thinner for US travelers.

The program runs a unified 10-band partner distance chart - same pricing across all partners regardless of operating carrier - which is genuinely unusual and occasionally produces very strong values. Own-metal redemptions have been dynamic since 2023, removing some predictability. Etihad''s premium cabins (Apartments, The Residence on A380, business class on the 787 and A350) are excellent products, and AUH''s Premium First Apartment lounge is one of the best in the world. As of May 2026 Etihad Guest is a "use it well or skip it" currency: the rules reward research, and the cancellation policy is brutal.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1 ENDING June 30, 2026 - flag prominently. No US federal excise tax (foreign carrier). After June 30 Amex no longer transfers to Etihad Guest.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 standard. Verify on capitalone.com - Etihad has been a stable Cap One partner since 2018.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "varies", "notes": "1:1 from Citi premium cards (Premier, Strata Premier, Prestige); 1:0.7 from non-premium ThankYou cards. Do not assume a flat 1:1.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1 on Rent Day only (1st of the month).", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Etihad Guest + 5,000-mile bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Etihad own-metal premium cabins** - business on the 787/A350, Apartments and The Residence on the A380.
- **Unified 10-band partner distance chart** - same pricing across all partners regardless of operating carrier; sometimes produces very strong values for short-haul.
- **Stopovers in AUH** allowed on award itineraries on Etihad metal.
- **The Residence A380** - bookable through Etihad Guest (one of two programs globally that book it; Emirates is the other).
- **Family Membership pooling** for up to 9 members (1 head + 8).',
  sweet_spots = '- **Partner short-haul band 1** at very competitive pricing under the unified distance chart.
- **AUH stopover on long-haul Etihad business** - tack on a few days in Abu Dhabi for the same award price.
- **Etihad business JFK-AUH off-peak** - watch dynamic pricing windows; off-peak releases happen.
- **The Residence A380** if you can find availability and afford the mile spend.
- **Etihad Apartments** on the A380 - first-class private suite product, redeemable through Etihad Guest.
- **March 18, 2026 - March 31, 2027 promo: 25% reduced earn thresholds** (Silver 18,750 / Gold 37,500 / Platinum 93,750) - good time to push for status.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "25,000 Tier Miles to earn / 20,000 to maintain (18,750 to earn during March 18, 2026 - March 31, 2027 promo)", "benefits": ["Choose Your Perks: pick 2 benefits", "Priority check-in", "Extra baggage allowance", "Tier mile bonus on Etihad flights"]},
    {"name": "Gold", "qualification": "50,000 Tier Miles to earn / 40,000 to maintain (37,500 to earn during the 2026-2027 promo)", "benefits": ["Choose Your Perks: pick 4 benefits", "Etihad lounge access on Etihad flights", "Priority boarding and baggage", "Higher tier mile bonus", "Free seat selection"]},
    {"name": "Platinum", "qualification": "125,000 Tier Miles to earn / 100,000 to maintain (93,750 to earn during the 2026-2027 promo)", "benefits": ["Choose Your Perks: pick 5 benefits", "Premium First Apartment lounge access at AUH", "Highest tier mile bonus", "Priority for waitlists and upgrades", "Dedicated Platinum service line"]}
  ]'::jsonb,
  lounge_access = 'Etihad operates the Premium First Apartment lounge at AUH (Zayed International) - one of the most highly rated airline lounges in the world - alongside business and arrivals lounges. Gold members get Etihad business lounge access on Etihad flights; Platinum unlocks the Premium First Apartment. Silver does not get standard lounge access (Choose Your Perks can include lounge passes). Outside AUH, Etihad uses contracted lounges in major outstations.',
  quirks = '- **Amex MR transfer ending June 30, 2026** - the biggest news for US members; plan accordingly.
- **Cancellation policy** - 25% miles forfeited on any cancellation, scaling up to 100% within 72 hours of departure. Brutal.
- **Mile expiry: 18 months from last earn or redeem activity**. Critical nuance: only qualifying flight activity resets the clock - transfers in and award purchases do NOT reset expiry. Buying miles cannot save an expiring balance.
- **Dynamic own-metal pricing since 2023** - no published own-metal chart anymore.
- **Unified 10-band partner distance chart** - same pricing across all partners regardless of operating carrier.
- **The Residence A380** bookable through Etihad Guest.
- **Family Membership pooling** up to 9 members (1 head + 8).
- **Choose Your Perks** - Silver picks 2, Gold picks 4, Platinum picks 5 benefits to customize the tier experience.
- **March 18, 2026 - March 31, 2027 promo** drops earn thresholds 25% across all tiers.
- **Citi transfer ratio depends on which Citi card you hold** - premium cards get 1:1, non-premium cards get 1:0.7.
- **Stopovers in AUH allowed** on award itineraries on Etihad metal.
- **Rove Miles (UAE) is a newer transferable partner** - verify on rove.io if you have access.',
  award_chart = 'Etihad uses dynamic pricing on own-metal awards since 2023 (no published chart) and a unified 10-band distance chart for all partner awards. Sample partner one-way saver pricing under the distance chart as of May 2026:

| Distance band | Economy | Business | First |
|---|---|---|---|
| 0-1,000 miles (band 1) | 6,000 | 12,000 | 24,000 |
| 1,001-2,000 (band 2) | 12,000 | 24,000 | 44,000 |
| 2,001-3,000 (band 3) | 18,000 | 36,000 | 64,000 |
| 4,001-5,000 (band 5) | 28,000 | 60,000 | 100,000 |
| 6,001-7,000 (band 7) | 38,000 | 80,000 | 130,000 |
| 8,001+ (band 10) | 50,000 | 110,000 | 180,000 |

Verify current pricing on etihadguest.com - the unified chart has been stable since 2024 but band edges occasionally shift.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'etihad';

-- ============================================================
-- 4. KOREAN AIR SKYPASS (SkyTeam)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Korean Air SKYPASS',
  alliance = 'skyteam',
  hubs = ARRAY['ICN'],
  intro = 'Korean Air SKYPASS is the loyalty program of South Korea''s flag carrier, and it sits in an unusual spot for US travelers: effectively walled off from US flexible currencies. As of May 2026 it is not a transfer partner of Amex, Chase, Capital One, Citi, or Bilt, and Marriott Bonvoy ended its transfer relationship with SKYPASS in 2025. The only US-issued bridge is the U.S. Bank SKYPASS Visa Signature co-brand card, which is unusually generous for a foreign-airline co-brand.

What you get in return is one of the most stable region-based award charts in the industry (no major devaluation since the 2023 plan was scrapped), 10-year mile expiry (one of the most generous), and a headline redemption - JFK to ICN First Class on the 747-8i Kosmo Suite 2.0 at 80,000 miles off-peak one-way - that beats almost everything else in points-and-miles. The trade-off is the partner-award restriction since 2023: partner awards must be booked for the account holder or a registered family member, period. As of May 2026 SKYPASS is a niche, high-value currency for travelers who can earn it or transfer from the U.S. Bank co-brand.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Korean Air own-metal premium cabins** - First on the 747-8i (Kosmo Suite 2.0) and A380, business on the 787 and 777.
- **SkyTeam partner awards** - Delta, Air France, KLM, Virgin Atlantic, China Eastern, and others. Partner awards restricted to account holder + registered family members only since 2023.
- **Domestic Korea on Korean Air** at very modest mile prices.
- **Hawaii from US mainland on Delta** at competitive partner pricing.
- **U.S. Bank SKYPASS Visa Signature** is the only US-issued earning route outside flying Korean Air or partners.',
  sweet_spots = '- **JFK-ICN First Class on 747-8i Kosmo Suite 2.0 at 80,000 miles off-peak one-way** - the headline value play vs around $12,000 cash. The 747-8i is still flying as of May 2026 with no announced retirement.
- **SkyTeam business North America-Europe at 80,000 miles round-trip** - extremely strong vs Flying Blue or Delta dynamic pricing.
- **North America-Hawaii on Delta at 25,000 miles round-trip economy** - one of the cheapest Hawaii redemptions for US travelers.
- **Korean Air business Asia at around 62,500 off-peak / 75,000 peak one-way**.
- **Off-peak pricing year-round** is a Morning Calm Premium perk - useful for status holders.
- **10-year mile expiry** means SKYPASS miles are genuinely a long-term currency.',
  tier_benefits = '[
    {"name": "Morning Calm Club", "qualification": "50,000 lifetime SKYPASS miles OR 40 KE flight segments lifetime - LIFETIME status", "benefits": ["SkyTeam Elite", "KAL Lounge access on Korean Air international flights", "Priority check-in and baggage", "Bonus mile earning on Korean Air"]},
    {"name": "Morning Calm Premium", "qualification": "500,000 lifetime miles on KE/SkyTeam - LIFETIME status", "benefits": ["SkyTeam Elite Plus", "Off-peak award pricing year-round", "Full KAL Lounge access for self plus one", "Higher bonus mile earning", "Priority for waitlists and operational upgrades"]},
    {"name": "Million Miler", "qualification": "1,000,000 lifetime miles - LIFETIME status", "benefits": ["All Morning Calm Premium benefits", "Dedicated Million Miler phone line", "Top priority for waitlists and operational upgrades", "Recognition perks at ICN"]}
  ]'::jsonb,
  lounge_access = 'Korean Air operates KAL Lounges at ICN (Incheon) and select hubs including JFK, LAX, ORD, SFO, GUM, and major Asian outstations. Prestige Class passengers, Morning Calm Premium members, and Million Miler members get full lounge access. Morning Calm Club gets KAL Lounge access on Korean Air international flights only. SkyTeam Elite Plus reciprocity applies worldwide via SkyTeam partner lounges for Morning Calm Premium and Million Miler.',
  quirks = '- **No US flexible currency transfers** - effectively walled off from Amex, Chase, Capital One, Citi, and Bilt.
- **Marriott Bonvoy partnership ended in 2025** - do not assume Bonvoy is a route into SKYPASS.
- **U.S. Bank SKYPASS Visa Signature** is the only US-issued earning route outside flying Korean Air or partners.
- **10-year mile expiry** - one of the most generous in the industry.
- **Partner awards restricted to family-only since 2023** - the passenger must be the account holder or a registered family member, with documentation.
- **Family pooling: up to 5 members with documentation**.
- **Asiana acquisition completed December 2024**, full integration target January 2027.
- **Award chart is stable** - no major devaluation since the 2023 plan was scrapped.
- **747-8i still flying with Kosmo Suite 2.0 First product** as of May 2026 - the headline redemption product.
- **Lifetime tiers** - Morning Calm Club, Morning Calm Premium, and Million Miler are all lifetime once earned.
- **Atmos Rewards (Alaska/Hawaiian) partnership scaled back January 1, 2026** - earning ended; redemptions limited to Alaska domestic and limited Hawaiian after April 22, 2026.
- **Off-peak award pricing year-round** is a Morning Calm Premium perk worth chasing.',
  award_chart = 'SKYPASS uses a published region-based award chart with peak and off-peak pricing. Sample one-way pricing as of May 2026:

| Route | Cabin | Off-peak | Peak |
|---|---|---|---|
| JFK-ICN Korean Air | Economy | 35,000 | 45,000 |
| JFK-ICN Korean Air | Business | 62,500 | 75,000 |
| JFK-ICN Korean Air | First (747-8i) | 80,000 | 100,000 |
| US-Europe SkyTeam partners | Business | 40,000 (round-trip 80,000) | 50,000 |
| US-Hawaii Delta | Economy | 12,500 (round-trip 25,000) | 15,000 |
| Korea domestic Korean Air | Economy | 5,000 | 7,000 |

Verify current pricing on koreanair.com. The chart has been stable since 2023.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'korean-air';

-- ============================================================
-- 5. AEROMEXICO REWARDS (SkyTeam)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Aeromexico Rewards',
  alliance = 'skyteam',
  hubs = ARRAY['MEX','MTY'],
  intro = 'Aeromexico Rewards (formerly Club Premier, with the underlying currency rebranded from "Kilometers" to "Aeromexico Points" in 2024) is the loyalty program of Mexico''s flag carrier. For US travelers, the headline reason to care is the 1:1.6 transfer ratio from Amex Membership Rewards - the best ratio in Amex''s entire transfer lineup. 1,000 MR yields 1,600 Aeromexico Points, which under the right redemption can produce sub-1-cent-per-MR effective pricing on premium cabins.

The trade-off arrived in August 2025: Aeromexico moved most own-metal awards to dynamic pricing, gutting many of the historical sweet spots. A classic published chart still exists for limited Mexico-route inventory, and per-sector partner pricing remains useful, but the program is no longer the autopilot value it was pre-2025. The SkyTeam Round-the-World award (224,000 points economy / 352,000 business, up to 15 stopovers) is the new headline play. As of May 2026 Aeromexico Rewards is a research-rewarded currency best held in MR until you have a specific target.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1.6", "notes": "1:1.6 standard - the best ratio in Amex MR''s lineup. No US federal excise tax (foreign carrier). 1,000 MR yields 1,600 Aeromexico Points.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 standard. Verify on capitalone.com.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "n/a", "notes": "Partnership ENDED Jan 25, 2026. Citi ThankYou no longer transfers to Aeromexico Rewards.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Aeromexico Points + 5,000-point bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **SkyTeam Round-the-World award** at 224,000 points economy / 352,000 business, up to 15 stopovers (5 per continent) - the headline value play post-August 2025 devaluation.
- **US-Mexico City economy classic award from around 10,000 points each way** - useful for short business trips or weekend escapes.
- **Domestic Mexico flights at 5,000-10,000 points one-way economy**.
- **SkyTeam partner premium cabin** redemptions at per-sector pricing - some sweet spots remain on Delta, Korean Air, and others.
- **Aeromexico own-metal**, but expect dynamic pricing - useful only at off-peak times when point pricing tracks low cash fares.',
  sweet_spots = '- **SkyTeam Round-the-World 224K economy / 352K business** with up to 15 stopovers - the post-2025 headline play.
- **US to Southeast Asia in business at around 128,000 points one-way** via SkyTeam partners (verify availability before transferring; per-sector pricing varies).
- **US-Mexico City economy classic award from around 10,000 points each way**.
- **Domestic Mexico from 5,000-10,000 points one-way** in economy.
- **Amex MR 1:1.6 ratio** - even if you do not have a target, this is the best Amex transfer ratio for opportunistic stockpiling.
- **24-month activity-based expiry** - any qualifying activity resets the clock, making expiry manageable for active members.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry SkyTeam tier; threshold varies - verify on aeromexico.com", "benefits": ["SkyTeam Elite", "Priority check-in", "Bonus point earning on Aeromexico"]},
    {"name": "Gold", "qualification": "Mid-tier SkyTeam Elite; threshold varies - verify on aeromexico.com", "benefits": ["SkyTeam Elite", "Salones Premier lounge access on Aeromexico international flights", "Higher bonus point earning", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "80,000 qualifying points per year", "benefits": ["SkyTeam Elite Plus", "Salones Premier lounge access for self plus one companion", "Free seat selection", "Higher bonus point earning", "Priority for waitlists and upgrades"]},
    {"name": "Titanium", "qualification": "100,000 qualifying points per year (with at least 80,000 from KL/AM/DL flights)", "benefits": ["SkyTeam Elite Plus", "120-hour auto-upgrade window on Aeromexico", "1 free award redemption per year with waived service charge", "Premium bonus point earning", "Highest priority for waitlists and operational upgrades"]}
  ]'::jsonb,
  lounge_access = 'Aeromexico operates Salones Premier lounges at MEX (Mexico City), MTY (Monterrey), GDL (Guadalajara), and CUN (Cancun). Gold gets lounge access on Aeromexico international flights; Platinum and Titanium get full Salones Premier access for self plus one companion. SkyTeam Elite Plus reciprocity applies worldwide via SkyTeam partner lounges for Platinum and Titanium.',
  quirks = '- **Best Amex MR transfer ratio in the lineup at 1:1.6** - 1,000 MR yields 1,600 Aeromexico Points.
- **Citi ThankYou partnership ended Jan 25, 2026** - do not assume Citi is a route into Aeromexico.
- **August 2025 devaluation** moved most own-metal awards to dynamic pricing, gutting many historical sweet spots.
- **Classic published chart still exists for limited Mexico-route inventory**.
- **Per-sector partner pricing** - some SkyTeam sweet spots remain on Delta, Korean Air, and others.
- **Rebrand 2024**: Club Premier -> Aeromexico Rewards; Kilometers -> Aeromexico Points.
- **SkyTeam Round-the-World award** is the new headline value play - 224,000 economy / 352,000 business with up to 15 stopovers (5 per continent).
- **24-month activity-based expiry** - any qualifying activity resets the clock.
- **Family pooling: Aeromexico Rewards Family** for up to 8 members.
- **4 elite tiers (Silver, Gold, Platinum, Titanium)** - do not drop Silver from the path.
- **Titanium requires 80,000 of the 100,000 qualifying points from KL/AM/DL flights** - effectively a JV-flying tier.
- **Delta holds an equity stake in Grupo Aeromexico** (verify current percentage; reduced post-bankruptcy).',
  award_chart = 'Aeromexico Rewards uses dynamic pricing on most own-metal awards since August 2025. A classic published chart remains for limited Mexico-route inventory, and partner awards use per-sector pricing. Sample one-way pricing as of May 2026:

| Route | Cabin | Points |
|---|---|---|
| US-MEX classic award | Economy | 10,000-15,000 |
| Domestic Mexico | Economy | 5,000-10,000 |
| US-Europe SkyTeam partners | Business | 80,000-100,000 |
| US-Southeast Asia partners | Business | ~128,000 (verify availability) |
| SkyTeam Round-the-World | Economy / Business | 224,000 / 352,000 (round-trip, up to 15 stopovers) |

Verify current pricing on aeromexico.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aeromexico';

-- ============================================================
-- 6. VELOCITY FREQUENT FLYER (Virgin Australia, non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Velocity Frequent Flyer',
  alliance = 'none',
  hubs = ARRAY['SYD','BNE','MEL'],
  intro = 'Velocity Frequent Flyer is the loyalty program of Virgin Australia, a Bain Capital-owned narrowbody carrier flying about 107 Boeing 737s as of mid-2026 (with 12 more 737 MAX 8s arriving in 2026 and 4 Embraer E190-E2s for the VARA regional subsidiary). Velocity is non-aligned - despite recurring rumors of a SkyTeam join, no formal announcement has been made as of May 2026. What it does have is a long-standing US Amex Membership Rewards 1:1 transfer relationship, which is the only major US flexible-currency route in.

For US travelers, Velocity is mostly a partner-redemption currency. Singapore Airlines KrisFlyer-style awards through Velocity, ANA business class US-Tokyo, Qatar Qsuite (with caveats on YQ pass-through), and Air New Zealand long-haul are the practical use cases. Domestic Australia on Virgin Australia from 7,800 points one-way short-haul (e.g. SYD-MEL) is a strong economy redemption when you are already in-region. As of May 2026 the program is mid-overhaul: a new Platinum Plus top tier launched October 1, 2025, and Status Credit qualification now requires 50% of activity on Virgin Australia metal.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1 standard. No US federal excise tax (foreign carrier). Long-standing US transfer partner.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Velocity + 5,000-point bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Singapore Airlines partner awards** through Velocity - watch availability, since SQ releases more partner space to its own KrisFlyer than to Velocity.
- **ANA business class US-Tokyo** via the partner chart.
- **Qatar Qsuite** via Velocity (heavy YQ pass-through caveat).
- **Air New Zealand long-haul** including AKL-JFK and trans-Pacific routes.
- **Domestic Australia on Virgin Australia from 7,800 points one-way short-haul** (e.g. SYD-MEL).
- **United, Air Canada, Etihad** as bilateral partners with case-by-case YQ.',
  sweet_spots = '- **Domestic Australia on VA from 7,800 points one-way short-haul** - the cheapest in-region economy redemption.
- **Singapore Airlines KrisFlyer Saver awards via Velocity** when SQ releases the space.
- **ANA business class US-Tokyo** via the partner chart at competitive mileage.
- **Qatar Qsuite** via Velocity if you can swallow the YQ.
- **Amex MR 1:1 transfer** as a low-friction route in - one of the simplest non-aligned partner relationships in the Amex lineup.
- **Status Points 24-month expiry** with activity reset - manageable for occasional users.',
  tier_benefits = '[
    {"name": "Red", "qualification": "Entry tier", "benefits": ["Earn Points and Status Credits", "Online check-in"]},
    {"name": "Silver", "qualification": "Approximately 250 Status Credits within membership year (50% on VA-operated/marketed flights since Oct 1, 2025)", "benefits": ["Priority check-in and boarding on Virgin Australia", "Bonus Point earning", "Extra checked baggage"]},
    {"name": "Gold", "qualification": "Approximately 500 Status Credits within membership year (50% VA flying)", "benefits": ["Virgin Australia Lounge access", "Premium seat selection", "Higher bonus Point earning", "Priority airport services"]},
    {"name": "Platinum", "qualification": "Approximately 1,000 Status Credits within membership year (50% VA flying)", "benefits": ["Premium Virgin Australia Lounge access for self plus one guest", "Highest bonus Point earning", "Priority for waitlists and upgrades", "Dedicated Platinum service line"]},
    {"name": "Platinum Plus", "qualification": "2,000 Status Credits with at least 1,500 from VA-operated/marketed flights (NEW top tier, effective Oct 1, 2025)", "benefits": ["All Platinum benefits plus enhanced recognition", "Highest priority for waitlists and operational upgrades", "Premium concierge support"]}
  ]'::jsonb,
  lounge_access = 'Virgin Australia operates Lounges at SYD, MEL, BNE, PER, ADL, GLD, and CBR. Gold and above get lounge access on Virgin Australia flights; Platinum and Platinum Plus get premium lounge access for self plus one guest. Velocity is not a SkyTeam member, so there is no SkyTeam reciprocity. Partner lounge reciprocity applies on a case-by-case basis depending on the operating partner.',
  quirks = '- **Non-aligned** - despite recurring rumors of a SkyTeam join, no formal announcement as of May 2026.
- **Amex MR 1:1 is the only major US flexible-currency route in** - long-standing partner.
- **Most other Velocity bank partners are Australian/NZ** (ANZ, NAB, etc.).
- **No US-issued co-brand card**.
- **All-narrowbody 737 fleet** as of mid-2026 - 737-800 + 737 MAX 8. NO widebodies.
- **12 more 737 MAX 8s and 4 Embraer E190-E2s arriving in 2026**.
- **Status Points 24-month expiry** with activity reset.
- **Family pooling: 6 members max**.
- **Forever Gold lifetime tier** exists separately under legacy criteria.
- **50% VA-flying requirement for Silver/Gold/Platinum status earn or maintain** since Oct 1, 2025.
- **Platinum Plus is a NEW top tier** as of Oct 1, 2025 - 2,000 Status Credits with at least 1,500 from VA-operated/marketed flights.
- **Bain Capital-owned post-2020 administration / 2021 relaunch**.
- **Carrier surcharges vary widely by partner** - Singapore is low; Qatar and Etihad heavy YQ.
- **Most partner awards must be booked by phone**.',
  award_chart = 'Velocity uses a region-based "Reward Seat" chart for Virgin Australia and bilateral partners (Singapore, Qatar, ANA, Etihad, United, Air Canada, Air New Zealand, and others). Carrier surcharges vary widely by partner - Singapore is low; Qatar/Etihad heavy YQ. Sample one-way Reward Seat pricing as of May 2026:

| Route | Cabin | Points |
|---|---|---|
| Domestic Australia VA short-haul | Economy | 7,800-12,500 |
| Domestic Australia VA short-haul | Business | 15,500-23,500 |
| Australia-Asia VA / Singapore | Economy | 25,000-35,000 |
| Australia-Asia partners | Business | 60,000-80,000 |
| US-Asia ANA via Velocity | Business | ~75,000 (verify) |
| US-Australia Air NZ | Business | ~85,000 (verify) |

Verify current pricing on velocityfrequentflyer.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'virgin-australia';

-- ============================================================
-- 7. LATAM PASS (rejoining oneworld 2026)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'LATAM Pass',
  alliance = 'oneworld',
  hubs = ARRAY['SCL','GRU','LIM','BOG'],
  intro = 'LATAM Pass is the loyalty program of LATAM Airlines Group, the largest airline group in Latin America with about 340 aircraft across hubs in Santiago, Sao Paulo, Lima, and Bogota. LATAM left oneworld in 2020 and is rejoining per industry reports during 2026 - confirm formal status before relying on alliance benefits. Independent of alliance status, LATAM''s joint venture with Delta and Aeromexico continues, and partner Qualifying Points earning narrowed to Delta + Aeromexico in March 2026.

For US travelers, LATAM Pass is a niche currency. There is no Amex MR or Chase UR transfer relationship. Capital One and Citi ThankYou both list LATAM at 1:1, with Bilt soft-confirmed. Marriott Bonvoy 3:1 is the most reliable bridge in. Own-metal awards moved to dynamic pricing years ago, capping per-point value near 1 cent. The opportunity post-rejoin would be Star and oneworld partner redemptions if the alliance benefits formalize - until then, treat LATAM Pass as a transfer-target-of-last-resort unless you have a specific Delta partner play in mind.',
  transfer_partners = '[
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 listed in 2026 partner directories. Verify on capitalone.com - pricing rarely beneficial given dynamic own-metal awards.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "1:1 active in 2026 per third-party listings (NerdWallet). Verify on citi.com.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "Soft-confirmed - listed in some sources, not in others. Verify before transferring on biltrewards.com.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard - the most reliable US-issued bridge in.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Delta US domestic via LATAM Pass partner chart** - must be booked by phone; per-sector pricing.
- **LATAM own-metal South America awards** at off-peak times when point pricing tracks low cash fares.
- **Star Alliance and oneworld partner redemptions** if and when the oneworld rejoin formalizes in 2026.
- **Aeromexico partner redemptions** under the joint venture.
- **Domestic South America on LATAM** at sharp prices for in-region travel (off-peak only).',
  sweet_spots = '- **Delta US domestic by phone via LATAM Pass** - per-sector pricing can occasionally beat Delta SkyMiles dynamic pricing.
- **Off-peak own-metal South America economy** - rare but possible at sub-1-cent per point.
- **Potentially valuable Star or oneworld partner redemptions if oneworld rejoin formalizes** - watch for announcement during 2026.
- **Marriott Bonvoy 3:1 transfer** as the most reliable US bridge in.
- **36-month expiry from earn (rolling)** is moderately generous.',
  tier_benefits = '[
    {"name": "Gold", "qualification": "Entry elite tier; verify threshold on latam.com", "benefits": ["4 cabin upgrade segments within South America", "Bonus mile earning on LATAM", "Priority check-in"]},
    {"name": "Platinum", "qualification": "Mid elite tier; verify threshold on latam.com", "benefits": ["8 South America + 2 outside cabin upgrade segments", "2 checked bags", "Lounge access for self plus one companion"]},
    {"name": "Black", "qualification": "Top elite tier; verify threshold on latam.com", "benefits": ["Unlimited South America + 8 outside cabin upgrade segments", "Lounge access for self plus one companion", "Highest bonus mile earning"]},
    {"name": "Black Signature", "qualification": "Invitation-only top tier", "benefits": ["Family group + companion lounge access on LATAM domestic and international flights", "Full premium suite of benefits", "Dedicated concierge"]}
  ]'::jsonb,
  lounge_access = 'LATAM operates lounges at SCL, GRU, LIM, MIA, JFK, and other major hubs. Platinum and above get lounge access for self plus one companion on LATAM flights; Black Signature extends companion lounge access to family groups on LATAM domestic and international flights. oneworld lounge reciprocity will resume if and when the oneworld rejoin formalizes in 2026.',
  quirks = '- **Rejoining oneworld 2026** - confirm formal status before relying on alliance benefits.
- **No Amex MR or Chase UR transfer relationship**.
- **Capital One, Citi, Bilt all soft-listed at 1:1** - verify current status before transferring.
- **Marriott Bonvoy 3:1 is the most reliable US bridge in**.
- **Own-metal awards moved to dynamic pricing** - per-point value capped near 1 cent.
- **Partner awards on unpublished chart** - must be booked by phone.
- **Delta + Aeromexico joint venture continues** independent of alliance status.
- **March 2026 narrowed Qualifying Points-earning partners to Delta + Aeromexico** - was previously a wider SkyTeam/oneworld set.
- **From Jan 1, 2026, Premium Economy / Business / Full fares need to opt-in to LATAM Pass Bonus** to earn additional Qualifying Points (only above 23,500 QP threshold).
- **Gold Plus tier discontinued in 2025**.
- **No US-issued co-brand** (Mastercard exists in Brazil, Chile, Peru only).
- **Family pooling: Familia LATAM Pass** for up to 8 members.
- **36-month expiry from earn (rolling)**.
- **Delta holds approximately 10% equity stake in LATAM Airlines Group**.',
  award_chart = 'LATAM Pass uses dynamic pricing on own-metal awards (no published chart). Partner awards follow an unpublished chart and must be booked by phone. Sample own-metal one-way pricing as of May 2026:

| Route | Cabin | Points (typical range) |
|---|---|---|
| US-Sao Paulo own metal | Economy | 35,000-60,000 (dynamic) |
| US-Sao Paulo own metal | Business | 100,000-180,000 (dynamic) |
| Domestic South America short-haul | Economy | 5,000-15,000 (dynamic) |
| Delta US domestic via partner chart | Economy | per-sector by phone (verify) |

Verify current pricing on latam.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'latam';

-- ============================================================
-- 8. EVA AIR INFINITY MILEAGELANDS (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'EVA Air Infinity MileageLands',
  alliance = 'star_alliance',
  hubs = ARRAY['TPE'],
  intro = 'EVA Air Infinity MileageLands is the loyalty program of Taiwan-based EVA Air, a Star Alliance carrier with about 85 widebodies (777-300ER, 787-9/10, A330) and a remarkable safety record - zero hull losses, accidents, or fatalities since founding (verify currency of claim on evaair.com). For US travelers the program''s value is concentrated in Royal Laurel business class, one of the top-rated business cabins globally, and the rare comfort of a published, fixed region-based award chart in an industry that has mostly moved to dynamic pricing.

The catch is the transfer-partner picture. US Amex MR is not a partner (Singapore and Hong Kong Amex transfers exist but US Amex does NOT). Chase UR is not a partner. Capital One transfers at 4:3 (a 25% haircut from the former 1:1). Citi ThankYou transfers at 1:1 but takes 7-10 days - notably slow. Marriott Bonvoy 3:1 is the most predictable bridge. As of May 2026 EVA Infinity MileageLands is best treated as a destination-specific currency: build a balance only when you have a Royal Laurel redemption in mind.',
  transfer_partners = '[
    {"from_slug": "capital-one", "ratio": "4:3", "notes": "4:3 effective (25% haircut from former 1:1). 1,000 Cap One miles yields 750 Infinity MileageLands miles. No US federal excise tax (foreign carrier).", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "1:1 standard but transfers take 7-10 days - notably slow. Plan ahead.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Infinity MileageLands miles + 5,000-mile bonus at the 60K tier. The most predictable US bridge.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **EVA Air Royal Laurel business class** - one of the top-rated business cabins globally; the headline product.
- **Star Alliance partner premium cabins** on the published partner chart.
- **Up to 2 free stopovers on round-trip Star Alliance itineraries** - visit 3 cities for 1 round-trip cost.
- **EVA business class within Asia** at competitive intra-Asia mile pricing.
- **North America-Asia EVA business** at 75,000-80,000 miles one-way on direct flights.',
  sweet_spots = '- **EVA Royal Laurel business class within Asia at around 50,000 miles round-trip** (TPE-BKK, TPE-SIN, TPE-HKG).
- **North America-Asia EVA business at 75,000-80,000 miles one-way** (LAX-TPE, ORD-TPE, JFK-TPE).
- **Up to 2 free stopovers on round-trip Star Alliance itineraries** - genuinely useful for multi-city trips.
- **Published, fixed region-based award chart** - rare in 2026 and a structural advantage for planners.
- **Citi ThankYou 1:1 transfer** if you can wait 7-10 days for the transfer to complete.
- **Marriott Bonvoy 3:1** as the most predictable bridge.',
  tier_benefits = '[
    {"name": "Green", "qualification": "Entry tier", "benefits": ["Earn Status Miles and Award Miles", "Online check-in"]},
    {"name": "Silver", "qualification": "30,000 Status Miles + 4 EVA/UNI international flights OR 26 EVA/UNI international flights within membership year", "benefits": ["Star Alliance Silver", "15% mileage bonus on EVA flights", "Priority check-in and waitlist"]},
    {"name": "Gold", "qualification": "50,000 Status Miles OR 50 EVA/UNI international flights within membership year", "benefits": ["Star Alliance Gold", "25% mileage bonus on EVA flights", "Star Alliance lounge access worldwide", "Priority boarding and baggage", "Free seat selection"]},
    {"name": "Diamond", "qualification": "120,000 Status Miles OR 100 EVA/UNI international flights within membership year", "benefits": ["Star Alliance Gold", "Top tier bonus mileage on EVA flights", "Priority boarding extended to companions (formalized May 1, 2026)", "Highest priority for waitlists and operational upgrades", "Dedicated Diamond service line"]}
  ]'::jsonb,
  lounge_access = 'EVA operates "The Infinity", "The Star", "The Garden", and "The Club" lounges at TPE (Taoyuan), with smaller lounges at major outstations. Gold and Diamond members get Star Alliance lounge access worldwide on same-day Star Alliance flights. Silver members get priority check-in and waitlist but not standard lounge access.',
  quirks = '- **US Amex MR is NOT a partner** - Singapore/HK Amex transfers exist but US Amex does not.
- **Chase UR is NOT a partner**.
- **Capital One transfers at 4:3** (25% haircut from former 1:1).
- **Citi ThankYou transfers at 1:1 but takes 7-10 days** - notably slow. Plan ahead.
- **Bilt is NOT a partner**. Wells Fargo is NOT a partner.
- **Marriott Bonvoy 3:1** is the most predictable bridge.
- **Hilton Honors 10:1** exists (poor ratio, but available).
- **Published, fixed region-based award chart** - rare in 2026.
- **Up to 2 free stopovers on round-trip Star Alliance itineraries**.
- **Royal Laurel business class** - one of the top-rated business cabins globally.
- **Phone booking often needed for Star Alliance partner awards**.
- **Status Miles 12-month expiry**; Award Miles expire 36 months from earn (per-batch, rolling).
- **Family Plan pooling** available.
- **No US-issued co-brand**.
- **Joined Star Alliance 2013** (per Copilot - some older sources cite 1999 or other dates; verify on staralliance.com).
- **Zero hull losses, accidents, or fatalities since founding** - verify currency of claim.',
  award_chart = 'EVA Infinity MileageLands uses a published, fixed region-based award chart with separate charts for EVA-operated and Star Alliance partner awards. The partner chart is less competitive than Aeroplan or Turkish Miles & Smiles. Sample one-way pricing as of May 2026:

| Route | Cabin | Miles (EVA chart) |
|---|---|---|
| Within Asia EVA | Economy | 15,000 |
| Within Asia EVA | Business | 25,000 (round-trip ~50,000) |
| North America-Asia EVA | Economy | 37,500 |
| North America-Asia EVA | Business | 75,000-80,000 |
| North America-Asia EVA | First (where flown) | ~110,000 |
| Star Alliance partner US-Europe | Business | 87,500-100,000 |

Verify current pricing on evaair.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'eva-air';

-- ============================================================
-- 9. AIR NEW ZEALAND AIRPOINTS (Star Alliance, rebranding to Koru April 22, 2026)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air New Zealand Airpoints',
  alliance = 'star_alliance',
  hubs = ARRAY['AKL','CHC','WLG'],
  intro = 'Air New Zealand Airpoints is the loyalty program of New Zealand''s flag carrier (52% government-owned, CEO Nikhil Ravishankar since October 20, 2025). The program is rebranding from "Airpoints" to "Koru" effective April 22, 2026 - tier names are renaming, and a new top tier called Koru Black is launching at 3,200 Status Points (with at least 1,920 SP earned on Air NZ-operated or marketed flights). A new Koru Premier Lounge at AKL launches late 2026 for Platinum and Black members.

For US travelers, the practical reality is that there is no major US flexible-currency direct transfer. US Amex, Chase UR, Capital One, Citi, Bilt, and Wells Fargo are all non-partners. Marriott Bonvoy 200:1 is the only US-issued bridge - and it is one of the worst Marriott ratios in the program (200,000 Bonvoy = 1,000 Airpoints Dollars + 75-point bonus on 60K+ transfers). The Airpoints Dollars currency itself is a near-cashback model on Air NZ own metal (1 APD = NZ$1 cash value), so the value lives entirely in the Star Alliance partner award chart - distance-based, fixed APD per band, where premium-cabin partner redemptions consistently exceed 1 NZD per APD.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "200:1", "notes": "200,000 Bonvoy yields 1,000 Airpoints Dollars + 75-point bonus on 60K+ transfers - one of the worst Marriott ratios. Effectively the only US-issued bridge in.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner short-haul intra-Asia** at the lowest distance band - the highest-value APD use.
- **Second-band partner premium cabins** (BKK-HKG, SIN-SGN, TYO-PVG) - consistently exceed 1 NZD per APD.
- **Air NZ own-metal awards** are essentially cashback (1 APD = NZ$1 cash value) - no upside vs. paying cash.
- **Long-haul Star partners** for premium-cabin redemptions where APD pricing beats dollar-cost.
- **Status Points Top-Up** (Gold and above) lets members buy missing SP to retain status.',
  sweet_spots = '- **Star Alliance partner short-haul intra-Asia at lowest band** - the highest APD-to-value ratio.
- **Second-band partner premium-cabin redemptions** (BKK-HKG, SIN-SGN, TYO-PVG) consistently exceed 1 NZD per APD.
- **AKL-JFK on Air NZ** if you can find Star partner redemption windows - one of the world''s longest commercial routes.
- **Koru Black launching April 22, 2026** with Koru Circle benefit-sharing for family/friends - genuine differentiation at the top.
- **4-year APD expiry** is more generous than most distance-based-chart programs.',
  tier_benefits = '[
    {"name": "Bronze", "qualification": "Entry tier", "benefits": ["Earn Airpoints Dollars and Status Points", "Online check-in"]},
    {"name": "Koru Silver (was Airpoints Silver)", "qualification": "450 Status Points within membership year", "benefits": ["Status Points Top-Up access", "Priority check-in on Air NZ", "Bonus APD earning"]},
    {"name": "Koru Gold (was Airpoints Gold)", "qualification": "900 Status Points within membership year", "benefits": ["Star Alliance Gold", "Air NZ Koru Lounge access on Air NZ flights", "Premium check-in", "Priority boarding and baggage"]},
    {"name": "Koru Platinum (was Airpoints Elite)", "qualification": "1,500 Status Points within membership year", "benefits": ["Star Alliance Gold", "Enhanced rewards earning", "Priority for waitlists and operational upgrades"]},
    {"name": "Koru Black", "qualification": "3,200 Status Points within membership year (with at least 1,920 SP earned on Air NZ-operated or marketed flights) - NEW top tier effective April 22, 2026", "benefits": ["All Platinum benefits", "Koru Circle benefit-sharing for family and friends", "New Koru Premier Lounge access at AKL (launching late 2026)", "Highest priority across all services"]}
  ]'::jsonb,
  lounge_access = 'Air NZ operates Koru and International Lounges at AKL, WLG, CHC, plus AU outstations and US gateways including LAX and HNL. Gold and above get Koru Lounge access on Air NZ flights; Star Alliance Gold reciprocity applies worldwide. The new Koru Premier Lounge at AKL launches late 2026 for Koru Platinum and Koru Black. Day passes are available for purchase at Koru lounges.',
  quirks = '- **Rebranding from Airpoints to Koru effective April 22, 2026** - tier names are renaming and a new top tier (Koru Black) launches.
- **Government-owned (52% New Zealand government)**.
- **CEO Nikhil Ravishankar since October 20, 2025** (succeeded Greg Foran).
- **Currency: Airpoints Dollars (APD)** - 1 APD = NZ$1 cash value on Air NZ. Effectively cashback model on own metal.
- **Star Alliance partner award chart is distance-based, fixed APD per band** - this is where the value lives.
- **NO US flexible-currency direct transfers** (US Amex, Chase UR, Capital One, Citi, Bilt, Wells Fargo all non-partners).
- **Marriott Bonvoy 200:1** is the only US-issued bridge - one of the worst Marriott ratios.
- **AU/NZ Amex transfers exist at 200:1** - poor.
- **Co-brand cards from ANZ, Westpac, etc.** - no US-issued co-brand.
- **Earning is revenue-based** (1 APD per spend tier on Air NZ).
- **APD 4-year expiry from earn date**; Status Points reset annually.
- **Status Points Top-Up (Gold and above)** lets members buy missing SP to retain status.
- **Family/household: Airpoints for Family** account-linking, not pure pooling.
- **AKL-JFK launched 2023** - one of the world''s longest commercial routes.
- **777-300ER retiring; fleet centered on 787-9 and A321neo**.
- **New Koru Premier Lounge AKL launching late 2026** for Platinum and Black.
- **Premium-cabin partner redemptions consistently exceed 1 NZD per APD value**; own-metal redemptions only return 1 NZD per APD.',
  award_chart = 'Air NZ uses two award models. Air NZ-operated awards use APD 1:1 with cash price (no upside - effectively cashback). Star Alliance partner awards use a distance-based published chart in fixed APD per band - this is where the value is. Sample partner one-way pricing as of May 2026:

| Distance band | Cabin | APD |
|---|---|---|
| Band 1 (shortest intra-Asia) | Economy | ~150-200 |
| Band 1 | Business | ~400-500 |
| Band 2 (BKK-HKG, SIN-SGN) | Economy | ~250-300 |
| Band 2 | Business | ~600-750 |
| Band 4 (medium-haul intra-Asia/Pacific) | Business | ~1,000-1,250 |
| Band 6 (long-haul transpacific) | Business | ~2,500-3,000 |

Verify current APD per band on airnewzealand.com - the partner chart updates periodically.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-new-zealand';

-- ============================================================
-- 10. AEGEAN MILES+BONUS (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Aegean Miles+Bonus',
  alliance = 'star_alliance',
  hubs = ARRAY['ATH','SKG','LCA'],
  intro = 'Aegean Miles+Bonus is the loyalty program of Greek flag carrier Aegean Airlines, a Star Alliance member since 2010 with a roughly 70-aircraft Airbus narrowbody fleet (A320 family, A321neo XLR) and subsidiary Olympic Air. For US travelers Aegean has been a long-running cult favorite for two reasons: the famously easy "70K all-Star-Alliance-mileage path to Star Alliance Gold" and a 60-month (5-year) mile expiry that is one of the longest in the industry. Both are changing.

A tier overhaul effective November 5, 2026 raises Tier Mile thresholds modestly (Silver to 36K, Gold to 72K via the pure-mileage path) but doubles the Aegean-flight requirements - effectively requiring members to be Greece-based to retain top status. A new Platinum tier (72K Tier Miles AND 32 Aegean/Olympic flights) is launching for the deepest Aegean flyers. Until November 5, 2026 the current 70K all-Star-Alliance-mileage path to Gold remains - it is the last call. As of May 2026 Aegean is also notable for a clean-YQ profile on United, Air Canada, Singapore, and ANA partner awards (no fuel surcharges), with heavy YQ on Lufthansa Group, Turkish, and SWISS.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard - the only practical US-issued bridge in. 60,000 Bonvoy yields 25,000 Miles+Bonus miles + 5,000-mile bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner premium cabins on no-YQ partners** (United, Air Canada, Singapore Airlines, ANA) - the cleanest value.
- **US-Europe business on Star partners** at 55,000 miles one-way (Lufthansa, SWISS, United, Austrian) - watch the YQ on Lufthansa Group and SWISS.
- **Turkish Airlines US-Europe business at 45,000 miles one-way** - exceptional value, but heavy YQ pass-through.
- **Intra-Asia business at 30,000 miles + ~50 Euro surcharges**.
- **Europe-South Africa business at 55,000 miles** - long-running sweet spot.
- **Star Alliance Gold via the 70K all-Star-Alliance-mileage path** - the long-running cult-favorite hack (changing November 2026).',
  sweet_spots = '- **US-Europe business on no-YQ Star partners (United, Air Canada, ANA) at 55,000 miles one-way** - the cleanest value play in the program.
- **Turkish Airlines US-Europe business at 45,000 miles one-way** - exceptional mileage cost, but watch the YQ.
- **Intra-Asia business at 30,000 miles + ~50 Euro surcharges**.
- **Europe-South Africa business at 55,000 miles** one-way.
- **Star Alliance Gold via 70K all-Star-Alliance-mileage path** - the cult-favorite shortcut. Changing November 5, 2026.
- **60-month (5-year) mile expiry** - one of the longest in the industry.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier", "benefits": ["Earn Tier Miles and Award Miles", "Online check-in"]},
    {"name": "Silver", "qualification": "12,000 Tier Miles within 12 months + 2 Aegean/Olympic flights OR 35,000 Tier Miles total any Star Alliance carrier (rising to 36,000 Nov 5, 2026)", "benefits": ["Star Alliance Silver", "Priority check-in on Aegean", "Bonus mileage on Aegean flights"]},
    {"name": "Gold", "qualification": "24,000 Tier Miles + 4 Aegean/Olympic flights within 12 months OR 70,000 Tier Miles total any Star Alliance (rising to 72,000 Nov 5, 2026; Aegean-flight requirements DOUBLE on the dual-path)", "benefits": ["Star Alliance Gold", "Star Alliance Gold lounge access worldwide", "Priority boarding and baggage", "Free seat selection", "Higher bonus mileage on Aegean"]},
    {"name": "Platinum", "qualification": "72,000 Tier Miles AND 32 Aegean/Olympic flights - NEW top tier effective Nov 5, 2026 (effectively requires being based in Greece)", "benefits": ["Star Alliance Gold", "Top tier bonus mileage on Aegean flights", "Highest priority for waitlists and operational upgrades", "Dedicated Platinum service line"]}
  ]'::jsonb,
  lounge_access = 'Aegean operates the Aegean Business Lounge at ATH (Athens). Gold members get Aegean Business Lounge access on same-day Aegean flights and Star Alliance Gold lounge access worldwide via Star Alliance reciprocity. Silver members get priority check-in but not standard lounge access. The new Platinum tier (effective November 5, 2026) extends top-tier lounge recognition.',
  quirks = '- **Star Alliance member since 2010**.
- **Olympic Air subsidiary** acquired 2013.
- **60-month (5-year) mile expiry from earn date** - one of the longest in the industry.
- **70K all-Star-Alliance-mileage path to Gold** - the long-running cult-favorite shortcut. Changing November 5, 2026.
- **November 5, 2026 tier overhaul**: Tier Miles requirements rise modestly (Silver 36K, Gold 72K via pure-mileage path) but Aegean-flight requirements DOUBLE on the dual-path. New Platinum tier launches.
- **Two separate award charts**: Aegean/Olympic flights chart + Star Alliance partner flights chart (region-based, generous region definitions - Europe includes North Africa and Middle East).
- **YQ pass-through is partner-dependent** - heavy on Lufthansa Group (LH/LX/OS), Turkish, and SWISS (300-1,000 Euro in business). NO YQ on United, Air Canada, Singapore Airlines, ANA.
- **Almost all partner awards must be booked by phone**.
- **No US flexible-currency transfers** - Marriott Bonvoy 3:1 is the only US-issued bridge.
- **Accor Live Limitless 2:1 transfer** also exists.
- **No family pooling** - limited transfer between accounts only.
- **Generous region definitions** - Europe includes North Africa and Middle East.
- **Lounge: only Aegean Business Lounge ATH** is an Aegean-operated lounge; Star Alliance reciprocity carries Gold members worldwide.',
  award_chart = 'Aegean Miles+Bonus uses two separate region-based award charts: one for Aegean/Olympic flights and one for Star Alliance partner flights. Generous region definitions (Europe includes North Africa and Middle East) help on partner pricing. Sample partner one-way pricing as of May 2026:

| Route | Cabin | Miles |
|---|---|---|
| US-Europe Star partners (UA/AC/LH/LX/OS) | Business | 55,000 |
| US-Europe Turkish Airlines | Business | 45,000 |
| Intra-Asia Star partners | Business | 30,000 |
| Europe-South Africa Star partners | Business | 55,000 |
| Intra-Europe Aegean | Economy | 7,500-12,000 |

Verify current pricing on aegeanair.com. The chart has been stable for several years; the November 5, 2026 overhaul affects status qualification, not award pricing.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aegean';
