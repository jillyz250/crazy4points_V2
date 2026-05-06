-- Round 8 batch: 10 airline / discount-club program pages.
-- Each page draft was researched via WebSearch + cross-checked against
-- official program pages where available. Hedges and verify-before-publish
-- notes are inline.
--
-- Round 8 programs:
--   copa, fiji-airways, vueling, air-astana, cebu-pacific,
--   philippine-airlines, el-al, flydubai, vivaaerobus, pegasus

-- ============================================================
-- PREP: ensure skeleton rows exist for the 10 new slugs
-- ============================================================
insert into programs (slug, type, name) values
  ('copa', 'loyalty_program', 'Copa ConnectMiles'),
  ('fiji-airways', 'loyalty_program', 'Fiji Airways Tabua Club'),
  ('vueling', 'loyalty_program', 'Vueling Club'),
  ('air-astana', 'loyalty_program', 'Air Astana Nomad Club'),
  ('cebu-pacific', 'loyalty_program', 'Cebu Pacific Go Rewards'),
  ('philippine-airlines', 'loyalty_program', 'Philippine Airlines Mabuhay Miles'),
  ('el-al', 'loyalty_program', 'El Al Matmid'),
  ('flydubai', 'loyalty_program', 'flydubai'),
  ('vivaaerobus', 'loyalty_program', 'VivaAerobus VivaFan'),
  ('pegasus', 'loyalty_program', 'Pegasus BolBol')
on conflict (slug) do nothing;

-- ============================================================
-- 1. COPA CONNECTMILES (Star Alliance)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Copa ConnectMiles',
  alliance = 'star_alliance',
  hubs = ARRAY['PTY'],
  intro = 'Copa ConnectMiles is the loyalty program of Copa Airlines, the Panama-domiciled flag carrier (NYSE: CPA, parent Copa Holdings) and Star Alliance member since June 2012. The fleet runs roughly 100-110 aircraft - all-Boeing, predominantly 737-800 and 737 MAX - operating out of PTY (Tocumen, branded the "Hub of the Americas"). Pedro Heilbron is the longest-serving major airline CEO. Notably, Copa Dreams business class on most aircraft is a recliner, not a lie-flat seat - an important caveat for the 6+ hour South America runs.

For US travelers, ConnectMiles is interesting for one reason: it still publishes a fixed partner award chart in 2026, which is rare. The two-chart structure (Copa-operated dynamic + Star Alliance partners fixed) survived the January 2025 partner-chart devaluation that raised most regional buckets 25-50%. The catch is funding the account: no major US flexible currency transfers directly. Marriott Bonvoy is the only mainstream US bridge, at 3:1 with the standard 5,000-point bonus per 60,000 transferred. The headline sweet spot for US flyers is round-trip US-Panama economy at 30,000 miles on Copa metal - solid against last-minute paid fares above $500. Lufthansa, TAP, and other Star partners price US-Europe at roughly 70,000 economy / 130,000 business one-way. Co-brand is Banco General Visa in Panama only - no US-issued co-brand.',
  transfer_partners = '[
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 ConnectMiles + 5,000-mile bonus at the 60K tier. The only major US currency path.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **US-Panama economy round-trip 30,000 miles** on Copa metal - the headline sweet spot.
- **US-South America business one-way 50,000 miles** on Copa metal (verify post-Jan-2025 chart).
- **Star Alliance partner economy intra-South America from 12,500-20,000 miles** (verify).
- **Lufthansa / TAP partner US-Europe at 70,000 economy / 130,000 business one-way** on the partner chart.
- **Marriott Bonvoy 3:1 transfer with 5K bonus per 60K** - the only practical US funding path.',
  sweet_spots = '- **US-Panama economy round-trip 30,000 miles** on Copa metal - sharp value against $500+ paid fares.
- **US-South America business one-way 50,000 miles** on Copa metal post-2025 chart (verify).
- **Panama-Caribbean economy 20,000 miles** - up from 10K pre-Jan-2025.
- **Lufthansa / TAP US-Europe partner awards 70,000 economy / 130,000 business one-way** on the partner chart.
- **Intra-South America Star partners 12,500-20,000 miles economy** (verify per route).
- **Published fixed partner chart** in 2026 is rare - useful for partner award math.
- **Recliner business on Copa Dreams** is the trade-off; not a lie-flat product on most aircraft.',
  tier_benefits = '[
    {"name": "Silver", "qualification": "Entry-tier elite", "benefits": ["25% mileage bonus", "Priority check-in", "Extra baggage allowance"]},
    {"name": "Gold", "qualification": "Star Alliance Gold tier", "benefits": ["Star Alliance Gold", "50% mileage bonus", "Lounge access globally on same-day Star international", "Priority boarding and baggage"]},
    {"name": "Platinum", "qualification": "Higher elite tier", "benefits": ["Star Alliance Gold", "75% mileage bonus", "Upgrade priority", "Top priority on waitlists"]},
    {"name": "Presidential Platinum", "qualification": "Top tier", "benefits": ["Star Alliance Gold", "100% mileage bonus", "Confirmed seat on sold-out Copa flights (subject to fare-class rules)", "Highest priority across the network"]}
  ]'::jsonb,
  lounge_access = 'Copa operates the Copa Club at PTY. Gold and above get Copa Club access plus Star Alliance Gold reciprocal lounges globally on same-day Star international flights. Silver does not get standard lounge access. There is no published public day-pass program.',
  quirks = '- **Star Alliance member since June 2012**.
- **Two-chart structure** - Copa-operated metal moved to dynamic; Star Alliance partner awards remain on a published fixed chart.
- **January 2025 partner-chart devaluation** raised most regional buckets 25-50%.
- **Copa Dreams business class is a recliner on most aircraft, not a lie-flat seat** - important caveat for premium-cabin redemptions.
- **No major US flexible currency transfers directly** - not Amex, Chase, Capital One, Citi, Bilt, or Wells Fargo.
- **Marriott Bonvoy 3:1 with 5K bonus per 60K** is the only mainstream US bridge.
- **Co-brand is Banco General Visa in Panama only** - no US-issued co-brand card.
- **Miles expire 18 months from last activity** - any earn or redeem resets the clock.
- **No fuel surcharges on Copa-operated awards** - verify partner YQ (Lufthansa awards historically pass YQ).
- **Booking partner awards often requires a phone agent** for many routes; web search is limited.
- **No mile pooling and no family accounts**.
- **Distance-based earning on Copa metal** with fare-class multipliers; partner earning per the partner chart.
- **Pedro Heilbron is the longest-serving major airline CEO**.',
  award_chart = 'ConnectMiles uses two charts: Copa-operated metal moved to dynamic pricing, and Star Alliance partners remain on a published fixed chart. Sample saver pricing as of May 2026 (post-Jan-2025 partner-chart devaluation):

| Route | Cabin | Miles |
|---|---|---|
| US-Panama round-trip on Copa | Economy | 30,000 |
| US-South America one-way on Copa | Business | 50,000 |
| Panama-Caribbean one-way on Copa | Economy | 20,000 |
| Intra-South America Star partner | Economy | 12,500-20,000 |
| US-Europe via Lufthansa / TAP partner | Economy one-way | 70,000 |
| US-Europe via Lufthansa / TAP partner | Business one-way | 130,000 |

Verify current pricing on copaair.com - some partner buckets shifted in January 2025.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'copa';

