-- Seed Air Canada Aeroplan full program page.
--
-- Authored 2026-05-05. Sources: official Air Canada T&C scrape (1 of 6 -
-- the rest are Firecrawl-blocked, similar to AA/Southwest) + extensive
-- 2026-dated WebSearch (Prince of Travel, Frequent Miler, Upgraded Points,
-- One Mile at a Time, The Points Guy, Milesopedia, AwardWallet, FlyerTalk,
-- aircanada.com PDFs).
--
-- Two major 2026 program changes:
--   1. Spend-based earning + new SQC (Status Qualifying Credits) elite system
--      effective Jan 1, 2026
--   2. Award chart update effective June 1, 2026 (devaluations on premium
--      cabin transatlantic / transpacific; intra-Americas unchanged)
--
-- Major sweet spots (post-June 2026):
--   - 25K business class US-Canada (NYC-YYZ)
--   - 60K business class Eastern US -> Western Europe (e.g. Brussels)
--   - 70K business class LAX-FRA on Lufthansa
--   - 102.5K business class US-Asia ultra-long-haul (was 87.5K pre-June)
--   - $0 in carrier-imposed (fuel) surcharges; $39 CAD partner booking fee on partner awards
--   - 5,000-point optional stopover (one per direction, only outside US/Canada)
--
-- Transfer partners (all 1:1):
--   - Amex MR (US), Chase UR (US), Bilt Rewards, Capital One Miles, Citi ThankYou
-- US co-brand: Chase Aeroplan World Elite Mastercard ($95 AF, launched Dec 2021).

update programs set
  alliance = 'star_alliance',
  hubs = array['YYZ','YUL','YVR','YYC'],
  intro = 'Aeroplan is the loyalty program of Air Canada and one of the most useful flexible-currency transfer targets for US-based readers. Aeroplan transfers 1:1 from Amex Membership Rewards, Chase Ultimate Rewards, Bilt Rewards, Capital One Miles, and Citi ThankYou - more flexible-currency overlap than any other Star Alliance program. It is also the rare program that charges no carrier-imposed (fuel) surcharges on any partner airline (Air Canada eliminated them in 2020), which makes it one of the safest currencies for booking premium cabins on long-haul partners like Lufthansa, ANA, Singapore, and EVA where surcharges through other programs can run hundreds of dollars per ticket.

In 2026, Aeroplan went through two major resets. **Effective January 1, 2026**, earning shifted from distance-based to spend-based on Air Canada flights, and a new Status Qualifying Credit (SQC) system replaced the old elite-status math. **Effective June 1, 2026**, the partner award chart was updated, raising premium-cabin pricing across most transatlantic and transpacific bands by 5,000 to 15,000 points one-way - still competitive, but the cheapest-on-the-block reputation is no longer quite so cheap. Intra-Americas pricing was unchanged.

The Aeroplan award chart is distance-based for partner flights (with fixed values, not ranges), and dynamic for Air Canada-operated flights with a published "starting from" floor. There is no alliance restriction beyond the Star Alliance core; you can mix Star Alliance partners on a single award.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"No transfer tax. Standard 1:1 transfer; foreign carrier so no US federal excise tax pass-through.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"No transfer fee. Aeroplan is one of Chase''s most-used 1:1 partners; periodic 20-25% transfer bonuses are common.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"No transfer tax. Rent Day 2x bonuses on transfers do apply periodically (1st of each month).","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"No transfer tax. Cap One announced Aeroplan as a partner in 2021 at 1:1 (previously 2:1.5).","bonus_active":false},
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"No transfer tax. Citi added Aeroplan in 2022 at 1:1.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"Hotel-to-airline transfer; 60,000 Marriott points = 25,000 Aeroplan (5K bonus on every 60K transferred). No tax.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner flights** - 25+ partner airlines with no carrier-imposed surcharges. Long-haul business and first class are the headline use case (Lufthansa, ANA, Singapore, EVA, Asiana, Turkish, SAS, Swiss, Austrian, Brussels Airlines, TAP, Avianca, Air China, Eva, Ethiopian, etc.).
- **Air Canada-operated flights** - dynamic-priced with a published "starting from" floor; sweet spots remain on US-Canada and Canada-Europe routes.
- **Optional stopover for 5,000 points** - one per direction, only at points outside the US and Canada. Powerful for adding a Europe city to a Europe itinerary or an Asia city to an Asia itinerary.
- **Aeroplan eStore + retail partners** - merchandise from 3,500 points; usually a poor cents-per-point return but useful at low balances.
- **HotelSavers** - 9,000+ hotel partner properties bookable with Aeroplan; cents-per-point varies, generally lower than airline redemptions.
- **Non-airline partners** - Vroom (cars), Aeroplan retail dining/grocery, gift cards. Lower value than flights; most readers should ignore unless trying to clear a small balance.',
  sweet_spots = '- **No fuel surcharges on any partner airline.** Aeroplan is one of the few Star Alliance programs that charges zero carrier-imposed (YQ/YR) surcharges on partner awards. On a long-haul Lufthansa or Swiss business class redemption, that''s typically $400-700 saved versus booking the same flight through United MileagePlus.
