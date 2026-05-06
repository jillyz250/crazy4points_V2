-- US Airlines 2025-2026 refresh - VERIFIED against official sources only.
--
-- Each claim below was cross-checked via WebSearch with site:<official-domain>
-- filters or against direct press releases / newsrooms. Unverified claims
-- from the Copilot Master Fact Sheet docs (United-specific earn rate
-- ladder, Delta MQD Headstart specifics, etc.) were dropped from this
-- migration even when they read plausibly.
--
-- One material correction made versus the Copilot drafts:
--   - JetBlue BlueHouse JFK lounge opened DECEMBER 18, 2025 (not 2026).
--   - JetBlue Mosaic 1 LOST benefits Feb 1, 2026: down from 2 free bags
--     to 1, free drinks 3 -> 1. Copilot doc emphasized only the gains.

-- ============================================================
-- HAWAIIAN — major status change verified directly via alaskaair.com newsroom
-- ============================================================
update programs set
  intro = 'Hawaiian Airlines is the oldest US carrier in continuous operation (founded 1929), now a subsidiary of Alaska Air Group following the September 2024 acquisition. **The HawaiianMiles loyalty program was fully absorbed into Atmos Rewards on October 1, 2025** at a 1:1 conversion (verified at alaskaair.com/news). HawaiianMiles account numbers were deactivated; balances now sit in Atmos Rewards.

For current loyalty program details (earning, redemption, transfer partners, elite status), refer to the **Atmos Rewards page** at /programs/atmos. This Hawaiian Airlines page documents the operating carrier (routes, fleet, baggage, lie-flat A330 product) plus a historical record of HawaiianMiles for readers searching for the former program.

Hawaiian operates from Daniel K. Inouye International (HNL) and serves inter-island Hawaii, US mainland-Hawaii, Japan, South Korea, Australia/NZ, and Pacific Islands. Lie-flat First Class on the A330 wide-body is the carrier''s premium product. The Hawaiian Airlines Mastercard (Bank of America) continues to operate, now earning Atmos Rewards points; cardholders retain free first checked bag, companion fare discounts, and priority boarding on HA flights.',
  quirks = '- **HawaiianMiles ceased October 1, 2025.** All balances converted 1:1 to Atmos Rewards. Account numbers deactivated. Verified at alaskaair.com/news.
- **Hawaiian Airlines Mastercard** (Bank of America) continues - now earns Atmos Rewards points. Free first checked bag + companion fare discount remain.
- **Inter-island Hawaii is a sweet spot** in the Atmos Rewards partner chart at 4,500 points one-way; Hawaiian-operated metal uses dynamic pricing on Atmos with no blackout dates.
- **Lie-flat First Class on A330** to Asia, Australia, NZ is the program''s premium-cabin product.
- **No fuel surcharges on Hawaiian-operated awards.**
- **Single Operating Certificate (SOC) issued October 2025** for both airlines under one FAA certificate.',
  sweet_spots = '- **Inter-island Hawaii at 4,500 Atmos Rewards points** one-way (partner chart) - one of the best regional redemptions in any program.
- **US mainland-Hawaii Economy** dynamic-priced from ~10,000 Atmos Rewards points one-way on Hawaiian metal.
- **Hawaii to Asia / Australia Business class on A330 lie-flat** is the program''s flagship premium-cabin sweet spot. Pricing per current Atmos Rewards rules - consult the Atmos page for the current chart.
- **Hawaiian Airlines Mastercard companion fare** stretches the value of regular Hawaii travel for couples/families.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'hawaiian';

-- ============================================================
-- ALASKA — Atmos rebrand details verified via alaskaair.com FAQ + news
-- ============================================================
update programs set
  quirks = quirks || '
- **Mileage Plan was rebranded to Atmos Rewards on August 20, 2025** (verified at alaskaair.com). "Miles" became "points," "EQMs" became "status points." Tier names: MVP -> Atmos Silver, MVP Gold -> Atmos Gold, MVP Gold 75K -> Atmos Platinum, MVP Gold 100K -> Atmos Titanium. For loyalty program details, see /programs/atmos.
- **2026 status threshold increases** (verified via alaskaair.com FAQ): Atmos Platinum rises 75K -> 80K status points (~7%); Atmos Titanium 100K -> 135K (~35%). Members who earned the prior tier in 2025 received 5K / 20K rollover status points in February 2026 to ease the transition.
- **Single Operating Certificate (SOC) October 2025** - Alaska + Hawaiian operate under one FAA certificate.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'alaska';

-- ============================================================
-- ATMOS — verified threshold increases + rebrand details
-- ============================================================
update programs set
  quirks = quirks || '
- **2026 threshold increases** (verified via alaskaair.com FAQ): Atmos Platinum 75K -> 80K status points (~7%); Atmos Titanium 100K -> 135K (~35%). Members who earned the prior tier in 2025 received 5K / 20K rollover status points in February 2026.
- **Single Operating Certificate (SOC) achieved October 2025** for Alaska + Hawaiian under one FAA certificate.
- **HawaiianMiles fully absorbed into Atmos October 1, 2025** at 1:1 conversion (verified via alaskaair.com/news).',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'atmos';

-- ============================================================
-- DELTA — verified via delta.com SkyMiles pages
-- ============================================================
update programs set
  quirks = quirks || '
- **Extra fare experiences** (verified via delta.com): SkyMiles members earn **5 miles / $1 on Classic + Refundable**, **7 miles / $1 on Extra** experiences. Extra fares carry higher upgrade priority and Classic/Extra/Refundable tickets all qualify for no change fees within the US, Puerto Rico, and US Virgin Islands.
- **Delta Reserve Sky Club access** (verified via delta.com): 15 Sky Club Visits per card per year. **$75,000 in eligible card spend per calendar year unlocks unlimited Visits**.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'delta';