-- ============================================================
-- 2. FIJI AIRWAYS TABUA CLUB (oneworld since Apr 1 2025; uses AAdvantage)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Fiji Airways Tabua Club',
  alliance = 'oneworld',
  hubs = ARRAY['NAN','SUV'],
  intro = 'Fiji Airways Tabua Club is the membership program of Fiji Airways, the Government of Fiji and Qantas-minority-owned 4-Star Skytrax flag carrier and oneworld member since April 1, 2025 - the alliance''s 15th member. The fleet runs roughly 17-23 aircraft (A350-900, A330-200, 737 MAX 8, 737-800, plus ATR 72 on Fiji Link) operating out of NAN (Nadi) and SUV (Suva).

The critical reader fact: Tabua Club is a paid subscription program, not a points currency. When Fiji Airways joined oneworld on April 1, 2025, it adopted AAdvantage as its frequent-flyer engine. US flyers earn and redeem on Fiji Airways via AAdvantage, Atmos Rewards (Alaska/Hawaiian), or Qantas Frequent Flyer - not via Tabua Club. Tabua Club delivers status, lounge benefits, and baggage perks; it does not accumulate redeemable miles. The closest mental model is Wizz Discount Club. Headline US-flyer routes: LAX-NAN economy via AAdvantage runs roughly 40,000 miles one-way off-peak; LAX-NAN business via AAdvantage roughly 80,000 miles one-way; LAX-NAN business via Qantas roughly 108,000 points with low taxes. Bilt, Marriott, Citi, Capital One, and Amex MR all transfer to those underlying currencies (with the usual ratios), so the practical funding paths are wide.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Tabua Club is a paid subscription, not a points currency** - there is nothing to transfer to or redeem from Tabua directly.
- **For points: book Fiji Airways via AAdvantage, Atmos Rewards, or Qantas Frequent Flyer**.
- **Bilt 1:1 to AAdvantage or Atmos** as the cleanest US flexible-currency path.
- **Marriott Bonvoy 3:1 to AAdvantage / Atmos / Qantas** with 5K bonus per 60K.
- **Amex MR 1:1 to Qantas** as a long-haul Pacific play (foreign carrier, no US federal excise tax).
- **Citi and Capital One both transfer to Qantas at 1:1** for the LAX-NAN business sweet spot.',
  sweet_spots = '- **LAX-NAN economy via AAdvantage roughly 40,000 miles one-way off-peak** (verify on aa.com).
- **LAX-NAN business via AAdvantage roughly 80,000 miles one-way** (verify).
- **LAX-NAN business via Qantas roughly 108,000 points + low taxes** - the strongest US-Pacific premium-cabin redemption.
- **NAN-SYD business via Qantas or Atmos roughly 25,000-40,000 points** for a 4-hour premium hop (verify; Atmos rates may have shifted under the dynamic transition).
- **No fuel surcharges on AAdvantage Fiji Airways awards**.
- **oneworld Sapphire / Emerald benefits now apply** for AAdvantage / Atmos / Qantas elites flying Fiji.',
  tier_benefits = '[
    {"name": "Tabua Club", "qualification": "Approximately FJD $799 per year individual paid subscription", "benefits": ["Lounge access at NAN Premier Lounge", "Priority check-in and boarding", "Extra baggage allowance", "Status recognition on Fiji Airways"]},
    {"name": "Tabua Club Plus", "qualification": "Earned via 20 status credits in a membership year, then approximately FJD $599 renewal", "benefits": ["38kg economy / 55kg business baggage", "All Tabua Club benefits", "Higher recognition on Fiji Airways and oneworld partners"]}
  ]'::jsonb,
  lounge_access = 'Fiji Airways operates the Tabua Lounge (Premier Lounge) at NAN. Tabua Club paid members get lounge access; oneworld Sapphire and Emerald tier benefits now apply for AAdvantage / Atmos / Qantas elites who fly Fiji Airways. Day-pass access at NAN Premier Lounge is available - verify pricing on fijiairways.com.',
  quirks = '- **Tabua Club is fundamentally a paid subscription, not an FFP** - the closest mental model is Wizz Discount Club.
- **Joined oneworld April 1, 2025** as the alliance''s 15th member.
- **Adopted AAdvantage as its FFP engine on April 1, 2025** - US flyers earn and redeem on Fiji Airways via AAdvantage, Atmos Rewards, or Qantas.
- **Tabua registrations were paused February-April 2025** during the alliance transition.
- **No fuel surcharges on AAdvantage awards on Fiji Airways**.
- **AAdvantage adoption April 2025 means Bilt -> AA, Marriott -> AA, etc. now indirectly fund Fiji redemptions**.
- **No direct US flexible-currency to Tabua Club** - because there is no points currency to transfer to.
- **Tabua status does not earn redeemable miles** - earning happens in AAdvantage / Atmos / Qantas accounts.
- **oneworld Sapphire and Emerald reciprocity now applies** when AAdvantage / Atmos / Qantas elites fly Fiji Airways.
- **Government of Fiji + Qantas (minority) ownership** - strategic alignment with Qantas predates the oneworld move.
- **No US-issued co-brand card**.',
  award_chart = 'Tabua Club has no award chart - it is a paid subscription, not a points currency. Fiji Airways award space is priced via:

- **AAdvantage** - dynamic award chart on Fiji Airways metal as of 2026.
- **Atmos Rewards** - partner chart for Fiji Airways (verify post-Atmos-dynamic-transition rates).
- **Qantas Frequent Flyer** - Classic Reward chart on Fiji Airways metal.

Sample US-Pacific saver pricing on Fiji Airways metal as of May 2026:

| Route | Currency | Cabin | Cost |
|---|---|---|---|
| LAX-NAN one-way | AAdvantage | Economy | ~40,000 miles |
| LAX-NAN one-way | AAdvantage | Business | ~80,000 miles |
| LAX-NAN one-way | Qantas | Business | ~108,000 points + low taxes |
| NAN-SYD one-way | Qantas / Atmos | Business | ~25,000-40,000 points |

Verify current pricing on aa.com, alaskaair.com, and qantas.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'fiji-airways';

