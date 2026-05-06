-- Seed JAL Mileage Bank full program page (Batch A #8).
--
-- Authored 2026-05-06. Sources: official jal.co.jp pages (only 2/6 scrapes
-- succeeded - JAL site is heavily Firecrawl-blocked) + Copilot Master Fact
-- Sheet + 2026-dated travel publications (The Points Guy, Upgraded Points,
-- Frequent Miler, AwardWallet, NerdWallet, MilesTalk, 10xTravel).
--
-- Three major 2025-2026 events:
--   - June 10, 2025: Award chart devaluation. North America-Japan Economy
--     25K -> 27K, Business 50K -> 55K, First 70K-100K -> 110K-140K seasonal.
--   - September 2025: Capital One Miles -> JAL added at 4:3 (1,000 C1 = 750
--     JAL miles). Periodic 30% transfer bonuses bring effective rate near 1:1.
--   - March 31, 2026: JetBlue partnership ENDED. JetBlue earning + redemption
--     no longer available on JMB.
--
-- Lean Path-2 shape: structural overview in award_chart + sweet-spot
-- narrative + link to official chart. Tool-shaped data lives in
-- partner_redemptions for the Booking Tool.

update programs set
  alliance = 'oneworld',
  hubs = array['HND','NRT','KIX','NGO'],
  intro = 'JAL Mileage Bank is the loyalty program of Japan Airlines, a oneworld member operating from Tokyo Haneda (HND) and Tokyo Narita (NRT) with secondary hubs at Osaka Kansai (KIX) and Nagoya Chubu (NGO). JAL''s flagship redemption product is the new **A350-1000 First Class suite** (six private suites per aircraft) on routes like JFK, ORD, and LAX, plus the Sky Suite III Business class. JAL also has the strongest US partner relationship in oneworld: a transpacific joint venture with American Airlines that lets US flyers earn JAL Miles on AA metal and vice versa.

For US-based readers, JAL has a defining structural quirk: **very limited US transfer-partner access.** Only **Bilt Rewards (1:1)**, **Capital One Miles (4:3, added September 2025)**, and **Marriott Bonvoy (3:1)** transfer directly. Amex, Chase, and Citi do **not** transfer to JAL Mileage Bank. Capital One periodically runs 30% transfer bonuses that bring the effective rate near 1:1 - watch for those windows.

Two other notable events: **June 10, 2025** brought a major award chart devaluation (US-Japan Economy 25K -> 27K, Business 50K -> 55K, First Class 70-100K -> 110-140K seasonal). **March 31, 2026** ended the JetBlue partnership - JetBlue is no longer earnable or redeemable on JAL Mileage Bank.

JAL''s biggest non-redemption draw is the **JAL Global Club (JGC)** lifetime status program. Hit JMB Sapphire (50,000 FOP in one calendar year) plus hold a JAL Card, and you qualify for permanent oneworld Sapphire-equivalent status - one of the best lifetime-status pathways in any airline program.',
  transfer_partners = '[
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"Best US transfer path. Direct 1:1, instant. Rent Day 2x bonuses on transfers periodically (1st of each month).","bonus_active":false},
    {"from_slug":"capital-one","ratio":"4:3","notes":"Added September 2025. 1,000 Cap One Miles = 750 JAL Miles. Periodic 30% transfer bonuses (April 2026 was 30%) bring effective rate to ~1,000:975. Watch promo windows.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K JAL Miles (5K bonus on every 60K block). Generally only useful as a top-up to reach a specific redemption target."}
  ]'::jsonb,
  how_to_spend = '- **US-Japan Business class on JAL Sky Suite** at 55,000 JAL Miles one-way. Highly competitive transpacific Business redemption.
- **US-Japan First class on the new A350-1000** at 110,000-140,000 JAL Miles one-way (Low / Regular / High season). Six private suites per aircraft - one of the world''s best First class hard products.
- **Intra-Japan domestic awards** at 4,500-12,000 JAL Miles one-way - the program''s most underrated sweet spot. Hop between Tokyo, Osaka, Kyoto (via KIX), Sapporo, Fukuoka, Okinawa for minimal miles after arriving in Japan.
- **Japan-Southeast Asia Business class** at 36,000 JAL Miles one-way (BKK, SIN, etc.). Excellent value for the JAL Sky Suite product.
- **AA-operated US routes credited to JMB** - the AA/JAL transpacific JV allows JAL Mileage Bank members to redeem on AA metal at JAL''s partner pricing.
- **oneworld partner awards** (BA, Cathay, Iberia, Qantas, Qatar, Finnair, Alaska, Malaysia, Royal Air Maroc, Royal Jordanian, SriLankan, Oman Air, Fiji Airways).
- **Non-alliance partners**: Hawaiian Airlines, Emirates, Air France, China Eastern, Bangkok Airways, Vietjet, Jetstar Japan.',
  sweet_spots = '- **Intra-Japan domestic at 4,500-12,000 miles** is one of the best sweet spots in any program. Combine an international award to Japan with multiple domestic hops to maximize trip value.