- **5,000-point optional stopover** is a meaningful add-on. One per direction; stopover only counts at airports outside the US and Canada and starts at 24+ hours. Frequent use case: NYC -> London -> Frankfurt with a 7-day London stopover for an extra 5K points one-way.
- **Transatlantic business class** from the Eastern US to Western Europe starts at 60,000 points one-way on partners like Brussels Airlines or TAP. Lufthansa LAX-FRA or LHR-BOS in business is around 70,000 points one-way.
- **Vancouver-Tokyo business class** on Air Canada or ANA is 55,000 points one-way - one of the cheapest North America to Asia business class redemptions in any program.
- **NYC-Toronto business class** on Air Canada is 25,000 points one-way - useful for short hops with a meaningful cabin upgrade.
- **Round-trip stopovers** add up to 10,000 points total (one each direction) for two destinations on one ticket - effectively a multi-city itinerary at minimal cost.
- **No close-in booking fee.** Aeroplan does not charge a close-in award booking fee, unlike United''s old policy.
- **$39 CAD partner booking fee** is the only added charge on partner awards - small relative to the absence of fuel surcharges.',
  tier_benefits = '[
    {"name":"25K","qualification":"25,000 SQC (Status Qualifying Credits) in a calendar year","benefits":["Star Alliance Silver","Priority airport check-in","Priority security at participating airports","2 points per CA$1 on Air Canada flights","3 complimentary checked bags (32kg) on Air Canada","Priority phone line","Free preferred seat selection on Air Canada"]},
    {"name":"35K","qualification":"35,000 SQC in a calendar year","benefits":["All 25K benefits","3 points per CA$1 on Air Canada flights","Same baggage and check-in privileges as 25K","Earlier zone boarding"]},
    {"name":"50K","qualification":"50,000 SQC in a calendar year","benefits":["All 35K benefits","Star Alliance Gold (lounge access on all Star Alliance partners worldwide for member + 1 guest)","4 points per CA$1 on Air Canada flights","Marriott Bonvoy Gold Elite status (automatic)","Maple Leaf Lounge access on Air Canada flights","eUpgrade credits (start of year)"]},
    {"name":"75K","qualification":"75,000 SQC in a calendar year","benefits":["All 50K benefits","5 points per CA$1 on Air Canada flights","Higher eUpgrade credit allocation (20 credits at year start)","Higher priority on standby and upgrade lists","Maple Leaf Lounge guest privileges expanded"]},
    {"name":"Super Elite","qualification":"125,000 SQC in a calendar year","benefits":["All 75K benefits","6 points per CA$1 on Air Canada flights","Priority everything (boarding, baggage, irregular operations rebooking)","Maximum eUpgrade allocation","Concierge service for Air Canada bookings","Maple Leaf Lounge access for member + 1 guest at all times (not just paid travel)"]}
  ]'::jsonb,
  lounge_access = 'Aeroplan members at the **50K tier or above** receive **Star Alliance Gold** status, which provides lounge access on all Star Alliance member airlines worldwide for the member plus one guest when traveling on a Star Alliance flight (regardless of cabin or fare).

Air Canada operates its own **Maple Leaf Lounge** network at major Canadian airports plus a handful of US gateway airports (LGA, YYZ-bound flights). Maple Leaf Lounge access rules:
- Aeroplan 50K and above: same-day Air Canada or Star Alliance flight required
- Aeroplan Super Elite: access at all times when traveling, including non-Air Canada paid travel (separate from same-day-flight rules)
- Star Alliance Gold members from any partner program (United Premier Gold, Lufthansa Senator, Singapore PPS, etc.) - same-day Star Alliance flight in any cabin

**Single-visit passes**: Maple Leaf Lounge day passes are sold to anyone with a same-day Air Canada or Star Alliance ticket (no Aeroplan status required); price varies by location, typically CA$50-80 per visit.

**Discounted-cabin exclusion**: Air Canada''s Basic fare class on transatlantic flights does not earn lounge access through co-brand cards or status; the same-day-flight requirement applies but Basic fares are excluded from some perks.',
  quirks = '- **No carrier-imposed (fuel) surcharges on any partner award.** Aeroplan eliminated YQ/YR surcharges in 2020 and they have not returned. This is one of the program''s headline advantages.