-- ============================================================
-- 3. VUELING CLUB (Avios family; non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Vueling Club',
  alliance = 'none',
  hubs = ARRAY['BCN','FCO','ORY','AMS'],
  intro = 'Vueling Club is the loyalty program of Vueling, the IAG-owned Spanish low-cost carrier (sister to BA, Iberia, Aer Lingus, and LEVEL) and the largest LCC in southern Europe with roughly 35 million annual passengers. The fleet runs roughly 125 A320-family aircraft out of BCN (primary), FCO (secondary since 2015), and focus cities ORY and AMS. The program launched in 2020 with Avios as its currency.

For US travelers Vueling Club has a structural problem: no major US flexible currency transfers directly. Capital One, Citi, Bilt, and Wells Fargo transfer to BA Avios (or Iberia / Aer Lingus / Finnair); none transfer directly to Vueling. To get Avios into Vueling, route through any sister Avios program first, then use Combine My Avios as the second hop into a Vueling Club account. Marriott Bonvoy is similar - 3:1 to BA Avios or Iberia (with the 5K bonus per 60K), then Combine My Avios into Vueling. The biggest 2026 change is unusual for an LCC: zero Avios accrual until you hit 200 EUR spend OR 3 flights flown per year, then a 500-Avios catch-up bonus. Vueling Premium tier doubles the earn rate. Most US readers should think of Vueling as either a short-hop redemption opportunity (4,500 Avios + 20 EUR co-pay one-way intra-Europe) or a routing hub for sister-currency Avios.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1 to BA Avios or Iberia, then Combine My Avios into Vueling as a second hop. No US federal excise tax on the foreign-carrier leg.", "bonus_active": false},
    {"from_slug": "chase-ur", "ratio": "1:1", "notes": "1:1 to BA Avios or Iberia, then Combine My Avios into Vueling as a second hop. No direct Chase -> Vueling transfer.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "1:1 to BA Avios as a second hop, then Combine My Avios into Vueling. Capital One does not transfer directly to Vueling.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "1:1 to BA Avios as a second hop, then Combine My Avios into Vueling. Citi does not transfer directly to Vueling.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1 to BA Avios on Rent Day only, then Combine My Avios into Vueling.", "bonus_active": false},
    {"from_slug": "wells-fargo-rewards", "ratio": "1:1", "notes": "1:1 to BA Avios as a second hop, then Combine My Avios into Vueling.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 to BA Avios or Iberia with 5K bonus per 60K, then Combine My Avios into Vueling as a second hop. No direct Marriott -> Vueling transfer.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Vueling intra-Europe one-way at 4,500 Avios + roughly 20 EUR co-pay** - solid against last-minute paid fares above 100 EUR.
- **Combine My Avios** to pool sister-currency balances (BA, Iberia, Aer Lingus, Finnair, Qatar, Loganair) before redeeming on Vueling metal.
- **Routing Avios elsewhere via Combine My Avios** is often the highest-value play - Iberia for US-MAD, AA short-haul, Qatar Qsuite.
- **Premium tier doubles the earn rate** if you fly Vueling regularly.
- **Skip if you spend under 200 EUR per year on Vueling** - the 2026 earning gate kills accrual for casual flyers.',
  sweet_spots = '- **BCN-FCO / BCN-AMS one-way roughly 6,500 Avios** (verify peak/off-peak).
- **Short-haul Vueling redemption at 4,500-9,000 Avios + cash co-pay** one-way.
- **Combine My Avios redirect to Iberia for US-MAD business** at 40,500 Avios off-peak (the YQ-light play).
- **Combine My Avios redirect to Qatar Qsuite** for the highest-value premium-cabin Avios use.
- **Combine My Avios redirect to AA short-haul** for cheap US economy off-peak.
- **Avios stay alive for 36 months** as long as any sister Avios account has activity.',
  tier_benefits = '[
    {"name": "Smart", "qualification": "Entry tier (free); 2025 fliers grandfathered to Smart for 2026", "benefits": ["Earn Avios on Vueling", "Member-only fares"]},
    {"name": "Plus", "qualification": "Approximately Eur 1,000 spent per year on Vueling", "benefits": ["Free seat selection", "Priority boarding", "Higher Avios earn"]},
    {"name": "Premium", "qualification": "Approximately Eur 4,000 spent per year on Vueling", "benefits": ["Free overhead bag", "Fast track at security", "Seat upgrades when available", "2x Avios earn rate"]}
  ]'::jsonb,
  lounge_access = 'Vueling does not operate its own lounge program. Premium fare class delivers priority but not lounge access. oneworld status earned via BA or Iberia delivers lounge access at BCN regardless of Vueling Club tier - verify same-day oneworld international rules.',
  quirks = '- **Launched Vueling Club with Avios in 2020** - sister to BA, Iberia, Aer Lingus, Finnair, Qatar, Loganair via Combine My Avios.
- **January 2026 earning gate (very unusual for an LCC)**: zero Avios until you hit Eur 200 spend OR 3 flights flown per year, then a 500-Avios catch-up bonus.
- **Premium tier doubles the earn rate**.
- **No US flexible currency transfers directly to Vueling** - all routing via BA, Iberia, Aer Lingus, or Finnair, then Combine My Avios as a second hop.
- **No cross-status with Iberia** - Vueling Premium does not equal Iberia Plus elite.
- **Avios stay alive 36 months as long as any sister Avios account has activity**.
- **Combine My Avios bridges to BA, Iberia, Aer Lingus, Finnair, Qatar, Loganair** - free and near-instant.
- **Combine My Avios 90-day account-age rule (new 2026)** - newly created accounts must wait 90 days before transferring out.
- **No fuel-surcharge advantage on Vueling itself** - LCC, fees are minimal.
- **No own lounge program** - oneworld status from BA or Iberia delivers BCN lounge access.
- **Iberia Visa (BBVA US, formerly Bank of America) is the closest US-issued Avios co-brand**, not a Vueling-specific card.
- **Largest LCC in southern Europe** - roughly 35M passengers per year.',
  award_chart = 'Vueling redemptions on Vueling metal use the BA / Iberia distance-based Avios chart. Sample one-way pricing on Vueling metal as of May 2026:

| Route | Cabin | Avios + Cash |
|---|---|---|
| Short Vueling intra-Europe | Economy | 4,500 + ~20 EUR |
| BCN-FCO / BCN-AMS | Economy | ~6,500 + cash |
| Longer intra-Europe Vueling | Economy | 6,500-9,000 + cash |

Combine My Avios lets you redeem from any sister account on Vueling metal, or move Vueling Avios out to Iberia / BA / Qatar / Aer Lingus / Finnair / Loganair. Verify current pricing on vueling.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'vueling';

-- ============================================================
-- 4. AIR ASTANA NOMAD CLUB (NOT Star Alliance - bilateral codeshares only)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Air Astana Nomad Club',
  alliance = 'none',
  hubs = ARRAY['ALA','NQZ'],
  intro = 'Air Astana Nomad Club is the loyalty program of Air Astana, the Kazakhstan flag carrier (Samruk-Kazyna sovereign wealth fund + BAE Systems historically; IPO 2024 on London and Astana exchanges) and 11-time Skytrax Best Airline in Central Asia. The fleet runs roughly 40-50+ aircraft - A321neo, A321LR (key for the Europe routes), 767-300ER, E190-E2 - operating out of ALA (Almaty) and NQZ (Astana/Nur-Sultan). FlyArystan is the LCC subsidiary.

The critical reader fact: Air Astana is NOT a Star Alliance member or Connecting Partner as of May 2026. The active Star Alliance Connecting Partner roster is Juneyao Airlines (China) and Thai Smile (Thailand) only. Air Astana has bilateral codeshares with multiple Star carriers (Lufthansa, Turkish, Asiana, Korean Air, Air China, Etihad, S7, Uzbekistan Airways, SCAT) but no formal alliance status. Recognition by other Star carriers is patchwork via bilaterals.

For US travelers, the practical play is rarely to accrue Nomad Club directly - none of Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo, or Marriott transfer in. The better move is to book Air Astana via Aeroplan or Avianca LifeMiles using the bilateral with Lufthansa or other Star partners. LifeMiles US-Almaty business via Frankfurt prices around 78,000 miles - sharper than direct Nomad accrual when funding from US currencies.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Book Air Astana metal via Aeroplan or Avianca LifeMiles** using bilateral connections - the practical US play.
- **LifeMiles US-Almaty business via Frankfurt around 78,000 miles** - the cleanest US funding path.
- **Status match program** ($49 base / $199 Gold buy-up, valid through Dec 31 2026, EU/MEA/Asia residents only) for travelers who plan to fly Air Astana.
- **Almaty-Bangkok / Almaty-Seoul economy modestly priced** at roughly 25,000-30,000 Nomad points (verify) for accrued balances.
- **Almaty-LHR business roughly 80,000-100,000 Nomad points** (verify) - hard to fund without flying.',
  sweet_spots = '- **LifeMiles US-Almaty business via Frankfurt around 78,000 miles** - sharper than direct Nomad accrual.
- **Aeroplan for Air Astana metal via partner Star carriers** - useful when Star partner availability opens.
- **Almaty-Asia regional economy roughly 25,000-30,000 Nomad points** (verify) for accrued balances.
- **Status match program valid through Dec 31 2026** for EU/MEA/Asia residents.
- **No-alliance recognition is patchwork** - lounge and elite reciprocity work bilateral-by-bilateral.',
  tier_benefits = '[
    {"name": "Blue", "qualification": "Entry tier (free)", "benefits": ["Earn Nomad Club points", "Member rates"]},
    {"name": "Silver", "qualification": "Mid-tier elite", "benefits": ["Priority check-in", "Extra baggage", "Bonus earn on Air Astana"]},
    {"name": "Gold", "qualification": "Higher elite", "benefits": ["Shanyrak Lounge access at ALA / NQZ", "Priority boarding", "Higher mile bonus", "Bilateral Star recognition - varies by partner"]},
    {"name": "Diamond", "qualification": "Top tier", "benefits": ["All Gold benefits", "Top priority on waitlists and operational upgrades", "Enhanced bilateral recognition where available"]}
  ]'::jsonb,
  lounge_access = 'Air Astana operates Shanyrak Lounges at ALA and NQZ. Gold and Diamond Nomad Club members get Shanyrak access. Recognition by other Star Alliance carriers is bilateral-by-bilateral (verify scope per partner) - Nomad Club is not a Star Alliance program. Day-pass access at Shanyrak is available; verify pricing.',
  quirks = '- **NOT a Star Alliance member or Connecting Partner as of May 2026** - the active Connecting Partner roster is Juneyao Airlines and Thai Smile only.