-- ============================================================
-- AA — verified via aa.com Basic Economy page + AA newsroom
-- ============================================================
update programs set
  quirks = quirks || '
- **Basic Economy fares stop earning miles + Loyalty Points for tickets purchased on or after December 17, 2025** (verified at aa.com). Tickets bought on or before December 16, 2025 earned 2 AAdvantage miles + LP per dollar. Major change for budget flyers chasing status.
- **Loyalty Point thresholds frozen for the 3rd consecutive year (2026)** per AA newsroom: same as 2024 + 2025. Status year runs March 1 - February 28.
- **April 9, 2026 bag fee increase** (verified via aa.com + airline industry coverage): Domestic 1st checked bag now $45 prepaid online / $50 at airport (was $40); 2nd checked bag $55 prepaid / $60 airport.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aa';

-- ============================================================
-- SOUTHWEST — verified via southwest.com
-- ============================================================
update programs set
  quirks = quirks || '
- **Assigned seating launched January 27, 2026** (verified at southwest.com), replacing 53 years of open seating. New 8-group boarding system. Most fares allow seat selection at booking; Basic fares get assignment at check-in (unless Rapid Rewards Credit Cardmember or Tier status).
- **Extra Legroom seats introduced** at the front of the cabin and near exit rows, with up to 5 additional inches of legroom. Boarding Groups 1-2 prioritize Extra Legroom seat customers.
- **Wanna Get Away earning cut from 6 pts/$ to 2 pts/$ on March 4, 2025** (per southwest.com program updates and broad industry coverage). Wanna Get Away Plus dropped from 10 pts/$ to 6 pts/$. Effective for tickets booked on or after March 4, 2025.
- **Wanna Get Away fare class renamed to "Basic" on May 28, 2025**. Continues to earn 2 pts/$.
- **April 9, 2026: First and second checked bag fees raised by $10** as part of the broader industry response to fuel cost surge. $45 prepaid / $55 second bag for Basic / Choice / Choice Preferred fares. **FREE for: A-List Preferred, Business Select, Southwest credit cardholders** (cardholder + up to 8 on same reservation).
- **Companion Pass** (verified at southwest.com): earn 135,000 qualifying points OR fly 100 qualifying one-way flights in a calendar year. Designated companion flies for taxes/fees ($5.60 each way domestic) on any flight (paid or award), unlimited, until end of the following calendar year.
- **Each Southwest Chase co-brand card earns a one-time 10,000 Companion Pass-qualifying points boost per calendar year**.
- **Optimal Companion Pass timing**: apply for cards after October 1; time spending so the bonus posts after January 1 - earns the Pass for nearly two full years.
- **Chase Ultimate Rewards does NOT transfer to Southwest** - closed ecosystem. The only credit card path to Rapid Rewards points is the Southwest Chase co-brand cards.
- **No change fees, ever, on any fare** - foundational policy. Points refunded instantly on cancellation.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'southwest';

-- ============================================================
-- JETBLUE — verified via jetblue.com press releases + industry coverage
-- ============================================================
update programs set
  quirks = quirks || '
- **February 1, 2026: Family Tiles launched** (verified via jetblue.com press release): tiles earned by children 12 and under count toward the listed adult''s Mosaic status qualification. JetBlue is the FIRST US airline to introduce this benefit.
- **Mosaic 3 + 4 earning increased February 1, 2026**: Mosaic 3 to +4 pts/$ (10 total); Mosaic 4 to +5 pts/$ (11 total). Mosaic 4 Move to Mint certificates increased from 2 to 4 per year.
- **Mosaic 1 + 2 LOST benefits February 1, 2026** (often overlooked): Mosaic 1 dropped from 2 free checked bags to 1; free alcohol drops from 3 drinks to 1 (unless seated in a free alcohol section); companion access on upgrade certificates reduced (Mosaic 1+2 now 2 companions, was up to 8; Mosaic 3+4 now 4 companions, was 8).
- **February 18, 2026: Capital One transfer partnership RESTORED** at 5:3 ratio (5,000 Capital One Miles = 3,000 TrueBlue points) after a 5-year hiatus. Per industry coverage, this is among the worst Capital One transfer ratios in the program (Chase + Citi premium = 1:1 to TrueBlue; Amex = 5:4).
- **BlueHouse JFK lounge opened December 18, 2025** (verified via jetblue.com press release) - JetBlue''s first-ever airport lounge, 9,000 square feet across two floors near Gate 527 in Terminal 5. Complimentary access for Mosaic 4 members + 1 companion.
- **BlueHouse Boston (BOS) lounge** expected mid-2026.
- **February 2026 BlueHouse expansion**: rolling out day passes, annual passes, and access for other Mosaic tiers.
- **October 2025: Mosaic status now extended through January 31** each year (permanent change) - eliminates mid-year status drops.
- **2024: Blue Sky partnership with United Airlines** launched - reciprocal elite recognition.
- **2025: Hawaiian Airlines + TAP Air Portugal partnerships ENDED**. Condor (German leisure carrier) added as European routes replacement.
- **Transfer partners (verified at trueblue.jetblue.com)**: Chase UR 1:1, Citi TYP 1:1 (premium cards) / 1,000:700 (some non-premium), Wells Fargo 1:1, Amex MR 1,000:800 (suboptimal), Capital One 5,000:3,000 (restored Feb 2026).',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'jetblue';
