-- Seed Virgin Atlantic Flying Club full program page (Batch A #12, FINAL).
--
-- Authored 2026-05-06. Sources: official virginatlantic.com pages (6/6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel pubs.
--
-- Virgin Atlantic joined SkyTeam in March 2023 - first/only UK SkyTeam member.
-- Delta owns 49% of VS; one of the deepest transatlantic JVs in aviation.
--
-- Major October 2024 program reset:
--   - Dynamic award pricing introduced on VS-operated metal
--   - Saver Reward Seats: 12 guaranteed per flight (8 Y, 2 PE, 2 Upper Class)
--     at fixed lower prices on off-peak dates
--
-- Marquee sweet spots remain ANA First "The Suite" (US-Japan) and Delta One
-- (US-Europe at 50K Virgin Points one-way, often beating SkyMiles).

update programs set
  alliance = 'skyteam',
  hubs = array['LHR','MAN'],
  intro = 'Virgin Atlantic Flying Club is the loyalty program of Virgin Atlantic, founded by Sir Richard Branson in 1984 and the **first and only UK-based SkyTeam member airline** since joining the alliance in March 2023. Delta Air Lines owns 49% of Virgin Atlantic, making the Delta-VS partnership one of the deepest airline joint ventures in transatlantic aviation. Virgin Atlantic operates from London Heathrow Terminal 3 with a secondary base at Manchester (MAN), and a fleet of 43 wide-body aircraft (A350-1000, 787-9, A330-900neo, A330-300).

For US-based readers, Flying Club is **the most-transferable airline currency in this batch**. Virgin Points transfer 1:1 from Amex Membership Rewards, Chase Ultimate Rewards, Capital One Miles, Citi ThankYou (premium cards), Bilt Rewards, and Wells Fargo Autograph Journey - **six confirmed direct US transfer partners**. (Some aggregators list US Bank Altitude Reserve and Bank of America Premium Rewards; neither is independently verified by Virgin Atlantic''s own partner page as of May 2026 - same Award Travel Finder data error that affected BA Avios and Iberia. Treat them as not viable until proven otherwise.)

Two redemption sweet spots define the program. **ANA First Class "The Suite" US-Japan at 72,500-85,000 Virgin Points one-way** (East Coast 85K) is widely cited as one of the highest-value redemptions in any loyalty program - cash equivalents exceed $10,000 and Virgin Atlantic charges no fuel surcharges on ANA awards. **Delta One US-Europe at 50,000 Virgin Points one-way** typically beats Delta SkyMiles dynamic pricing on the same flight, often by a wide margin.

October 2024 brought a major program reset. Virgin Atlantic moved its own metal to dynamic pricing, replacing the old fixed VS award chart. Simultaneously introduced **Saver Reward Seats** - 12 guaranteed seats per flight (8 Economy, 2 Premium, 2 Upper Class) at fixed lower prices on off-peak dates. ANA and Delta partner award charts remain fixed.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax. Periodic 25-30% transfer bonuses (~3-4x per year). Cards: Platinum, Gold, Green, Business Platinum, Business Gold.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"Direct 1:1, near-instant. Periodic transfer bonuses common. Premier transfer destination for Sapphire Reserve / Sapphire Preferred / Ink Business Preferred holders.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"Direct 1:1 (1-2 business days). Cards: Venture X, Venture, Spark Miles. Confirmed via Virgin Red ecosystem.","bonus_active":false},
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"Direct 1:1 with premium ThankYou cards (Strata Premier, Strata Elite, Prestige). 1:0.7 with no-AF Citi cards.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"Direct 1:1, instant to 48 hours. Rent Day 2x bonuses periodically.","bonus_active":false},
    {"from_slug":"wells-fargo-rewards","ratio":"1:1","notes":"Added 2026 via Wells Fargo Autograph Journey. 1-2 business days. No minimum transfer amount.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Virgin Points (5K bonus on every 60K block). Typical hotel-to-airline ratio.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **ANA First Class "The Suite" US-Japan** at 72,500 (West Coast) / 85,000 (Central + East Coast) Virgin Points one-way. The marquee aspirational redemption with NO fuel surcharges. One-way bookings allowed (unlike ANA''s own program which requires round-trip).
- **ANA Business Class "The Room" US-Japan** at 52,500 (West Coast) / 60,000 (Central + East Coast) Virgin Points one-way. Outstanding value on ANA''s flagship Business product.
- **VS Upper Class US-London via Saver Reward Seats** from 29,000 Virgin Points one-way (East Coast off-peak). Lie-flat suite + onboard bar. Saver inventory guaranteed at 2 seats per flight.
- **Delta One US-Europe at 50,000 Virgin Points** one-way. Frequently beats Delta SkyMiles dynamic pricing on the same flight.
- **Delta US domestic** from 5,000 Virgin Points one-way. Short-haul positioning at low cost.
- **VS Premium / Economy via Saver seats** - Premium from 10,500-12,500 Virgin Points; Economy from 6,000-7,500.
- **Other SkyTeam partners** (Air France, KLM, Korean Air, Aeromexico, Vietnam, China Eastern) - earn + redeem.
- **Non-alliance partners** with VS chart pricing: ANA (no surcharges), Air New Zealand, Virgin Australia, South African Airways, Singapore Airlines (verify), WestJet (added 2025-2026).',
  sweet_spots = '- **ANA First Class "The Suite" US-Japan at 72,500-85,000 Virgin Points one-way + NO fuel surcharges.** Cash equivalents exceed $10,000. This is widely cited as one of the highest-value redemptions in any loyalty program, period. Despite two ANA chart devaluations in two years, it remains exceptional.
- **ANA Business "The Room" at 52,500-60,000 Virgin Points one-way** with no surcharges. ANA''s Business cabin is among the world''s best Business products.
- **VS Upper Class Saver from 29,000 Virgin Points one-way** (East Coast off-peak) is a standout transatlantic Business redemption. Saver seats are guaranteed (2 per flight) on every VS flight.
- **Delta One US-Europe at 50,000 Virgin Points** consistently undercuts Delta SkyMiles dynamic pricing on the same flight, often by 30-60%.
- **Delta domestic at 5,000 Virgin Points** for short hops is one of the cheapest domestic Business class redemptions in any SkyTeam-accessible program.
- **Periodic 25-30% transfer bonuses from Amex** (3-4x per year) effectively reduce ANA First East Coast from 85K to ~65K base credit-card points. Time large transfers to bonus windows.
- **6 direct US transfer partners + 1:1 ratios across the board** - no other airline currency aggregates points across the Amex / Chase / Capital One / Citi / Bilt / Wells Fargo ecosystem this completely.
- **Household account pools Virgin Points among up to 9 members** - excellent for family / group redemptions.',
  tier_benefits = '[
    {"name":"Red","qualification":"Free auto-enrollment.","benefits":["Earn Virgin Points on VS + partner flights","Virgin Points NEVER expire","Household account: pool points with up to 9 members","Access to Virgin Red rewards ecosystem (lifestyle redemptions beyond flights)"]},
    {"name":"Silver","qualification":"400 Tier Points in a membership year (a single VS US-London Upper Class round-trip qualifies)","benefits":["SkyTeam Elite (Star Alliance Silver-equivalent)","Priority check-in and boarding","Extra checked baggage","Bonus Virgin Points earning","Priority waitlist + standby","Preferred seating (Economy Delight)","SkyTeam Elite benefits across alliance"]},
    {"name":"Gold","qualification":"1,000 Tier Points in a membership year","benefits":["SkyTeam Elite Plus","Virgin Atlantic Clubhouse lounge access (incl. 1 guest)","SkyTeam lounge access worldwide","Upper Class check-in for all cabins","Guaranteed Reward Seat (Gold-only inventory beyond Saver)","Highest bonus Virgin Points earning","Complimentary upgrades when available","Extra baggage allowance","Priority baggage handling","Delta Sky Club access when flying Delta"]}
  ]'::jsonb,
  lounge_access = 'Virgin Atlantic operates the **Clubhouse** lounge network at LHR T3, MAN, JFK T4, BOS, and select international gateways. The LHR Clubhouse is a Virgin signature property - cocktail bar, hair salon, deli, and whisky tasting alcove.

Access rules:
- **Same-day VS / SkyTeam flight + SkyTeam Elite Plus (Gold)** - Clubhouse / SkyTeam lounges worldwide for member + 1 guest, any cabin.
- **Same-day VS / SkyTeam flight + SkyTeam Elite (Silver)** - SkyTeam Business lounges on partner carriers.
- **Same-day VS Upper Class boarding pass** - Clubhouse access in any context.
- **Same-day VS Premium boarding pass** - paid Clubhouse upgrade may be available.
- **Same-day Economy / Premium without status** - no Clubhouse access.
- **Flying Club Gold flying Delta** - Delta Sky Club access via SkyTeam Elite Plus reciprocity.

Virgin Atlantic does not generally sell Clubhouse day passes to non-status passengers. Access is by status or premium cabin only.',
  quirks = '- **Virgin Points NEVER EXPIRE** at any tier. One of the few major airline programs with no expiry policy whatsoever. Hold a balance indefinitely.
- **Household account pools Virgin Points among up to 9 members** - more generous than most household pooling features. Excellent for family / group redemptions.
- **Saver Reward Seats** (introduced October 2024): 12 guaranteed seats per VS flight (8 Economy, 2 Premium, 2 Upper Class) at fixed lower prices on off-peak dates. Beyond Saver inventory, VS metal moves to dynamic pricing.
- **NO fuel surcharges on ANA partner awards**. NO fuel surcharges on Delta partner awards. Moderate surcharges on VS-operated metal awards.
- **ANA partner award chart is fixed** - distance/region-based, one-way bookings allowed (unlike ANA''s own program which requires round-trip for partner awards).
- **Delta-Virgin JV gives Flying Club members reciprocal benefits** - Tier Points earnable on eligible Delta flights, Virgin Points redeemable on Delta metal at fixed chart rates.
- **6 direct US transfer partners at 1:1** is the most-connected airline currency for US credit card holders. Wells Fargo Autograph Journey added in 2026.
- **Virgin Points reach Virgin Red lifestyle ecosystem** - redeem for events, experiences, hotel stays, gift cards beyond flights.
- **High Five loyalty reward** (launched 2025-2026): fly VS in any 5 different years to earn 12,000 bonus Virgin Points + 10% bonus earning on all future flights at Red status.
- **Award change/cancellation fees increased 2025** - check current fee schedule before booking. Verify at virginatlantic.com.
- **Some aggregators list US Bank Altitude Reserve and Bank of America Premium Rewards as 1:1 transfer partners** to Virgin Atlantic. Neither has been independently verified by Virgin Atlantic''s official partner page. Same Award Travel Finder data error that affected BA Avios and Iberia. Do not rely on these until proven otherwise.',
  award_chart = '## Virgin Atlantic Flying Club redemption structure

Virgin Atlantic uses **two parallel pricing models**:

| Model | Routes | Pricing |
|---|---|---|
| **Dynamic Pricing on VS Metal** | Virgin Atlantic-operated flights | Variable; shown at booking. Fluctuates by demand / route / date. |
| **Fixed Saver Reward Seats** | Same VS-operated flights | 12 guaranteed seats per flight at fixed lower prices on off-peak dates: 8 Economy + 2 Premium + 2 Upper Class. |
| **Fixed Partner Award Charts** | ANA, Delta, other SkyTeam + non-alliance | Region/distance-based fixed rates |

**Carrier-imposed surcharges (YQ):** Moderate on VS metal. **NONE on ANA partner awards. NONE on Delta partner awards.** Other SkyTeam partner surcharges vary - generally low.

### VS-operated flights (Saver-Peak range, one-way)

| Route | Economy (Saver-Peak) | Premium (Saver-Peak) | Upper Class (Saver-Peak) |
|---|---|---|---|
| US East Coast - London | 6,000 - 25,000 | 10,500 - 57,500 | 29,000 - 87,500 |
| US West Coast - London | 7,500 - 30,000 | 12,500 - 65,000 | 32,500 - 100,000 |
| US - Caribbean | 7,500 - 30,000 | 12,500 - 60,000 | n/a |
| London - India (DEL/BOM) | 10,000 - 35,000 | 20,000 - 75,000 | 37,500 - 120,000 |

### ANA Partner Award Chart (fixed, one-way) - the marquee sweet spot

| Route (to/from Japan) | Economy | Business | First |
|---|---|---|---|
| Hawaii (HNL) | 22,500 | 37,500 | 57,500 |
| West Coast (LAX/SFO/SEA/YVR) | 30,000 | 52,500 | 72,500 |
| Central/East Coast (JFK/ORD/IAH/IAD) | 32,500 | 60,000 | 85,000 |

**One-way bookings allowed** - unlike ANA''s own Mileage Club which requires round-trip for partner awards. NO fuel surcharges.

### Delta Partner Awards (fixed, one-way)

| Route | Economy | Delta One (Business) |
|---|---|---|
| US Domestic | 5,000-12,500 | n/a |
| US - Europe | 22,500-30,000 | 50,000 |

### Earning rates on VS metal (% of distance)
- Economy Light (T, L): 25%
- Economy Classic (N, Q, O, V, E): 50%-100%
- Economy Delight (Y, B, M, H): 150%
- Premium Standard (H, K): 100%
- Premium Flexible (W, S): 200%
- Upper Class Standard (I, Z): 200%
- Upper Class Flexible (J, C, D): 400%
- Reward Flights (G, P, A): Tier Points only on full-points bookings

Silver and Gold members earn bonus Virgin Points on top of these rates.

### What does NOT transfer to Flying Club (verified)
- All major US transferable currencies DO transfer (Amex, Chase, Capital One, Citi premium, Bilt, Wells Fargo Autograph Journey).
- US Bank Altitude Reserve and Bank of America Premium Rewards are listed by some aggregators but have NOT been independently verified.

### No US co-brand card
Virgin Atlantic does not have a US-issued co-brand credit card as of May 2026. Reach Virgin Points via flexible-currency transfer from any of the 6 confirmed partners.

**Official redemption page:** https://www.virginatlantic.com/us/en/flying-club/spend-miles.html',
  partner_chart_url = 'https://www.virginatlantic.com/us/en/flying-club/spend-miles.html',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'virgin-atlantic';

-- Step 5.5 partner_redemptions
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'SkyTeam + ANA + non-alliance partner awards (fixed chart)', 'fixed',
  'Virgin Atlantic uses fixed partner award charts for ANA, Delta, and SkyTeam partners. ANA partner chart: West Coast US-Japan First 72.5K / Business 52.5K / Economy 30K Virgin Points one-way; Central+East Coast 85K / 60K / 32.5K. NO fuel surcharges on ANA or Delta partner awards. Delta One US-Europe 50K Virgin Points one-way often beats SkyMiles. ANA partner allows one-way bookings (unlike ANA Mileage Club which requires round-trip).',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'virgin-atlantic' and c.slug in ('virgin-atlantic','delta','klm','flying-blue','korean','aeromexico','china_eastern','vietnam','ana','singapore_airlines','jal','aa','aer_lingus')
on conflict do nothing;

-- VS-operated awards (dynamic + Saver guaranteed)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Business', 'Virgin Atlantic-operated flights (Saver + dynamic since Oct 2024)',
  'hybrid',
  'VS-operated awards use dynamic pricing (introduced October 2024) PLUS Saver Reward Seats: 12 guaranteed per flight at fixed lower prices (8 Economy, 2 Premium, 2 Upper Class) on off-peak dates. East Coast-London Upper Class Saver from 29K Virgin Points one-way. Moderate fuel surcharges on VS metal awards.',
  'HIGH', current_date, true, 'low'
from programs p where p.slug = 'virgin-atlantic'
on conflict do nothing;