- **Bilateral codeshares with Lufthansa, Turkish, Asiana, Korean Air, Air China, Etihad, S7, Uzbekistan Airways, SCAT** - alliance recognition is patchwork.
- **No major US flexible-currency direct partner** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **Practical US play: book Air Astana via Aeroplan or Avianca LifeMiles** using Star bilateral routing.
- **Status match program** $49 base / $199 Gold buy-up, valid through Dec 31 2026, EU/MEA/Asia residents only.
- **Miles expire 36 months from earning** (verify post-2024 program overhaul).
- **No mile pooling or family accounts**.
- **Award booking via call center for many partners** - online flow is limited.
- **Recognition narrower than full alliance members** - some bilateral partners may not honor Nomad Club status fully.
- **IPO 2024 on London and Astana exchanges** - financial transparency improving.
- **FlyArystan LCC subsidiary** - separate fare structure.
- **No US co-brand card**.',
  award_chart = 'Nomad Club uses a published distance/region-based chart on Air Astana metal. Without full alliance reciprocity, partner redemptions are limited to the bilateral list. Sample one-way saver pricing on Air Astana metal as of May 2026 (verify):

| Route | Cabin | Nomad Points |
|---|---|---|
| Almaty-Bangkok / Seoul | Economy | ~25,000-30,000 |
| Almaty-LHR | Business | ~80,000-100,000 |

For US flyers, booking Air Astana via Aeroplan or Avianca LifeMiles partner award typically beats direct Nomad accrual. Verify on airastana.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-astana';

-- ============================================================
-- 5. CEBU PACIFIC GO REWARDS (non-aligned LCC; coalition program)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Cebu Pacific Go Rewards',
  alliance = 'none',
  hubs = ARRAY['MNL','CEB','CRK','DVO'],
  intro = 'Cebu Pacific Go Rewards is the loyalty program of Cebu Pacific, the largest LCC in the Philippines (parent JG Summit Holdings, Gokongwei family). The fleet runs roughly 80 aircraft - A320, A321neo, A330-900neo (long-haul SYD/MEL/DXB/ICN), plus ATR 72 on Cebgo for island-hopping - operating out of MNL, CEB, CRK, and DVO. The program was renamed from GetGo to Go Rewards in 2021; pre-2020 GetGo balances converted to "Cebu Pacific Travel Fund." Go Rewards continues as a coalition program with Robinsons Retail, restaurants, and bank partners.

For US travelers, Go Rewards is essentially inaccessible without flying Cebu Pacific. No major US flexible currency transfers in - not Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo, or Marriott. The program is built around Robinsons Bank co-brand cards in the Philippines. Redemption is dynamic against cash fares, and Cebu Pacific paid fares are often under $50 on flash sales (PHP 99 base fares are real), so the points-vs-cash math rarely favors points. The most useful play for a US flyer who happens to fly Cebu Pacific is redeeming for ancillaries (bags, seat selection, meals) rather than for fare - the conversion is generally sharper. No lounges, no upgrades, no alliance benefit.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Pay cash for Cebu Pacific** - the practical US-flyer recommendation. No US currency conversion path makes Go Rewards inaccessible.
- **Redeem points for ancillaries (bags, seats, meals)** - typically a sharper conversion than redeeming for fare.
- **Manila-Cebu / Manila-Davao economy redemptions track paid fares 1:1** at low absolute cost - paid fares are often under $50.
- **Coalition earning at Robinsons Retail and restaurants** is Philippines-only.
- **Robinsons Bank co-brand cards** require Philippines residency.',
  sweet_spots = '- **Ancillary redemption (points-for-bags, seat selection, meals)** outperforms points-for-fare on Cebu Pacific.
- **Manila-Cebu / Manila-Davao domestic redemptions** make sense for in-country positioning.
- **PHP 99 flash sales** typically beat any points redemption math - cash usually wins on Cebu Pacific.
- **No alliance, no lounge, no upgrade benefits** - LCC model.',
  tier_benefits = '[
    {"name": "Go Rewards member", "qualification": "Entry tier (free)", "benefits": ["Earn Go Rewards points on Cebu Pacific flights and ancillaries", "Coalition earn at Robinsons Retail and restaurants"]}
  ]'::jsonb,
  lounge_access = 'Cebu Pacific does not operate a lounge program - LCC.',
  quirks = '- **Renamed from GetGo to Go Rewards in 2021** - pre-2020 GetGo balances converted to "Cebu Pacific Travel Fund."
- **Coalition program** - points earn at Robinsons Retail, restaurants, and bank partners, not just on flights.
- **Tiered structure** - tiers affect earn rate on Cebu Pacific flights (verify exact tier names; historically Lite, Voyager, Trailblazer or similar).
- **No US flexible-currency direct partner** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **No US-issued co-brand card** - Robinsons Bank cards require Philippines residency.
- **Dynamic redemption against cash fares** - no fixed chart, no partner award redemption.
- **Minimum 50 points to redeem**.
- **LCC model means no lounges, no upgrades, no alliance benefit**.
- **Points expire 24 months from inactivity** (verify).
- **Practically inaccessible to US flyers without flying Cebu Pacific metal**.
- **PHP 99 base-fare flash sales are real** - cash usually beats points redemption.
- **Largest LCC in the Philippines** - roughly 80 aircraft and dominant market share.
- **Cebgo subsidiary on ATR 72** for island-hopping routes.',
  award_chart = 'Go Rewards has no fixed award chart. Points redeem dynamically against Cebu Pacific cash fares (and ancillaries: bags, seat selection, meals). Minimum 50 points to redeem. No partner award redemption.

Sample US-flyer takeaway: Manila-Cebu and Manila-Davao paid fares are often under $50, so redemption math rarely favors points. Ancillary redemption (points-for-bags) generally outperforms fare redemption.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'cebu-pacific';

