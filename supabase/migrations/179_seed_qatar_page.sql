-- Seed Qatar Airways Privilege Club full program page (Batch A #6).
--
-- Authored 2026-05-06. Sources: official qatarairways.com pages (6/6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel publications
-- (The Points Guy, AwardFares, point.me, Upgraded Points, NerdWallet).
--
-- Privilege Club uses Avios since November 2022 rebrand. Distinct from BA's
-- Avios in two key strategic ways:
--   1. Transfer-partner-uniqueness: Citi ThankYou transfers DIRECTLY to QR
--      Avios but NOT to BA Avios. This makes QR the entry point for Citi
--      points into the Avios family.
--   2. Partner-network-uniqueness: QR can book JetBlue, Bangkok Airways,
--      LATAM, Virgin Australia, RwandAir, MEA, Gol — none of which are
--      bookable via BA Avios.
--
-- Major 2024-2026 events:
--   - November 2022: Avios rebrand from Qmiles
--   - October 2025: Capital One Miles became a 1:1 QR transfer partner
--   - Mid-2025: Privilege Club Pro paid subscription launched
--   - Late 2025: Hamad International (DOH) Concourses D & E opened

update programs set
  alliance = 'oneworld',
  hubs = array['DOH'],
  intro = 'Qatar Airways Privilege Club is the loyalty program of Qatar Airways, a oneworld member operating from Hamad International (DOH) and the home of **Qsuite** - the closing-door, double-bed Business class product widely cited as the world''s best Business cabin. Privilege Club uses **Avios** as its currency since the November 2022 rebrand from Qmiles, sharing the currency 1:1 with British Airways Club, Iberia Plus, Aer Lingus AerClub, and Finnair Plus.

For US-based readers, Qatar Privilege Club has two unique strategic advantages over the rest of the Avios family. **First: Citi ThankYou transfers directly to QR Avios at 1:1 - and to no other Avios program.** That makes QR the only on-ramp for Citi points into the Avios ecosystem (you can then Combine My Avios from QR to BA, Iberia, etc.). **Second: QR books non-alliance partners no other Avios program can** - JetBlue, Bangkok Airways, LATAM, Virgin Australia, RwandAir, MEA, and Gol are all on the QR redemption chart but invisible to BA Avios.

Qatar runs zero carrier-imposed surcharges on its own award flights. US-Doha Qsuite at approximately 70,000 Avios one-way off-peak with $30-80 in taxes/fees is one of the highest-value premium-cabin redemptions in the points world. Avios expire 36 months from the last earning or spending activity.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax pass-through. Primary US transfer source for QR.","bonus_active":false},
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"Citi''s ONLY direct Avios partner. Citi does not transfer to BA, Iberia, Aer Lingus, or Finnair directly - QR is the entry point. Periodic Citi -> QR transfer bonuses up to 40% are common.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"Added October 2025 as a direct 1:1 QR transfer partner.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"Direct 1:1. Rent Day 2x bonuses periodically.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"Indirect: Chase -> BA Avios direct (1:1), then Combine My Avios BA -> QR (1:1). Adds one step but the full UR -> QR pipeline works.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Avios in the Avios family (with 5K bonus on every 60K block). Routes via BA Avios first, then Combine My Avios to QR.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Qsuite Business class US-Doha** at approximately 70,000 Avios one-way off-peak. The headline use case. Plus only $30-80 in taxes/fees - QR does not pass through fuel surcharges on its own metal.
- **Qsuite onward to South Asia / Maldives / East Africa via Doha** at 100,000-130,000 Avios one-way off-peak. Doha free stopover available on connecting awards.
- **AA short-haul redemptions** in North America priced on the distance-banded partner chart - similar pricing to BA''s short-haul awards but without BA''s fuel-surcharge baggage.
- **JetBlue**, **Bangkok Airways**, **LATAM**, **Virgin Australia**, **RwandAir**, **MEA** - non-alliance partners exclusive to QR within the Avios family. JetBlue for US/Caribbean. Bangkok Airways is the only Avios path to Koh Samui (USM), Sukhothai, Luang Prabang. LATAM covers intra-South America. Virgin Australia covers domestic Australia.
- **Award bookings 355-361 days in advance** - one of the longest booking windows in the industry; useful for locking in Qsuite scarcity.
- **Combine My Avios** to / from BA, Iberia, Aer Lingus, and Finnair (instant, free, 1:1).',
  sweet_spots = '- **Qsuite US-Doha at ~70,000 Avios one-way off-peak** with minimal cash. At Qsuite''s ~$5,000 cash equivalent, that''s ~6-7 cents per Avios in value - one of the best premium-cabin redemptions in any program.
- **Free Doha stopover on connecting awards** - explore Qatar''s museums, the Pearl, desert excursions at no extra Avios cost. Pairs well with US -> Asia / Africa routings.
- **Citi ThankYou -> Qatar Avios** is the cleanest path for Citi points into the Avios family. Periodic 40% transfer bonuses make it even more attractive. Watch for promotional windows.
- **AA West Coast-Hawaii** at approximately 16,000 Qatar Avios one-way Economy - cheaper than Alaska''s own program for the same routing.
- **Bangkok Airways awards on QR Avios** - the only way to reach Koh Samui, Sukhothai, or Luang Prabang on Avios. Pair with a Bangkok Airways segment to round out a Southeast Asia trip.
- **JetBlue awards via QR** - JetBlue is in QR''s partner network but not BA''s. JetBlue mint at modest Avios cost is a real sweet spot.
- **No fuel surcharges on QR-operated metal** + minimal US taxes / fees - the surcharge-free advantage stacks with the Qsuite product to make this redemption mathematically dominant for premium-cabin transatlantic travel via Doha.',
  tier_benefits = '[
    {"name":"Burgundy","qualification":"Free auto-enrollment. No Qpoints threshold.","benefits":["Earn Avios at base rate (distance + booking class)","Avios validity 36 months from last activity","10% seat selection discount","Combine My Avios access"]},
    {"name":"Silver","qualification":"150 Qpoints in 12 months (135 to retain in 12 months OR 270 in 24 months). At least 20% of Qpoints from QR-operated flights (or 4 QR sectors in 12 months / 8 in 24).","benefits":["oneworld Ruby","25% Avios tier bonus on flights","Priority airport check-in / boarding / standby","QR Business Lounge access (member only)","+15 kg or 1 piece extra checked baggage","20% seat selection discount"]},
    {"name":"Gold","qualification":"300 Qpoints in 12 months (270 to retain in 12 months OR 540 in 24 months)","benefits":["oneworld Sapphire","75% Avios tier bonus","QR Business Lounge access for member + 1 guest","+20 kg or 1 piece extra checked baggage","40 Qcredits per year (for upgrades / baggage)","Free preferred seat selection","Al Maha Meet & Assist (conditions apply)"]},
    {"name":"Platinum","qualification":"600 Qpoints in 12 months (540 to retain in 12 months OR 1,080 in 24 months)","benefits":["oneworld Emerald","100% Avios tier bonus","QR First / Business Lounge access for member + 1 guest","Complimentary upgrade eligibility","60 Qcredits per year","+30 kg or 2 pieces extra checked baggage","Free preferred seat selection","Al Maha Meet & Assist","Dedicated phone line"]}
  ]'::jsonb,
  lounge_access = 'Qatar Airways operates the **Al Mourjan Business Lounge** (multiple locations at DOH), the **Al Safwa First Class Lounge** at DOH, and **Privilege Club Lounges** at select international gateways including JFK and select US airports.

Access rules:
- **Same-day QR or oneworld flight + oneworld Sapphire (Gold)** - Al Mourjan Business / oneworld Business class lounges worldwide for member + 1 guest, any cabin.
- **Same-day QR or oneworld flight + oneworld Emerald (Platinum)** - Al Safwa First / Star First lounges for member + 1 guest, any cabin.
- **Same-day QR First Class boarding pass at DOH** - Al Safwa First lounge access in any context.
- **Same-day QR Business Class boarding pass** - Al Mourjan Business lounge.
- **Same-day Privilege Club Silver + same-day QR / oneworld flight** - Al Mourjan Business lounge (member only).
- **Premium Economy or Economy on QR** - no lounge access without status.

QR does not generally sell day passes for Al Mourjan or Al Safwa to non-status passengers; access is by status or premium cabin only.

Al Safwa is one of the most acclaimed First class lounges in the world, with private suites and dedicated dining service.',
  quirks = '- **Avios since November 2022** - Privilege Club replaced its Qmiles currency with Avios, joining the BA / Iberia / Aer Lingus / Finnair family. All five accounts can pool 1:1 via Combine My Avios.
- **Citi ThankYou is the unique entry point** for Citi points into the Avios family. Citi does not transfer directly to BA, Iberia, Aer Lingus, or Finnair - only to QR Privilege Club. Periodic 40% transfer bonuses make this especially valuable.
- **Distance-based earning, not revenue-based.** Avios on QR flights are earned by distance flown x booking-class multiplier (300% First, 250% Business J/C/D, 100% Economy Y/B, etc.). Discounted premium-cabin fares earn at near-full distance.
- **Tier bonus on top of base earning** for elite members: Silver +25%, Gold +75%, Platinum +100%.
- **Qpoints (separate from Avios)** are the status currency. 150/300/600 Qpoints per 12 months for Silver/Gold/Platinum. Lower retention thresholds in months 13-24.
- **20% Qpoints-from-QR-metal requirement** (or 4 QR sectors in 12 months / 8 in 24 months) - prevents pure partner-status-runs.
- **No carrier-imposed surcharges (YQ) on QR-operated awards.** US-originating taxes/fees typically $30-80 one-way.
- **Free Doha stopover** on connecting award itineraries.
- **355-361 day booking window** - one of the longest in the industry. Lock in Qsuite scarcity well in advance.
- **Avios expire after 36 months of inactivity** (any earn or redeem activity resets the clock).
- **QR-exclusive non-alliance partners**: JetBlue, Bangkok Airways, LATAM, Virgin Australia, RwandAir, MEA, Gol. None of these are bookable via BA Avios.
- **Most partner awards (except AA + BA) cannot be booked online** - you must call Privilege Club or submit an online award request form. Phone booking ticketing is generally faster.
- **Privilege Club Pro paid subscription** (launched mid-2025) offers guaranteed Qpoints accrual and bonus Avios for a monthly fee. Useful for semi-frequent flyers building toward status.
- **No US-issued co-brand credit card** as of May 2026. Reach QR Avios via Citi / Amex / Capital One / Bilt direct, or Chase / BA / Marriott indirect.',
  award_chart = '## Privilege Club redemption structure

QR uses **two parallel charts**:

| Chart | Routes | Pricing model |
|---|---|---|
| **QR Own-Metal Awards** | Qatar Airways-operated flights | Destination-based (origin x destination x cabin x peak/off-peak); not publicly published as a simple grid. Pricing is route-specific. |
| **Partner Award Chart** | All oneworld partners + Bangkok Airways, JetBlue, LATAM, MEA, RwandAir, Virgin Australia, Gol | Distance-banded (mirrors BA''s 9-zone chart) |

**Carrier-imposed surcharges (YQ):** $0 on QR-operated metal. US-originating taxes/fees typically $30-80 one-way. Partner awards through QR generally pass through partner surcharges, but most oneworld partner awards (AA, JAL, Cathay, Iberia) on QR Avios have low surcharges.

**Free Doha stopover** on connecting awards.

**Booking window:** 355-361 days in advance.

### Notable QR-operated redemption pricing (off-peak Saver, one-way)
- US-Doha Economy: ~30,000-35,000 Avios
- US-Doha Business / Qsuite: ~70,000 Avios
- US-Doha First (where offered): ~85,000-95,000 Avios
- US-Europe via Doha Business: ~90,000-110,000 Avios
- US-South / SE Asia via Doha Business: ~100,000-120,000 Avios
- US-Maldives via Doha Business: ~100,000-120,000 Avios
- US-East Africa via Doha Business: ~110,000-130,000 Avios

Peak pricing typically 20-35% higher. Flexi awards roughly 2x off-peak.

### Partner award chart (distance-banded, mirrors BA)
| Distance band | Economy | Business | First |
|---|---|---|---|
| 0-650 mi | 6,000 | 12,500 | n/a |
| 651-1,150 | 9,000 | 18,000 | n/a |
| 1,151-2,000 | 11,000 | 22,000 | n/a |
| 2,001-3,000 | 13,000 | 25,000 | 50,000 |
| 3,001-4,000 | 20,750 | 41,250 | 62,500 |
| 4,001-5,500 | 25,750 | 51,500 | 77,250 |
| 5,501-6,500 | 31,000 | 62,000 | 93,000 |
| 6,501+ | 41,250 | 82,500 | 124,000 |

(Approximate; consult QR Privilege Club partner chart for exact pricing.)

**Official partner chart:** https://www.qatarairways.com/en/privilege-club/spend-avios.html

### Earning rates on QR flights (% of distance flown)
- First class (A, F booking classes): 300%
- Business class (J, C, D): 250%
- Business discounted (I, R): 150%
- Economy full (Y, B): 100%
- Economy mid (H, K): 100%
- Economy mid (M, L, V, N): 75%
- Economy deep discount (S): 50%
- Economy deepest (G, O, Q): 25%

Plus Privilege Club tier bonus on top: Silver +25%, Gold +75%, Platinum +100%.

### No US co-brand card
QR does not have a US-issued co-brand credit card as of May 2026. Path to QR Avios for US-based readers is direct flexible-currency transfer (Amex / Citi / Capital One / Bilt) or via the Avios family (Chase or Marriott into BA, then Combine My Avios to QR).',
  partner_chart_url = 'https://www.qatarairways.com/en/privilege-club/spend-avios.html',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'qatar';

-- Step 5.5 partner_redemptions: oneworld + QR-exclusive non-alliance partners
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + QR partner awards (distance-banded, mirrors BA chart)', 'fixed',
  'QR partner award chart is distance-banded and mirrors BA Avios pricing. Most partner awards (except AA + BA) cannot be booked online - call Privilege Club. QR-exclusive non-alliance partners (JetBlue, Bangkok Airways, LATAM, Virgin Australia, RwandAir, MEA, Gol) are bookable here but NOT via BA Avios.',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'qatar' and c.slug in ('qatar','qatar-airways','aa','alaska','ba-avios','cathay','jal','finnair','iberia','malaysia','qantas','royal_jordanian','srilankan','jetblue','latam')
on conflict do nothing;

-- QR own-metal awards (no YQ, free Doha stopover, destination-based pricing)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Business', 'Qatar Airways own-metal (destination + cabin + season)', 'fixed',
  'QR-operated awards: destination-based pricing, peak/off-peak, no fuel surcharges. US-Doha Qsuite ~70K Avios off-peak one-way + $30-80 taxes. Free Doha stopover on connecting awards. 355-361 day booking window. Phone booking generally faster than online for partner segments.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'qatar'
on conflict do nothing;