- **JAL Sky Suite Business US-Japan at 55,000 miles** is highly competitive - and JAL has dramatically lower fuel surcharges than BA, Lufthansa, or even ANA.
- **JAL First Class at 110,000 JAL Miles in Low Season** - aspirational but achievable through a single 30%-bonus Capital One transfer or accumulated Bilt earnings.
- **Japan-Southeast Asia Business at 36,000 miles** beats most other programs for SE Asia premium-cabin redemptions out of Tokyo.
- **JGC lifetime status is the secret weapon** - 50,000 FOP in one calendar year + a JAL Card unlocks permanent oneworld Sapphire-equivalent benefits. Easier to attain than American''s lifetime tiers and globally useful.
- **360-day booking window** gives JMB members first-mover advantage over partner programs that typically get later access to JAL premium-cabin space.
- **Capital One 30% transfer bonuses** (recurring; April 2026 was 30%) bring the 4:3 ratio close to 1:1. Time large transfers to bonus windows.
- **Credit AA flights to JMB** rather than AAdvantage if pursuing JGC lifetime status or stockpiling JAL Miles for a specific redemption.',
  tier_benefits = '[
    {"name":"JMB (entry)","qualification":"Free auto-enrollment. No FOP threshold.","benefits":["Earn JAL Miles + FLY ON Points on flights","Online check-in priority","Member-only offers"]},
    {"name":"JMB Crystal","qualification":"30,000 FLY ON Points (FOP) including 15,000 from JAL Group flights, in a calendar year. Or 30 flights including 15 JAL Group + 10,000 FOP.","benefits":["Priority airport check-in","+1 extra checked bag (international)","+55% mileage bonus on JAL flights"]},
    {"name":"JMB Sapphire","qualification":"50,000 FOP including 25,000 from JAL Group, in a calendar year. Or 50 flights including 25 JAL Group + 15,000 FOP.","benefits":["oneworld Sapphire","Sakura Lounge access (member only)","oneworld Business class lounge access on partners worldwide for member + 1 guest","Priority boarding and baggage handling","+1 extra checked bag (international)","+105% mileage bonus on JAL flights","Domestic complimentary upgrades","Trigger for JGC lifetime application"]},
    {"name":"JGC Premier","qualification":"80,000 FOP including 40,000 from JAL Group, or 80 flights with 40 JAL Group + 25,000 FOP. Available only to JAL Global Club members.","benefits":["All JMB Sapphire benefits","Higher priority on standby and waitlist","Enhanced lounge guest privileges","Higher mileage bonus"]},
    {"name":"JMB Diamond","qualification":"100,000 FOP including 50,000 from JAL Group, in a calendar year. Or 120 flights including 60 JAL Group + 35,000 FOP.","benefits":["oneworld Emerald","JAL First Class Lounge access at HND / NRT and partner First lounges worldwide for member + 1 guest","Priority everything (boarding, baggage, irregular ops)","+1 extra checked bag (international)","+130% mileage bonus on JAL flights","Domestic + international complimentary upgrades (waitlist)","Diamond Metal services available at 150K JAL Group FOP"]},
    {"name":"JAL Global Club (JGC) - LIFETIME","qualification":"Reach JMB Sapphire (50,000 FOP in one calendar year) AND apply for / hold a JAL Card (JAL''s co-brand credit card, available primarily in Japan). JGC status is permanent.","benefits":["Permanent oneworld Sapphire-equivalent status (lounge access, priority boarding, extra baggage, upgrade eligibility)","Status retained regardless of subsequent year flight activity","JGC Sapphire / JGC Premier / JGC Diamond enhanced tiers available with continued FOP earning"]}
  ]'::jsonb,
  lounge_access = 'JAL operates the **Sakura Lounge** (Business class) and **First Class Lounge** networks at Tokyo Haneda (HND), Tokyo Narita (NRT), and select international gateways including JFK and other US hubs. JAL''s lounges are widely regarded among the best in the world for food quality (the Sakura sushi bar at HND is famous) and quiet design.