-- ============================================================
-- 6. PHILIPPINE AIRLINES MABUHAY MILES (non-aligned)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Philippine Airlines Mabuhay Miles',
  alliance = 'none',
  hubs = ARRAY['MNL','CEB'],
  intro = 'Philippine Airlines Mabuhay Miles is the loyalty program of Philippine Airlines (PAL Holdings; emerged from Chapter 11 late 2021), Asia''s oldest airline still operating under its original name (founded 1941). The fleet runs roughly 70-80 aircraft - A350-900 (JFK/LAX/SFO/LHR/SYD), A330-300, A321neo, A320neo, B777-300ER (verify exact mix) - operating out of MNL and CEB. Stanley Ng is CEO.

A common myth correction: PAL is not a Star Alliance or oneworld member and historically has not held formal membership in either. The carrier was reportedly close to Star Alliance pre-2013 but did not join. The headline 2025 development for US flyers is the Alaska Airlines / Atmos Rewards partnership announced May 2025 - PAL became Alaska''s 32nd global partner. Mabuhay Miles members earn miles on eligible Alaska flights, and Mileage Plan / Atmos members earn miles on eligible PAL routes. This is the program''s biggest US-flyer development in years.

No major US flexible currency transfers directly into Mabuhay Miles - not Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo, or Marriott. The Alaska/Atmos partnership opens the practical US-flyer earning and redemption path through Atmos Rewards instead. The Mabuhay zone-based award chart survives in 2026 (rare), with US (LAX/SFO/JFK)-Manila economy round-trip around 80,000 miles and business round-trip around 150,000-180,000 miles (verify post-2024 chart).',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **US-Manila economy round-trip around 80,000 Mabuhay Miles** on PAL metal (verify post-2024 chart).
- **US-MNL business round-trip around 150,000-180,000 Mabuhay Miles** on PAL metal (verify).
- **Manila-Tokyo / Seoul / HKG business 60,000-75,000 round-trip** - solid intra-Asia premium value.
- **Atmos Rewards is the practical US funding path post-May-2025 partnership** - earn and redeem on PAL via Atmos.
- **Hawaiian Mileage Plan members earn and redeem on PAL** via the Atmos integration.
- **Partner awards on Cathay Pacific, Gulf Air, China Airlines, Royal Brunei, Hawaiian, WestJet, Malaysia, ANA, Xiamen, Turkish, Bangkok Airways, Etihad** at the Mabuhay partner chart.',
  sweet_spots = '- **US-MNL economy round-trip around 80,000 Mabuhay Miles** (verify).
- **US-MNL business round-trip around 150,000-180,000 Mabuhay Miles** (verify).
- **Intra-Asia premium 60,000-75,000 Mabuhay Miles round-trip** for Manila-Tokyo / Seoul / HKG business.
- **Atmos Rewards / Alaska Mileage Plan earn and redeem on PAL** post-May-2025 partnership - the headline 2025 US-flyer development.
- **PAL via partners (Hawaiian inter-island, Turkish to Europe via IST)** chart-priced; often cheaper than direct redemption.
- **Zone-based published chart** (rare in 2026) for both PAL and partner awards.',
  tier_benefits = '[
    {"name": "Mabuhay Miles base", "qualification": "Entry tier (free)", "benefits": ["Earn Mabuhay Miles", "Member rates"]},
    {"name": "Elite", "qualification": "25,000 tier miles, 30 one-way segments, or 15 business-class one-way segments per year", "benefits": ["Priority check-in", "Extra baggage", "Bonus earn", "Lounge access on PAL metal"]},
    {"name": "Premier Elite", "qualification": "125,000 tier miles or 100 EQS per year", "benefits": ["All Elite benefits", "Broader partner-airline lounge reciprocity (verify per partner)", "Priority on waitlists", "Higher mile bonus"]},
    {"name": "Million Miler", "qualification": "Lifetime 1,000,000+ cumulative tier miles", "benefits": ["Lifetime tier recognition", "All Premier Elite benefits"]}
  ]'::jsonb,
  lounge_access = 'PAL operates Mabuhay Lounges at MNL and CEB, plus partner-airline lounges via reciprocal agreements. Premier Elite gets broader access (verify which oneworld and Star lounges accept Premier Elite). Day-pass access at MNL is available; verify pricing on philippineairlines.com.',
  quirks = '- **PAL is not a Star Alliance or oneworld member** - common myth correction. PAL was reportedly close to Star pre-2013 but did not join.
- **Alaska / Atmos Rewards partnership announced May 2025** - PAL is Alaska''s 32nd global partner. The headline 2025 US-flyer development.
- **Mabuhay Miles members earn miles on eligible Alaska flights**, and Atmos members earn miles on eligible PAL routes.
- **Hawaiian flyers earn and redeem on PAL via Mileage Plan number** through the Atmos integration.
- **No major US flexible-currency direct transfer partner** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **Zone-based published award chart survives in 2026** - PAL and partner awards both chart-priced.
- **No alliance means no broad lounge reciprocity** - bilateral patchwork only.
- **Fuel surcharges on partner awards vary** - Cathay and JAL historically pass YQ; verify per route.
- **Miles expire 36 months from earning** (verify current rule post-2023 program changes).
- **Family pooling for nominated household members** is available (verify rules).
- **Stopover rules typically allowed on round-trip awards in MNL** (verify).
- **No US-issued co-brand card** - BDO-Mabuhay Miles is a local PHP card.
- **Partner roster: Cathay Pacific, Gulf Air, China Airlines, Royal Brunei, Hawaiian, WestJet, Malaysia, ANA, Xiamen, Turkish, Bangkok Airways, Etihad**.
- **Asia''s oldest airline still operating under its original name** - founded 1941.',
  award_chart = 'Mabuhay Miles uses a zone-based published award chart. Sample saver round-trip pricing on PAL metal as of May 2026 (verify post-2024 chart):

| Route | Cabin | Mabuhay Miles |
|---|---|---|
| US (LAX/SFO/JFK)-MNL round-trip | Economy | ~80,000 |
| US-MNL round-trip | Business | ~150,000-180,000 |
| Manila-Tokyo / Seoul / HKG round-trip | Business | ~60,000-75,000 |

Partner awards (Cathay, Hawaiian, ANA, Turkish, etc.) are also chart-priced. Verify on philippineairlines.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'philippine-airlines';

-- ============================================================
-- 7. EL AL MATMID (non-aligned; Delta partnership Jan 2024)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'El Al Matmid',
  alliance = 'none',
  hubs = ARRAY['TLV'],
  intro = 'El Al Matmid is the loyalty program of El Al Israel Airlines (privatized; controlled by the Kanfei Nesharim / E. Rozenberg group since 2020). The fleet runs roughly 45 aircraft - 777-200ER, 787-9, 737-800/900 (verify exact mix) - operating out of TLV (Tel Aviv-Ben Gurion), with Sun d''Or as the charter subsidiary.

Two structural shifts shape the 2026 US-flyer picture. First, the Delta SkyMiles strategic partnership launched January 1 2024, with codeshare and frequent-flyer benefits live January 15 2024. Effects: the El Al / American Airlines partnership ended March 30 2024, and the El Al / Alaska partnership ended June 30 2024. Delta is now El Al''s primary US airline partner. Second, the April 1, 2025 Matmid overhaul raised thresholds 30%, moved to a 9-month status refresh cycle, removed soft landings, added FLY+ Choice Benefits, and expanded the lifetime status program. Matmid runs a two-currency model: Diamonds for status, Matmid Points for redemption.