- **$39 CAD partner booking fee** on flight awards that include any partner-airline segment (waived on Air Canada-only itineraries).
- **5,000-point optional stopover** per direction. Only valid at points outside the US and Canada. Stopover = 24+ hours, up to 45 days. No open-jaw at the stopover point.
- **12-hour maximum layover** within the US and Canada (otherwise it counts as a stopover, which is not permitted in those countries).
- **Aeroplan Family Sharing** lets up to 8 family members combine points (relaunched 2025 after a 2023 suspension). Eligible relatives: spouses, partners, children, siblings, parents, grandparents. 6-month account requirement to join, 3-month minimum stay in a pool.
- **Earning shifted to spend-based on Air Canada flights effective January 1, 2026.** Members earn at least 1 Aeroplan point per CA$1 of base fare + carrier surcharges, with elite multipliers up to 6 points per CA$1 for Super Elite. Partner-flight earning remains distance-based.
- **Status earning uses Status Qualifying Credits (SQC)**, also new for 2026. Members can earn SQC through eligible flight purchases, Aeroplan credit card spending, and activity with the program''s travel and everyday partners.
- **Award chart updated June 1, 2026** - premium-cabin pricing rose on most transatlantic and transpacific routes by 5,000-15,000 points one-way. Intra-Americas pricing was unchanged.
- **Partner award pricing is a fixed value, not a range** (unlike Air Canada-operated flights which use a "starting from" dynamic-pricing model).
- **No close-in booking fee.** Award bookings within 21 days of departure carry no extra charge.
- **Marriott Bonvoy Gold automatic at 50K** - rare program-level reciprocal status with a hotel program.',
  award_chart = '## Aeroplan Flight Reward Chart (effective June 1, 2026)

Aeroplan uses a **distance-based chart** for partner-airline awards, with **fixed point values** per cabin per distance band. Air Canada-operated flights use a dynamic "starting from" floor that can price higher than the chart minimum based on demand.

**Carrier-imposed surcharges:** $0 on any award (Aeroplan eliminated YQ/YR in 2020).
**Partner booking fee:** $39 CAD on awards that include a non-Air Canada segment.
**Optional stopover:** 5,000 points (one per direction, only outside US/Canada).
**Close-in booking fee:** None.

### Within North America (unchanged)

| Distance band | Economy | Premium Economy | Business |
|---|---|---|---|
| 0-500 mi | 6,000 | n/a | 15,000 |
| 501-1,500 mi | 10,000 | n/a | 20,000 |
| 1,501-2,750 mi | 12,500 | 25,000 | 25,000-35,000 |
| 2,751+ mi | 20,000 | 35,000 | 40,000-60,000 |

### North America to Atlantic (Europe / Africa / Middle East)

| Distance band | Economy | Premium Economy | Business | First |
|---|---|---|---|---|
| 0-3,500 mi | 30,000 | 45,000 | 55,000 | 100,000-120,000 |
| 3,501-6,000 mi | 35,000 | 55,000 | 65,000 | 120,000 |
| 6,001-8,000 mi | 45,000 | 75,000 | 85,000 | 145,000 |
| 8,001+ mi | 70,000 | 90,000 | 110,000 | 165,000 |

### North America to Pacific (Asia / Oceania)

| Distance band | Economy | Premium Economy | Business | First |
|---|---|---|---|---|
| 0-7,500 mi | 35,000 | 55,000 | 75,000 | 100,000 |
| 7,501-11,000 mi | 50,000 | 80,000 | 102,500 | 130,000 |
| 11,001+ mi | 75,000 | 100,000 | 140,000 | 165,000 |

(Approximate values; consult the official Flight Reward Chart at aircanada.com for exact pricing per route.)

### Notable sweet spots
- **NYC-Toronto business class** (Air Canada): 25,000 points one-way
- **Eastern US to Western Europe business class** (Brussels, TAP, others): 60,000-65,000 points one-way
- **LAX-FRA business class** (Lufthansa): 70,000 points one-way
- **Vancouver-Tokyo business class** (Air Canada / ANA): 55,000 points one-way
- **US to Asia business class** (ANA / EVA / Singapore): 75,000 points short-haul, 102,500 points ultra-long-haul

### US co-brand card
**Chase Aeroplan World Elite Mastercard** ($95 annual fee, launched December 2021):
- 3 points per $1 on grocery, dining, and Air Canada purchases
- 1 point per $1 on all other purchases
- 75,000-point welcome bonus after $4,000 spend in 3 months (current limited-time offer; standard offers vary)
- First checked bag free for cardholder + up to 8 companions on Air Canada
- Pay Yourself Back: redeem points 1.25-1.5 cpp toward Air Canada purchases
- 25% bonus on Aeroplan partner award redemptions (US Chase Aeroplan cardholders)

(Canada has 11 separate Aeroplan-branded cards across TD, CIBC, and Amex - out of scope for this US-focused page.)',
  partner_chart_url = 'https://www.aircanada.com/content/dam/aircanada/loyalty-content/documents/flight-rewards-chart-en.pdf',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aeroplan';

-- Step 5.5 partner_redemptions seed (covers the major Star Alliance partners
-- US readers most often book through Aeroplan, plus Air Canada itself).
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'All Star Alliance partner routes (distance-banded)', 'fixed',
  'Aeroplan partner-award pricing is fixed by distance band (not a range). $39 CAD partner booking fee. $0 in carrier-imposed (fuel) surcharges since 2020. See partner_chart_url for the official Flight Reward Chart.',
  'HIGH', current_date, true, 'none'
from programs p, programs c
where p.slug = 'aeroplan' and c.slug in ('aeroplan','air-canada','united','lufthansa','swiss','austrian','sas','singapore_airlines','ana','eva','asiana','turkish','tap','avianca','copa','air-china','ethiopian','egyptair')
on conflict do nothing;
