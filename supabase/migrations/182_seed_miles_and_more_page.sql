-- Seed Lufthansa Miles & More full program page (Batch A #9).
--
-- Authored 2026-05-06. Sources: official miles-and-more.com pages (6/6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel publications.
--
-- Major 2024-2026 events baked into the page:
--   - November 2024: Allegris First Class debuts (3 enclosed suites + double-
--     cabin "Suite Plus" on A350-900); initially MUC-India, expanded to
--     MUC-JFK, MUC-ORD, MUC-SFO, etc. through 2025-2026.
--   - June 3, 2025: MAJOR program change. Dynamic pricing introduced for LH /
--     SWISS / Austrian / LH City Airlines flights. Fixed partner chart
--     simultaneously devalued (premium cabins).
--   - Throughout 2026: Allegris expands to FRA hub via 787-9 + 747-8 retrofits;
--     A350-1000 deliveries begin.
--
-- Lean Path-2 shape: structural overview in award_chart + sweet-spot narrative
-- + link to official chart. Tool-shaped data lives in partner_redemptions.

update programs set
  alliance = 'star_alliance',
  hubs = array['FRA','MUC'],
  intro = 'Lufthansa Miles & More is the loyalty program of Lufthansa Group - the **largest frequent flyer program in Europe** with 30+ million members. Miles & More is the unified loyalty program across Lufthansa, SWISS, Austrian Airlines, Brussels Airlines, Eurowings, Discover Airlines, Air Dolomiti, and Edelweiss Air. It''s also used as the FFP for several non-Group co-issuing carriers - LOT Polish Airlines, Luxair, Croatia Airlines, and ITA Airways (added 2024). Lufthansa is a founding Star Alliance member and operates from Frankfurt (FRA) and Munich (MUC).

For US-based readers, Miles & More has two defining structural challenges that matter more than any individual sweet spot: **almost no US transfer partners** and **very heavy fuel surcharges** on award redemptions.

**Transfer partner access:** Chase, Amex, Citi, Capital One, and Bilt all do NOT transfer to Miles & More. The only widely accessible US transfer path is **Marriott Bonvoy at 3:1** (+5K bonus per 60K transferred) - a poor effective rate. The primary US accumulation path is the **Barclays Miles & More World Elite Mastercard** ($89 AF, 2x M&M partner airline tickets / 1x other).

**Fuel surcharges:** Lufthansa Group imposes some of the highest carrier-imposed surcharges in the industry. A round-trip transatlantic Business Class award can carry $500-900+ in YQ on top of the miles. First Class surcharges run higher. For most US-based readers, the practical move is to redeem **other Star Alliance currencies** (Aeroplan, Turkish Miles&Smiles, Avianca LifeMiles, United MileagePlus) **on Lufthansa Group metal** - then keep Miles & More as a flying-credit destination if you specifically fly LH Group often.

The aspirational redemption is **Lufthansa First Class on the new Allegris suite** (A350-900) - 3 enclosed suites including the "Suite Plus" double cabin with lockable door. Combined with the legendary **First Class Terminal at FRA** (private security, gourmet dining, chauffeured Porsche/Mercedes transfer to aircraft), it''s one of aviation''s top experiences. Available to redeem from M&M and via Aeroplan / United / others on partner award charts.',
  transfer_partners = '[
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K M&M miles (5K bonus on every 60K block). The only widely accessible US transfer path. Generally only useful as a top-up to reach a specific redemption.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Star Alliance partner award flights** at fixed chart rates. Europe-NA Y 50K / J 125K / F 215K one-way. NA-Far East Y 75K / J 170K / F 260K. The fixed chart still applies on partner metal - dynamic pricing only affects LH Group operating flights.
- **Lufthansa Group operating flights** at dynamic pricing (effective June 3, 2025). Costs shown at booking; vary by route, demand, date.
- **Lufthansa First Class (Allegris)** is the program''s flagship redemption. Six suites/cabin on legacy 747-8 / A340-600 plus the new 3-suite A350-900 Allegris layout (including the double Suite Plus). Combined with the FRA First Class Terminal, an aspirational bucket-list use case.
- **Mileage Bargains** - rotating monthly promotional awards with up to 50% mileage discount on select routes. RT transatlantic Economy from 25,000 / Premium Economy from 42,000 / Business from 61,000 miles. Non-refundable / non-changeable. Availability has decreased post-June-2025.
- **Upgrade awards** on LH Group flights - one-cabin upgrades; Senator eVouchers can also be used.
- **Mileage pooling** - family / friends pool miles into a shared account to reach award thresholds.',
  sweet_spots = '- **Lufthansa First Class via Mileage Bargains** when promotional routes hit your itinerary - up to 50% discount on the published partner-chart equivalent. The most realistic path to LH First on M&M for non-flying earners.
- **Lufthansa Allegris Suite Plus on A350-900** is the premier hard product - lockable door, double-cabin convertible bed, 42" TV, personal wardrobe. As of 2026 available on MUC-JFK, MUC-ORD, MUC-SFO, MUC-Bengaluru, and select other routes.
- **First Class Terminal at FRA** is the sweet spot you can''t price - private security, gourmet restaurant, cigar lounge, bath and shower facilities, chauffeured Porsche/Mercedes transfer directly to the aircraft on the tarmac. Available to First Class passengers and HON Circle members regardless of how the ticket was redeemed.
- **Star Alliance partner chart still applies** for non-LH Group metal - so booking United, ANA, Singapore, Avianca, Turkish, etc. through M&M uses fixed chart rates rather than dynamic pricing.
- **Senator eVouchers** for upgrades (2 per qualification/renewal year for Senator status holders).
- **Convert credit card miles to status currency** - the Barclays Miles & More US co-brand allows converting 5K-25K Award Miles into Points + Qualifying Points once per year toward elite qualification.',
  tier_benefits = '[
    {"name":"Member (base)","qualification":"Free enrollment.","benefits":["Earn Award Miles + Points + Qualifying Points on flights","Access to Mileage Bargains promotions","Member-only offers"]},
    {"name":"Frequent Traveller (FTL)","qualification":"650 Points + 325 Qualifying Points in a calendar year. Continental Economy = 20 Points / Continental Business = 40 / Intercontinental Economy = 60 / Intercontinental Business = 200 / Intercontinental First = 300.","benefits":["Star Alliance Silver","Business Class check-in on LH Group flights","Business Lounge access when flying eligible carriers","Priority standby","Extra checked baggage allowance","Award miles do not expire during status"]},
    {"name":"Senator (SEN)","qualification":"2,000 Points + 1,000 Qualifying Points in a calendar year.","benefits":["All FTL benefits","Star Alliance Gold (lounge access on all Star Alliance partners worldwide for member + 1 guest, any cabin)","Senator Lounge access","2 eVouchers for upgrades at qualification / renewal","Executive Bonus on award miles","Priority boarding and baggage"]},
    {"name":"HON Circle Member","qualification":"6,000 HON Circle Points (Business/First only) in two consecutive calendar years on LH Group + co-issuing partners. Approximately 30 intercontinental Business Class round-trips / year.","benefits":["All Senator benefits","First Class Lounge access","Access to the First Class Terminal at FRA (chauffeured tarmac transfers, gourmet dining, cigar lounge, bath suites)","Personal assistant","Guaranteed booking on all LH Group flights within 48 hours","Top-tier exclusivity - one of aviation''s most restrictive elite tiers"]}
  ]'::jsonb,
  lounge_access = 'Lufthansa operates an extensive lounge network at FRA, MUC, and major international gateways. The **First Class Terminal at FRA** is the most exclusive - a separate, standalone terminal for First Class passengers and HON Circle members with private security, gourmet a-la-carte dining, cigar lounge, bath/shower facilities, and chauffeured Porsche/Mercedes transfer directly to the aircraft.

Access rules:
- **Same-day LH Group / Star Alliance flight + Star Alliance Gold (Senator / HON Circle)** - Lufthansa Senator Lounge / Star Alliance Gold lounges worldwide for member + 1 guest, any cabin.
- **HON Circle members** - First Class Lounges + First Class Terminal at FRA, regardless of ticket cabin.
- **Same-day LH Group First Class boarding pass at FRA** - First Class Terminal access.
- **Same-day LH Group / Star Alliance flight + Star Alliance Silver (FTL)** - Business Lounges on partner flights only when traveling on eligible carriers; LH-operated lounges accessible only with Star Gold or premium-cabin boarding pass.
- **Same-day LH Group Business Class boarding pass** - Business Lounges in any cabin-paid context.

The Barclays Miles & More World Elite Mastercard provides **2 Lufthansa Business Lounge vouchers per year** as a card benefit (no status required).',
  quirks = '- **Award miles expire 36 months after the calendar quarter they are credited** (at the end of the following quarter). NO extension via low-value activity (shopping portal transactions don''t reset the clock).
- **Status preserves miles**: while you hold Frequent Traveller, Senator, or HON Circle, miles do not expire.
- **Barclays Miles & More World Elite Mastercard preserves miles**: hold the card for 3+ months and make at least one transaction per month.
- **June 3, 2025 dynamic pricing** introduced for award flights on Lufthansa, Lufthansa City Airlines, SWISS, and Austrian Airlines. Star Alliance partners + non-LH Group M&M co-issuing partners still use the fixed chart.
- **Fixed partner award chart was simultaneously devalued June 2025** (premium cabins notably).
- **HEAVY fuel surcharges (YQ)** on Lufthansa Group award redemptions - $500-900+ per round-trip transatlantic Business Class, more for First. The biggest practical drawback for US-based redeemers.
- **Limited US transfer partner access**: Marriott Bonvoy 3:1 is the only widely accessible US path. NO Chase / Amex / Citi / Capital One / Bilt direct transfers. The Barclays Miles & More US card is the primary non-flying earn route.
- **Status validity**: qualifying year + entire following calendar year + January-February of the year after that. Earning in November 2025 grants status through February 28, 2027.
- **Stopover / open-jaw**: generally not permitted on standard awards; some Mileage Bargains offer limited stopover options.
- **HON Circle is one of aviation''s most restrictive elite tiers**: 6,000 HON Circle Points (Business/First only) in two consecutive calendar years - approximately 30 intercontinental Business round-trips per year on LH Group metal.
- **Mileage pooling** allows family / friends to share miles into a shared account.
- **Booking window**: 360 days in advance for LH Group flights.',
  award_chart = '## Lufthansa Miles & More redemption structure

Two parallel pricing models since June 3, 2025:

| Model | Routes | Pricing |
|---|---|---|
| **LH Group Dynamic Pricing** | Lufthansa, SWISS, Austrian Airlines, Lufthansa City Airlines | Variable; shown at booking. Fluctuates by demand / route / date. |
| **Fixed Partner Award Chart** | Star Alliance + co-issuing partners (LOT, Luxair, Croatia, ITA, etc.) | Distance / region-based fixed rates (table below) |

**Carrier-imposed surcharges (YQ):** HEAVY on LH Group metal. $500-900+ per round-trip transatlantic Business; more for First. This is the program''s defining drawback. Star Alliance partner-chart redemptions on non-LH metal generally have lower or no YQ depending on the operating partner.

### Star Alliance partner award chart (post-June 2025; one-way)

| Route | Economy | Prem Econ | Business | First |
|---|---|---|---|---|
| Within Europe | 28,000 | n/a | 50,000 | n/a |
| Europe ↔ Middle East / N. Africa | 42,000 | 55,000 | 75,000 | 140,000 |
| Within North America | 35,000 | n/a | 60,000 | 80,000 |
| North America ↔ Hawaii | 45,000 | n/a | 75,000 | 135,000 |
| Europe ↔ North America | 50,000 | 85,000 | 125,000 | 215,000 |
| North America ↔ South America | 50,000 | n/a | 125,000 | 215,000 |
| North America ↔ Far East / Central Asia | 75,000 | n/a | 170,000 | 260,000 |
| North America ↔ Southeast Asia | 95,000 | n/a | 215,000 | 330,000 |

(Approximate; consult miles-and-more.com for exact pricing per route.)

### LH Group dynamic pricing
Award costs are shown at time of booking. Compare against the partner-chart equivalent on Star Alliance partners before redeeming - same flight may be cheaper booked through a different Star Alliance program (Aeroplan, Turkish, United, Avianca LifeMiles).

### Mileage Bargains
Monthly rotating promotional awards with up to 50% mileage discount on select routes. Round-trip transatlantic Economy from **25,000** miles / Premium Economy from **42,000** miles / Business from **61,000** miles. Non-refundable / non-changeable. Availability has decreased post-June-2025.

### Status earning (Points per segment)

| Route Type | Economy | Premium Econ | Business | First |
|---|---|---|---|---|
| Continental | 20 | 20 | 40 | 40 |
| Intercontinental | 60 | 80 | 200 | 300 |

(Points = Qualifying Points = HON Circle Points by value. Qualifying Points earned only on LH Group + co-issuing partners. HON Circle Points earned only on Business/First on those carriers.)

### US co-brand card
**Barclays Miles & More World Elite Mastercard** ($89 AF, primary US non-flying earn path):
- 2x miles on M&M partner airline tickets; 1x on all other purchases
- Welcome offer up to 70,000 miles (60K after $3,000 spend + AF in 90 days; tiered)
- 2 Lufthansa Business Lounge vouchers per year
- Annual companion ticket (taxes/fees apply)
- No foreign transaction fees
- Convert 5K-25K miles to Points + Qualifying Points once per year for status qualification
- Miles do not expire while card is active (held 3+ months + 1 transaction/month)

### Practical strategy for US readers
For most US-based redeemers, **booking Lufthansa Group flights via other Star Alliance currencies often beats redeeming M&M directly** due to the heavy YQ pass-through. Specifically:
- **Aeroplan** (Amex / Chase / Cap One / Bilt 1:1 → Star Alliance partner chart with NO surcharges since 2020)
- **Turkish Miles&Smiles** (Citi / Cap One / Bilt 1:1 → low partner-chart pricing, though some YQ)
- **Avianca LifeMiles** (Amex / Cap One / Citi → low surcharges on Star Alliance partners)
- **United MileagePlus** (Chase / Bilt → no surcharges on UA metal; some on partners)

Reserve Miles & More miles for **Mileage Bargains promotions** and **upgrade awards** where the value equation is best.',
  partner_chart_url = 'https://www.miles-and-more.com/us/en/spend/flights.html',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'miles-and-more';

-- Step 5.5 partner_redemptions: Star Alliance + LH Group + co-issuing partners
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'Star Alliance + co-issuing partner awards (fixed chart)', 'fixed',
  'M&M partner award chart is fixed (post-June 2025 devaluation). Star Alliance partners + LOT / Luxair / Croatia / ITA Airways. Most partner metal has lower YQ than LH Group metal. Practical move for US readers: book Lufthansa Group flights via other Star Alliance currencies (Aeroplan, Turkish, Avianca LifeMiles) to avoid LH heavy YQ.',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'miles-and-more' and c.slug in ('miles-and-more','lufthansa','united','swiss','austrian','sas','singapore_airlines','ana','eva','asiana','turkish','tap','avianca','copa','air-china','ethiopian','egyptair')
on conflict do nothing;

-- LH Group dynamic-pricing row (separate to capture YQ + dynamic pricing)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'Lufthansa Group operating flights (dynamic pricing since June 2025)', 'dynamic',
  'LH / SWISS / Austrian / LH City Airlines on dynamic pricing as of June 3, 2025. Pricing shown at booking; varies by demand / route / date. HEAVY YQ pass-through ($500-900+ per round-trip transatlantic Business; more for First). Compare against Aeroplan / Turkish / Avianca LifeMiles before redeeming - often cheaper to book the same flight via another Star Alliance program.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'miles-and-more' and c.slug = 'lufthansa'
on conflict do nothing;