For US travelers the Amex MR -> Matmid pipe ended January 1 2021 - there is no current direct US flexible-currency transfer into Matmid Points. The practical 2026 US play is Amex MR -> Delta SkyMiles -> El Al via SkyMiles partner-award booking. Delta uses dynamic SkyMiles pricing for El Al partner awards, but the path exists.',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "1:1", "notes": "1:1 to Delta SkyMiles, then book El Al via SkyMiles partner-award. The Amex MR -> Matmid direct pipe ended January 1 2021. No US federal excise tax on the Delta leg (Delta is a US carrier, but excise applies to US carrier transfers - verify; the El Al portion is foreign-carrier).", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **Amex MR -> Delta SkyMiles -> El Al partner award booking** - the practical US path post-2021.
- **TLV-Europe economy 30,000-50,000 Matmid Points round-trip**.
- **TLV-Europe business 120,000 Matmid Points round-trip**.
- **TLV-US (JFK/EWR/LAX/MIA) economy 70,000 Matmid Points round-trip**.
- **TLV-US business 180,000-220,000 Matmid Points round-trip** (verify post-2025 chart).
- **El Al Mastercard** (verify current US issuer) earns 2x Matmid on El Al, 1x elsewhere.',
  sweet_spots = '- **TLV-Europe economy 30,000-50,000 Matmid Points round-trip** - solid mid-haul value.
- **TLV-Europe business 120,000 Matmid Points round-trip**.
- **TLV-US economy 70,000 Matmid Points round-trip**.
- **TLV-US business 180,000-220,000 Matmid Points round-trip** (verify post-April-2025 chart).
- **Delta SkyMiles partner award booking on El Al** is the cleanest US-flexible-currency path.
- **No fuel surcharges on El Al-operated awards** (verify).',
  tier_benefits = '[
    {"name": "Silver", "qualification": "3,500 Diamonds OR 2,600 Diamonds + 7 segments in past 12 months (post-April-2025 thresholds)", "benefits": ["Priority check-in", "Extra baggage", "Bonus earn"]},
    {"name": "Gold", "qualification": "7,500 Diamonds OR 4,500 Diamonds + 13 segments in past 12 months", "benefits": ["Lounge access on El Al", "Priority boarding", "Higher mile bonus", "FLY+ Choice Benefits"]},
    {"name": "Platinum", "qualification": "15,000 Diamonds OR 9,000 Diamonds + 26 segments in past 12 months", "benefits": ["All Gold benefits", "Partner lounge access via bilateral (verify scope)", "Higher Diamonds earn", "Top priority on waitlists"]},
    {"name": "Top Platinum", "qualification": "36,000 Diamonds OR 32,000 Diamonds + 52 segments in past 12 months", "benefits": ["Highest tier", "Broadest partner-lounge reciprocity (verify per partner)", "All Platinum benefits", "Concierge-level recognition"]}
  ]'::jsonb,
  lounge_access = 'El Al operates the King David Lounge, the Dan Lounge, and the Matmid Lounge at TLV. Top Platinum and Platinum members get partner lounges via bilateral arrangements (Star and oneworld partners; verify scope per agreement). Day-pass access for non-elites is not standard - verify on elal.com.',
  quirks = '- **Two-currency model**: Diamonds (status) + Matmid Points (redemption) since the 2023 overhaul.
- **Delta SkyMiles strategic partnership launched January 1 2024**, codeshare/FFP benefits live January 15 2024.
- **El Al / American Airlines partnership ENDED March 30 2024**.
- **El Al / Alaska partnership ENDED June 30 2024**.
- **April 1 2025 Matmid overhaul**: thresholds +30%, 9-month status refresh cycle, soft landings removed, FLY+ Choice Benefits added, expanded lifetime status program.
- **Amex MR -> Matmid direct pipe ended January 1 2021** - no current direct US flexible-currency transfer.
- **No Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott direct transfers** to Matmid.
- **Practical US path: Amex MR -> Delta SkyMiles -> El Al partner award** since January 2024.
- **Matmid Points expire 36 months from earning** - per-mile hard expiry, not rolling.
- **Diamonds reset every 9 months** post April 2025.
- **Soft landings removed in 2025** - harder to retain status.
- **No fuel surcharges on El Al-operated awards** (verify).
- **No mile pooling** (verify).
- **Revenue-based Matmid Points earn since 2023 overhaul**.
- **No US-issued co-brand card** on the Matmid Points side (Israeli Isracard / Cal cards only); the El Al Mastercard issuer in the US has shifted - verify current issuer.',
  award_chart = 'Matmid uses a published award chart with peak/off-peak dating. Sample saver round-trip pricing on El Al metal as of May 2026 (verify post-April-2025 changes):

| Route | Cabin | Matmid Points |
|---|---|---|
| TLV-Europe round-trip | Economy | 30,000-50,000 |
| TLV-Europe round-trip | Business | ~120,000 |
| TLV-US (JFK/EWR/LAX/MIA) round-trip | Economy | ~70,000 |
| TLV-US round-trip | Business | ~180,000-220,000 |

Verify current pricing on elal.com - the April 2025 overhaul reshaped the program.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'el-al';

-- ============================================================
-- 8. FLYDUBAI (uses Emirates Skywards; no separate currency)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'flydubai',
  alliance = 'none',
  hubs = ARRAY['DXB'],
  intro = 'flydubai is the Government of Dubai-owned (Investment Corporation of Dubai) low-cost arm complementing Emirates. The fleet runs roughly 80-85 Boeing 737-800 / MAX 8 / MAX 9 aircraft, primarily out of DXB Terminal 2 for budget routes and Terminal 3 for codeshares with Emirates (co-located since 2018).

The critical reader fact: there is no separate flydubai loyalty currency. flydubai uses Emirates Skywards as its frequent-flyer program. The legacy "OPEN" program was retired August 1, 2018 when the Skywards integration completed. All earning, status, and redemption flow through Emirates Skywards. The April 29, 2025 enhancement introduced full Classic Reward redemption on flydubai across all cabins from 5,000 Miles, with Cash+Miles flexibility. May-June 2025 ran a Double Tier Miles promo across flydubai and Emirates.

For US travelers, flydubai sweet spots ride the Emirates Skywards transfer landscape: Amex MR 5:4 (effective Sep 16 2025), Capital One 4:3 (effective Jan 13 2026), Citi 1,000:800 (effective Jul 27 2025), Bilt 1:1 on Rent Day only (the lone remaining 1:1 partner), Marriott 3:1 standard. Chase UR ENDED October 16 2025 and should not be listed as active. Wells Fargo is not a partner. The flydubai-specific value: short-haul routes (Caucasus, East Africa, Balkans, Central Asia) at 5,000-12,500 Miles + cash co-pay - you can pair with an Emirates DXB-US business award at roughly 136,000 Miles for a Dubai stopover that unlocks destinations Emirates can not reach (Mogadishu, Bishkek, Skopje).',
  transfer_partners = '[
    {"from_slug": "amex-mr", "ratio": "5:4", "notes": "5:4 effective September 16, 2025. No US federal excise tax (foreign carrier).", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "4:3", "notes": "4:3 effective January 13, 2026.", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1000:800", "notes": "1,000:800 effective July 27, 2025. Effectively 5:4.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "1:1, Rent Day only. The only remaining 1:1 partner to Emirates Skywards. Bilt transfers fire only on the 1st of the month.", "bonus_active": false},
    {"from_slug": "marriott-bonvoy", "ratio": "3:1", "notes": "3:1 standard. 60,000 Bonvoy yields 25,000 Skywards Miles + 5,000-mile bonus at the 60K tier.", "bonus_active": false}
  ]'::jsonb,
  how_to_spend = '- **DXB to short-haul flydubai routes (Caucasus, East Africa, Balkans, Central Asia) economy 5,000-12,500 Skywards Miles + cash co-pay**.