Access rules:
- **Same-day JAL or oneworld flight + oneworld Sapphire (JMB Sapphire / JGC Sapphire)** - Sakura Lounge / oneworld Business class lounges worldwide for member + 1 guest, any cabin.
- **Same-day JAL or oneworld flight + oneworld Emerald (JMB Diamond)** - JAL First Class Lounge / Star First lounges for member + 1 guest, any cabin.
- **Same-day JAL First Class boarding pass at HND / NRT** - First Class Lounge access in any context.
- **Same-day JAL Business Class or Premium Economy boarding pass** - Sakura Lounge access in any context.
- **JGC lifetime members** - Sakura Lounge access for life when traveling on JAL or oneworld.

JAL does not generally sell day passes to non-status passengers. Access is by status or premium cabin only.',
  quirks = '- **Miles expire 36 months from the calendar month earned**, with no extension via activity, fees, or credit card spend. Each batch of miles has its own death date. Plan redemptions ahead.
- **Limited US transfer-partner access**: only Bilt (1:1), Capital One (4:3), and Marriott (3:1). NO Amex, Chase, or Citi direct transfers. This is the program''s biggest constraint for non-flying earners.
- **March 31, 2026: JetBlue partnership ENDED.** JetBlue earning and redemption are no longer available on JMB.
- **September 2025: Capital One Miles became a JAL transfer partner** at 4:3. Periodic 30% bonuses bring effective rate near 1:1.
- **Region-pair award chart** for JAL-operated international flights (not distance-based). Pricing is determined by origin/destination region and cabin.
- **Award Ticket PLUS** = variable higher-mileage pricing when base-level award space is exhausted on Economy / Premium Economy / Business. Does NOT apply to First class.
- **First class seasonal pricing**: Low (L) / Regular (R) / High (H). 110K/120K/140K JAL Miles US-Japan one-way.
- **AA / JAL transpacific joint venture** lets US-based JAL Mileage Bank members earn JAL Miles + FLY ON Points on AA metal, and book AA awards through JMB at partner pricing. Particularly valuable for travelers near AA hubs (DFW, MIA, CLT, ORD, PHL, JFK, LAX).
- **JAL Global Club (JGC) lifetime status** triggered by reaching JMB Sapphire (50,000 FOP) once + holding a JAL Card. Permanent oneworld Sapphire-equivalent. One of the easiest lifetime-status pathways in major airline loyalty programs.
- **360-day booking window** for JAL-operated awards - first-mover advantage over partner programs that typically get access later.
- **Waitlist for international awards**: miles not deducted until seat is confirmed. If unconfirmed, waitlist clears before departure.
- **Low fuel surcharges** on JAL-operated awards relative to BA, Lufthansa, ANA. Surcharges are revised periodically (most recently May 1, 2026).
- **New account restriction**: JAL may block redemptions for up to 60 days after account opening.
- **No US-issued co-brand credit card.** JAL Card products are primarily Japan-only.',
  award_chart = '## JAL Mileage Bank redemption structure

JAL uses **two parallel charts**:

| Chart | Routes | Pricing model |
|---|---|---|
| **JAL International Award Chart** | JAL-operated international flights | Region-pair x cabin x season; not distance-based |
| **JAL Domestic Award Chart** | JAL-operated domestic Japan flights | Distance zones (A through G); flat per-zone pricing |
| **Partner Award Chart** | oneworld + non-alliance partners | Distance-based, generally higher than JAL''s own region-pair chart |

**Carrier-imposed surcharges (YQ):** Lower on JAL-operated metal than most major international carriers. Significantly cheaper than BA, Lufthansa, ANA. Surcharges revised periodically; most recent revision May 1, 2026.

**Award Ticket PLUS:** Variable higher-mileage pricing for Economy / Premium Economy / Business when base-level (saver) award space is exhausted. Does NOT apply to First class.

**Booking window:** 360 days in advance for JAL-operated awards (first-mover advantage over partners).

### JAL international award chart (post-June 10, 2025; one-way base miles)