- **DXB to Tbilisi / Baku / Kathmandu business roughly 25,000-40,000 Skywards Miles one-way** (verify).
- **Pair flydubai with Emirates DXB-US business at roughly 136,000 Skywards Miles** for a stopover via Dubai.
- **Bilt 1:1 on Rent Day** - the only remaining 1:1 partner to Skywards.
- **My Family pooling** - up to 8 family members can pool Skywards Miles, which is genuinely powerful.
- **Cash+Miles flexibility expanded April 2025** - mix points and cash on flydubai redemptions.',
  sweet_spots = '- **DXB to flydubai-only destinations (Mogadishu, Bishkek, Skopje, Sarajevo, etc.)** - the network reach Emirates does not have.
- **DXB short-haul economy from 5,000 Skywards Miles** - sharp value on otherwise expensive paid routes.
- **DXB to Caucasus / Central Asia business 25,000-40,000 Skywards Miles one-way** (verify).
- **Bilt 1:1 Rent Day** is the only remaining 1:1 transfer to Emirates Skywards.
- **My Family pooling up to 8 members** for redeeming bigger awards.
- **Cash+Miles flexibility (April 2025)** lets you redeem when you do not have full mile balance.',
  tier_benefits = '[
    {"name": "Skywards Blue", "qualification": "Entry tier (free)", "benefits": ["Earn Skywards Miles and Tier Miles on flydubai and Emirates", "Cash+Miles flexibility"]},
    {"name": "Silver", "qualification": "25,000 Tier Miles", "benefits": ["30% Skywards Miles bonus on flydubai and Emirates", "Priority check-in", "Extra baggage"]},
    {"name": "Gold", "qualification": "50,000 Tier Miles", "benefits": ["75% Skywards Miles bonus", "Lounge access on flydubai and Emirates", "Priority boarding"]},
    {"name": "Platinum", "qualification": "150,000 Tier Miles plus at least 1 First or Business segment", "benefits": ["100% Skywards Miles bonus", "Premium lounge access", "Confirmed-seat priority on sold-out flights", "Top priority"]}
  ]'::jsonb,
  lounge_access = 'flydubai operates the flydubai Business Class Lounge at DXB Terminal 3. Skywards Gold and Platinum members get Emirates lounges across the network. Day-pass access is not standard - business-class entry is fare-based.',
  quirks = '- **No separate flydubai loyalty currency** - flydubai uses Emirates Skywards. The legacy OPEN program was retired August 1, 2018.
- **April 29 2025 enhancement**: full Classic Reward redemption on flydubai across all cabins from 5,000 Skywards Miles, with Cash+Miles flexibility.
- **May-June 2025 Double Tier Miles promo** ran across flydubai and Emirates.
- **Chase UR -> Emirates Skywards ENDED October 16, 2025** - do not list as active.
- **Wells Fargo Rewards is NOT a Skywards transfer partner**.
- **Bilt 1:1 is the only remaining 1:1 partner** to Emirates Skywards (Rent Day only).
- **No US federal excise tax on Amex MR transfers** (foreign carrier).
- **My Family pooling lets up to 8 family members pool Skywards Miles** - genuinely powerful.
- **Skywards Miles expire 3 years from earning** (rolling).
- **Fuel surcharges (YQ) on Emirates and flydubai pass material co-pay** especially in premium cabins.
- **flydubai unlocks unique award destinations Emirates cannot reach** - Mogadishu, Bishkek, Skopje, Sarajevo, etc.
- **No US-issued flydubai co-brand card** - Emirates Skywards Premium World Elite Mastercard via Barclays US is the Emirates-side product.
- **Co-located with Emirates at DXB Terminal 3** since 2018 for codeshare connectivity.',
  award_chart = 'flydubai redemptions price in Emirates Skywards Classic Rewards using a published distance/region chart. As of April 29, 2025, flydubai redemption is available across all cabins from 5,000 Skywards Miles, with Cash+Miles flexibility.

Sample one-way saver pricing on flydubai metal as of May 2026:

| Route | Cabin | Skywards Miles + Cash |
|---|---|---|
| DXB short-haul (Caucasus / East Africa / Balkans / Central Asia) | Economy | 5,000-12,500 + cash |
| DXB to Tbilisi / Baku / Kathmandu | Business | ~25,000-40,000 + cash |
| Emirates DXB-US (paired stopover) | Business | ~136,000 |

Verify current pricing on emirates.com and flydubai.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'flydubai';

-- ============================================================
-- 9. VIVAAEROBUS VIVAFAN (paid discount club, NOT a points program)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'VivaAerobus VivaFan',
  alliance = 'none',
  hubs = ARRAY['MTY','MEX','AIFA','CUN','GDL'],
  intro = 'VivaAerobus VivaFan is the paid annual discount club of VivaAerobus, Mexico''s largest ULCC by passenger count (roughly 25 million per year, parent IAMSA + Irelandia Aviation, CEO Juan Carlos Zuazua). The fleet runs roughly 80-90 A320-family aircraft, primarily from MTY (Monterrey, the main hub), with MEX/AIFA, CUN, and GDL as focus cities. US routes include Houston, Dallas, Las Vegas, Los Angeles, Chicago, Denver, Austin, San Antonio, and Orlando.

The critical reader fact: VivaFan is a paid discount subscription, NOT a points program. The closest mental models are Sun Country UClub, Avelo PLUS, Volaris v.club, Frontier Discount Den, Spirit Saver$ Club, and Wizz Discount Club. There is no points currency to earn, transfer, or redeem - members pay an annual fee in exchange for a fixed discount on every paid Viva booking. Pricing varies by region (verify on vivaaerobus.com): VivaFan Individual sits around MXN $1,499 per year, and the Accompanied Traveler tier covers up to 8 companions on the same booking. Discounts run roughly MXN $400 off per round-trip on Viva Smart, MXN $300 off Basico, and MXN $200 off Light, plus extra carry-on or checked baggage allowance and member-only sale access. No US flexible currency transfers in (because there is nothing to transfer to). The strongest US-flyer use case is group or family travel via the Accompanied Traveler tier - 8 passengers x MXN $400 = up to MXN $3,200 in savings per trip.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **VivaFan is a paid annual subscription, not a points currency** - there is nothing to redeem.
- **Strongest use case: group or family travel via Accompanied Traveler** - up to 8 passengers covered on the same booking.
- **Pays for itself in 2-3 round-trips per year** for US flyers booking MTY-MEX or US-Cancun on Viva.
- **Compare against simply paying cash** and earning on Capital One Venture or Bilt on the credit card.
- **Discount applies to base fare only**, not taxes and fees.
- **No US-issued co-brand card** - Banamex / Banorte issue Viva-branded cards in Mexico only.',
  sweet_spots = '- **Group / family travel via Accompanied Traveler tier** - up to MXN $3,200 saved per trip on 8-passenger bookings.
- **2-3 US-Cancun or US-MTY round-trips per year** breaks even on the annual subscription cost.
- **VivaFan Individual around MXN $1,499 per year** - verify current US pricing on vivaaerobus.com.
- **Member-only sale access** layers on top of the fixed discount.',
  tier_benefits = '[
    {"name": "VivaFan Individual", "qualification": "Approximately MXN $1,499 per year (US pricing varies)", "benefits": ["Up to MXN $400 off per round-trip on Viva Smart", "MXN $300 off Basico round-trip", "MXN $200 off Light round-trip", "Extra carry-on or checked baggage allowance", "Member-only sale access"]},
    {"name": "VivaFan Accompanied Traveler", "qualification": "Higher annual fee (verify pricing on vivaaerobus.com)", "benefits": ["Same discounts as Individual", "Covers up to 8 companions traveling on the same booking", "Strongest value for group / family travelers"]}
  ]'::jsonb,
  lounge_access = 'VivaAerobus does not operate a lounge program - ULCC.',
  quirks = '- **PAID DISCOUNT CLUB, not a points program** - the canonical "what crazy4points readers need to know" framing.
- **Closest mental models**: Sun Country UClub, Avelo PLUS, Volaris v.club, Frontier Discount Den, Spirit Saver$ Club, Wizz Discount Club.
- **No points currency means no transfers, no award chart, no status earning**.
- **No US flexible-currency transfer partners** - because there is nothing to transfer to.
- **Annual auto-renewal** (verify policy on vivaaerobus.com).
- **Discount applies to base fare only**, not taxes / fees.
- **Accompanied Traveler tier covers up to 8 companions on the same booking** - the strongest group-travel value.
- **No reciprocity with other airlines** - contrast with Allegiant Allways which has a co-branded card path.
- **No status, no lounges, no upgrades** - ULCC operating model.
- **No US-issued co-brand card** - Banamex and Banorte issue Mexican domestic Viva-branded cards only.
- **CEO Juan Carlos Zuazua, parent IAMSA + Irelandia Aviation**.
- **Mexico''s largest ULCC by passengers** at roughly 25M per year.
- **US routes include IAH, DAL, LAS, LAX, ORD, DEN, AUS, SAT, MCO**.',
  award_chart = 'VivaFan has no award chart - it is a paid annual subscription, not a points currency. All "redemption" is the cash discount applied to paid fares (roughly MXN $400 off Viva Smart, MXN $300 off Basico, MXN $200 off Light per round-trip; verify current discounts on vivaaerobus.com).',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'vivaaerobus';

-- ============================================================
-- 10. PEGASUS BOLBOL (Turkish ULCC; hybrid coalition program)
-- ============================================================
update programs set
  type = 'loyalty_program',
  name = 'Pegasus BolBol',
  alliance = 'none',
  hubs = ARRAY['SAW','AYT','ESB'],
  intro = 'Pegasus BolBol is the loyalty program of Pegasus Airlines, the Esas Holding (Sabanci family) Turkish ULCC publicly traded on Borsa Istanbul (PGSUS). CEO Guliz Ozturk leads roughly 30 million annual passengers on a 100-110+ aircraft fleet (A320neo, A321neo, 737-800), primarily out of SAW (Istanbul-Sabiha Gokcen) with AYT (Antalya) and ESB (Ankara) as focus cities. Pegasus was founded as a charter operation in 1990, relaunched as an LCC in 2005, and IPO''d in 2013. Routes span Europe, Turkey domestic, the Middle East, Central Asia and the Caucasus, and North Africa.

For US travelers BolBol is hard to access. No major US flexible currency transfers in - not Amex MR, Chase UR, Capital One, Citi, Bilt, Wells Fargo, or Marriott. The only practical funding paths are flying Pegasus or holding ING Turkey co-branded cards (Premium or Classic). The program is more flexible than a traditional FFP - call it a hybrid points-and-coalition program with mobile-app gamification (yes, weekly BolPoints for finding hidden objects in the app, which is unusual). The published award chart is simple: domestic winter one-way 10,000 BolPoints, summer 15,000; international winter one-way 25,000, summer 30,000. Minimum 2,000 BolPoints to redeem for a ticket and 500 for ancillaries. For US flyers the practical takeaway: Pegasus paid fares are typically very cheap, so cash often beats points unless you are already accruing through ING Turkey or routine Pegasus flying.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Istanbul (SAW) to European hubs (CDG/AMS/LHR/FRA) winter at 25,000 BolPoints one-way** - solid against Eur 100+ paid fares.
- **Domestic Turkey winter one-way at 10,000 BolPoints** - works for in-country positioning.
- **Domestic summer one-way at 15,000 BolPoints**.
- **International summer one-way at 30,000 BolPoints**.
- **ING Pegasus BolBol Premium card** earns approximately 1 BolPoint per 3 TRY general spend, 1 per 1 TRY Pegasus spend.
- **Stack mobile-app gamification (weekly hidden-object BolPoints)** for trickle earning if you are a regular Pegasus flyer.',
  sweet_spots = '- **Istanbul-Europe winter one-way 25,000 BolPoints** - the headline sweet spot.
- **Domestic Turkey winter one-way 10,000 BolPoints**.
- **Pegasus paid fares are typically very cheap** - cash often beats points unless you are already accruing.
- **Mobile-app gamification (hidden-object games)** is unusual for an FFP - BolPoints trickle in for active users.
- **Practical US-flyer takeaway**: hard to fund without flying Pegasus or holding ING Turkey cards.',
  tier_benefits = '[
    {"name": "BolBol member", "qualification": "Entry tier (free)", "benefits": ["Earn BolPoints on Pegasus, mobile-app activity, and ING Pegasus co-brand cards", "Redeem for tickets (min 2,000 BolPoints) and ancillaries (min 500 BolPoints)"]}
  ]'::jsonb,
  lounge_access = 'Pegasus does not operate a standard lounge program for non-elites. Paid lounge access is available at SAW - verify pricing on flypgs.com.',
  quirks = '- **Hybrid points-plus-coalition program** - more flexible than a traditional FFP.
- **No major US flexible-currency direct partner** - not Amex, Chase, Capital One, Citi, Bilt, Wells Fargo, or Marriott.
- **Only practical funding paths: flying Pegasus or holding ING Turkey co-branded cards** (Premium or Classic).
- **Published simple chart**: domestic winter 10K / summer 15K, international winter 25K / summer 30K one-way.
- **Minimum 2,000 BolPoints to redeem for a ticket; 500 for ancillaries**.
- **Mobile-app gamification (weekly hidden-object BolPoints)** is unusual for an FFP.
- **Currency is TRY-denominated** - Turkish lira inflation reshapes earn math year over year.
- **No fuel surcharges on Pegasus awards** - LCC, fees are minimal.
- **No alliance** - purely Pegasus metal redemption.
- **Add-ons (extra bag, meals, IFE) earn BolPoints**.
- **No US-issued co-brand card**.
- **Routes span Europe, Turkey domestic, Middle East, Central Asia / Caucasus, North Africa**.
- **Founded 1990 as charter; LCC since 2005; IPO 2013**.
- **CEO Guliz Ozturk; parent Esas Holding (Sabanci family)**.',
  award_chart = 'BolBol uses a simple published one-way award chart with peak/off-peak (winter/summer) dating:

| Route | Season | BolPoints |
|---|---|---|
| Domestic Turkey one-way | Winter | 10,000 |
| Domestic Turkey one-way | Summer | 15,000 |
| International one-way | Winter | 25,000 |
| International one-way | Summer | 30,000 |

Minimum 2,000 BolPoints to redeem for a ticket; 500 BolPoints for ancillaries. Verify on flypgs.com.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'pegasus';