| Route (to/from Japan) | Economy | Premium Economy | Business | First (L/R/H) |
|---|---|---|---|---|
| North America (JFK/ORD/LAX/etc.) | 27,000 | 40,000 | 55,000 | 110,000-140,000 |
| Hawaii (HNL) | 20,000 | 28,000 | 40,000 | 50,000-60,000 |
| Europe (LHR/CDG/HEL/etc.) | 27,500 | 40,000 | 55,000 | 110,000-140,000 |
| Southeast Asia (BKK/SIN/etc.) | 17,500 | 25,000 | 36,000 | 55,000-70,000 |
| East Asia (ICN/PVG/HKG/TPE) | 12,000 | 18,000 | 25,000 | 35,000-50,000 |
| Guam | 10,000 | 15,000 | 21,000 | n/a |
| Oceania (SYD/MEL) | 20,000 | 32,000 | 42,000 | 70,000-100,000 |

### JAL domestic award chart (one-way base miles)

| Zone | Example routes | Economy | Class J / First |
|---|---|---|---|
| A (short-haul) | Osaka-Kochi, Fukuoka-Miyazaki | 4,500 | 4,500 |
| B | Sapporo-Aomori, Tokyo-Nagoya | 5,500 | 5,500 |
| C | Tokyo-Osaka (Itami/Kansai) | 6,500 | 6,500 |
| D | Tokyo-Hiroshima, Tokyo-Matsuyama | 7,500 | 7,500 |
| E | Tokyo-Fukuoka, Tokyo-Kagoshima | 9,000 | 9,000 |
| F | Tokyo-Okinawa (Naha) | 10,000 | 10,000 |
| G (long-haul) | Tokyo-Ishigaki, Osaka-Naha | 12,000 | 12,000 |

Domestic awards also use Award Ticket PLUS variable pricing when base space is unavailable (up to 18,500-50,000 miles depending on zone).

### Earning rates on JAL international flights (% of distance flown)
- First (F, A): 150%
- Business (J, C, D): 125%
- Business discounted (X, I): 70%
- Premium Economy (W): 100% / discounted (E): 70%
- Economy Flex (Y, B): 100%
- Economy Standard (H, K, M): 70%
- Economy Discount (L, V, S): 50%
- Economy Deep Discount (Q, N, O): 30-50%

Plus JMB tier bonus: Crystal +55%, Sapphire / JGC +105%, Diamond +130%.

### Notable redemption pricing
- US-Japan Business: 55,000 JAL Miles one-way
- US-Japan First (Low season): 110,000 JAL Miles one-way
- US-Japan First (High season): 140,000 JAL Miles one-way
- Hawaii-Japan Business: 40,000 JAL Miles one-way
- Japan-Southeast Asia Business: 36,000 JAL Miles one-way
- Intra-Japan domestic: 4,500-12,000 JAL Miles one-way

**Official chart:** https://www.us.jal.co.jp/us/en/jalmile/use/

### What does NOT transfer to JAL Mileage Bank
- **American Express Membership Rewards** - no direct transfer
- **Chase Ultimate Rewards** - no direct transfer
- **Citi ThankYou Points** - no direct transfer

This is a defining program constraint. Plan earn strategy around Bilt + Capital One + flying.

### No US co-brand card
JAL Card products are primarily Japan-only. US readers reach JAL Miles via Bilt / Capital One direct, Marriott indirect, or by crediting AA flights to JMB.',
  partner_chart_url = 'https://www.us.jal.co.jp/us/en/jalmile/use/',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'jal';

-- Step 5.5 partner_redemptions: oneworld + key non-alliance partners
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + JMB partner awards (distance-based, partner chart)', 'fixed',
  'JMB partner award chart is distance-based and generally priced higher than JAL''s own region-pair chart. Partner award availability often less generous than JAL-operated. JetBlue partnership ENDED March 31, 2026.',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'jal' and c.slug in ('jal','aa','alaska','ba-avios','cathay','finnair','iberia','malaysia','qantas','qatar','royal_jordanian','srilankan','hawaiian')
on conflict do nothing;

-- JAL-operated international awards (region-pair chart, low YQ, JGC lifetime trigger)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Business', 'JAL-operated international (region-pair x cabin x season)', 'fixed',
  'JAL international award chart uses region-pair pricing (not distance-based). Post-June 10 2025 chart: US-Japan Economy 27K, Business 55K, First 110-140K seasonal. Award Ticket PLUS variable pricing when base saver space exhausted. 360-day booking window. Low fuel surcharges relative to BA/Lufthansa/ANA. AA/JAL transpacific JV allows JMB members to earn + redeem on AA metal.',
  'HIGH', current_date, true, 'low'
from programs p where p.slug = 'jal'
on conflict do nothing;
