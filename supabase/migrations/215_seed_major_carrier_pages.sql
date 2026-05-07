-- Major carrier pages batch: 7 airline carrier rows that were FK-load-bearing
-- stubs (intro=NULL, all fields blank) used by partner_redemptions but never
-- populated with content. These are CARRIER pages (type='airline'), not
-- loyalty-program pages - the loyalty programs (Miles & More, BA Avios,
-- Flying Blue, Aeroplan) are separate rows that own the chart, transfer
-- partners, and tier benefits.
--
-- Carriers in this batch:
--   lufthansa, swiss, austrian (umbrella: miles-and-more)
--   british-airways (umbrella: ba-avios)
--   air-france, klm (umbrella: flying-blue)
--   air-canada (umbrella: aeroplan)
--
-- Each carrier reuses transfer_partners + tier_benefits from its umbrella
-- loyalty program (because flying the carrier earns into the umbrella, and
-- elite status on the carrier IS umbrella status). Carrier-specific fields
-- (intro, hubs, how_to_spend, sweet_spots, lounge_access, quirks, award_chart)
-- focus on the airline experience: brand, fleet, cabin product, hub lounges,
-- airline-side YQ behavior, and US-flyer-relevant routes.

-- ============================================================
-- STEP 1: Reuse umbrella program data for transfer_partners + tier_benefits
-- ============================================================

-- Lufthansa Group carriers -> Miles & More
update programs p_dest
set transfer_partners = (select transfer_partners from programs where slug = 'miles-and-more'),
    tier_benefits = (select tier_benefits from programs where slug = 'miles-and-more')
where p_dest.slug in ('lufthansa','swiss','austrian');

-- British Airways -> BA Avios
update programs p_dest
set transfer_partners = (select transfer_partners from programs where slug = 'ba-avios'),
    tier_benefits = (select tier_benefits from programs where slug = 'ba-avios')
where p_dest.slug = 'british-airways';

-- Air France + KLM -> Flying Blue
update programs p_dest
set transfer_partners = (select transfer_partners from programs where slug = 'flying-blue'),
    tier_benefits = (select tier_benefits from programs where slug = 'flying-blue')
where p_dest.slug in ('air-france','klm');

-- Air Canada -> Aeroplan
update programs p_dest
set transfer_partners = (select transfer_partners from programs where slug = 'aeroplan'),
    tier_benefits = (select tier_benefits from programs where slug = 'aeroplan')
where p_dest.slug = 'air-canada';

-- ============================================================
-- STEP 2: Per-carrier content (intro, hubs, how_to_spend, etc.)
-- ============================================================

-- ============================================================
-- 1. LUFTHANSA (Star Alliance, FRA + MUC)
-- ============================================================
update programs set
  type = 'airline',
  name = 'Lufthansa',
  alliance = 'star_alliance',
  hubs = ARRAY['FRA','MUC'],
  intro = 'Lufthansa is the Frankfurt-based flag carrier of Germany (founded 1953) and the parent of Lufthansa Group, which now spans SWISS, Austrian, Brussels, and ITA Airways. The fleet runs roughly 280+ aircraft: A350-900, A380 (returning to key US routes 2023-2025), 747-8i (the only Western airline still flying the Queen as a flagship), 787-9 deliveries since 2024, A320 family across Europe, with 777-9s on order. The Allegris cabin rollout (2024-2026) is the headline product story: a brand-new long-haul Business class with a mix of seat types including a privacy-door suite, plus fully enclosed First Class suites in a 1-1-1 layout. Hubs are FRA (Frankfurt) primary and MUC (Munich) secondary; US gateways are extensive (JFK, EWR, BOS, IAD, MIA, ORD, ATL, DFW, IAH, DEN, LAX, SFO, SEA, MCO, CLT, PHL, RDU, MSP, DTW, AUS).

For US travelers, the headline value is Lufthansa First Class on the 747-8i - 8 seats per plane and one of the most aspirational redemptions in the points world. The catch: First availability opens to partner programs only 14 days before departure (15 for M&M direct), and Lufthansa-issued M&M awards on LH metal carry hefty fuel surcharges. The fix is booking via partner programs - Aeroplan (100K-110K Miles one-way US-Europe in F), Avianca LifeMiles (87K-110K one-way), or ANA Mileage Club (110K one-way). All three pass minimal or zero YQ. Award chart and tier benefits live on the Miles & More page; this page focuses on the carrier itself.',
  how_to_spend = '- **Lufthansa First Class on the 747-8i via Aeroplan (100K-110K one-way US-Europe)** - low YQ, cleanest US-flexible-currency path through Bilt, Amex, Capital One, Chase.
- **Lufthansa First via Avianca LifeMiles (87K-110K one-way)** - LifeMiles transfers from Amex MR, Capital One, Citi, Bilt.
- **Lufthansa First via ANA Mileage Club (110K one-way)** - ANA transfers from Amex MR only; round-trip-only rule applies.
- **Lufthansa Allegris Business via Aeroplan / LifeMiles / United** at saver pricing on partner charts (verify per route).
- **Avoid M&M-direct redemption on LH metal in F or J** - heavy YQ pass-through (often $700+ one-way).
- **HON Circle (top M&M tier)** unlocks the First Class Terminal at FRA regardless of cabin.',
  sweet_spots = '- **Lufthansa First on 747-8i via Aeroplan or Avianca LifeMiles** - 8 First seats per plane and a proper enclosed F suite. Availability opens 14 days out for partners.
- **First Class Terminal (FCT) at FRA** - separate building, dedicated immigration, Porsche transfer to plane. Accessible to F passengers and HON Circle members.
- **Allegris Business via partner programs** - new 1-2-1 J seat with privacy door rolling out across the A350 fleet 2024-2026.
- **Welcome Lounge at MUC** is the FCT-style equivalent for Munich-departing F passengers.
- **Aeroplan / LifeMiles / ANA all skip the heavy YQ** that hits M&M-direct LH metal awards.
- **A380s back on key US routes (ORD, MIA)** - useful for upper-deck premium-cabin redemptions.',
  lounge_access = 'Lufthansa operates the First Class Terminal (FCT) at FRA - a separate building with dedicated immigration, private suites, fine dining, and Porsche transfer to the aircraft. Access is limited to same-day Lufthansa Group First Class passengers and HON Circle members regardless of cabin. MUC has the Welcome Lounge as the FCT-style equivalent. Across the network, Senator and Business lounges serve M&M Senator (Star Gold) and HON Circle members plus same-day premium-cabin passengers. Star Alliance Gold from any partner (United Premier 1K, Aeroplan 50K+, etc.) gets reciprocal lounge access on same-day Star international flights.',
  quirks = '- **Heavy fuel surcharges (YQ) on M&M-direct awards on Lufthansa metal** - often $700+ one-way in business or first.
- **Aeroplan, Avianca LifeMiles, and ANA Mileage Club all skip the YQ** when booking LH metal - the canonical US-flyer fix.
- **First Class availability opens to partner programs 14 days before departure** (15 days for M&M direct).
- **HON Circle is the top M&M tier** - unlocks First Class Terminal access at FRA regardless of cabin flown.
- **First Class Terminal at FRA** is genuinely separate from Z-gate Senator and Business lounges - different building, different immigration line.
- **Allegris cabin rollout 2024-2026** - new Business class with mixed seat types (privacy door on some), new fully enclosed First suites in 1-1-1.
- **A380s returning to key US routes (ORD, MIA)** post-pandemic; 777-9 deliveries delayed.
- **787-9 deliveries continuing 2024+** - replacing some A340-600 long-haul.
- **ITA Airways now part of Lufthansa Group** - earning/redeeming on ITA flows through M&M.
- **20+ US gateways** - one of the broadest US footprints among European carriers.
- **Founded 1953** - the postwar reincarnation of the original 1926 Deutsche Luft Hansa.
- **Award chart and tier benefits live on the Miles & More page** - this carrier page references the umbrella program.',
  award_chart = 'Lufthansa metal redeems at Miles & More partner-chart pricing when booked via partner Star Alliance programs, and at dynamic M&M-direct pricing when booked directly through Miles & More. The full award chart lives on the [Miles & More page](/programs/miles-and-more); key cells for Lufthansa as of May 2026:

| Route | Cabin | Best partner program | Approx. miles one-way |
|---|---|---|---|
| US-Europe | First (747-8i) | Aeroplan | 100,000-110,000 |
| US-Europe | First (747-8i) | Avianca LifeMiles | 87,000-110,000 |
| US-Europe | First (747-8i) | ANA Mileage Club | 110,000 (RT only) |
| US-Europe | Business (Allegris A350) | Aeroplan | 70,000-77,000 |
| US-Europe | Business | LifeMiles | 63,000-78,000 |
| US-Europe | Economy | Aeroplan | 35,000-45,000 |

Verify saver availability on aeroplan.com, lifemiles.com, and ana.co.jp; M&M-direct pricing on miles-and-more.com is dynamic and typically less competitive due to YQ.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'lufthansa';

-- ============================================================
-- 2. SWISS INTERNATIONAL AIR LINES (Star Alliance, ZRH + GVA)
-- ============================================================
update programs set
  type = 'airline',
  name = 'SWISS International Air Lines',
  alliance = 'star_alliance',
  hubs = ARRAY['ZRH','GVA'],
  intro = 'SWISS International Air Lines is the Zurich-based flag carrier of Switzerland (founded 2002 from the ashes of Swissair) and a Lufthansa Group subsidiary since 2005. The fleet runs roughly 100 aircraft: A220 (key for thinner European routes), A320 family, A330-300, A340-300 (retiring), 777-300ER, with A350-900 deliveries beginning 2025. Hubs are ZRH (Zurich) primary and GVA (Geneva) secondary; US gateways include JFK, EWR, BOS, ORD, MIA, LAX, SFO. The signature SWISS First product on the 777-300ER - 8 enclosed First Class suites - is widely regarded as one of the best European F products, and the SWISS First Class Lounge at ZRH (a separate dedicated facility, distinct from the Senator lounge) is one of the top airline lounges on the continent.

For US travelers, the SWISS playbook mirrors Lufthansa: book SWISS metal via partner programs to skip Miles & More fuel surcharges. Aeroplan US-Zurich in business is roughly 70K-77K one-way; SWISS First via Aeroplan runs 110K one-way; Avianca LifeMiles and ANA Mileage Club also work for SWISS First. Award chart and tier benefits live on the Miles & More page since SWISS shares the M&M loyalty engine with Lufthansa, Austrian, and Brussels. This page focuses on the carrier and its on-the-ground premium experience.',
  how_to_spend = '- **SWISS First on 777-300ER via Aeroplan (110K one-way US-ZRH)** - one of the top European F products in the points world.
- **SWISS First via Avianca LifeMiles (87K-110K one-way)** - LifeMiles transfers from Amex MR, Capital One, Citi, Bilt.
- **SWISS First via ANA Mileage Club (110K one-way RT-only)** - Amex MR transfer; round-trip required.
- **SWISS Business via Aeroplan (70K-77K one-way US-Zurich)** - the workhorse premium-cabin redemption.
- **Avoid M&M-direct on SWISS metal** - same heavy YQ as Lufthansa.
- **A220 short-haul SWISS metal** for intra-Europe via Aeroplan or LifeMiles (verify saver buckets).',
  sweet_spots = '- **SWISS First on 777-300ER via partner programs (Aeroplan, LifeMiles, ANA)** - genuinely aspirational F product.
- **SWISS First Class Lounge at ZRH** - separate dedicated facility, not just a Senator lounge upgrade. Cigar lounge, fine dining, walk-out gate access.
- **SWISS Business on A330/A340/777** at ~70K-77K Aeroplan one-way US-Zurich.
- **SWISS First Class Terminal MXP** for premium-cabin SWISS departures (limited).
- **Cheese cart and signature service** is genuinely beloved on the carrier.
- **A350-900 deliveries beginning 2025** - newer product rolling onto US routes.',
  lounge_access = 'SWISS operates the SWISS First Class Lounge at ZRH - a separate dedicated facility with cigar lounge, fine dining, private suites, and direct apron access (you can drive to your plane). Access is limited to same-day SWISS or Lufthansa Group First passengers and HON Circle members. ZRH also has Senator and Business lounges for M&M Senator (Star Gold) and same-day premium passengers. Limited SWISS First Class Terminal-style facilities exist at MXP and JFK. Star Alliance Gold from any partner gets reciprocal lounge access on same-day Star international flights.',
  quirks = '- **Heavy YQ on M&M-direct awards on SWISS metal** - same problem as Lufthansa, same partner-program fix.
- **SWISS First Class Lounge ZRH is a separate building** from the Senator lounge - different facility, F-only access.
- **SWISS First only accessible via partner programs 14 days out** (15 for M&M direct).
- **A350-900 deliveries 2025+** - cabin retrofit and fleet renewal continuing.
- **Cheese cart and chocolate service** is signature SWISS - small but consistent on long-haul.
- **Sky-blue cabin colors and Swiss-engineered service** are part of the brand experience.
- **Lufthansa Group subsidiary since 2005** - same loyalty engine (M&M), same alliance (Star).
- **Smaller fleet than LH/AA/UA** means fewer redemption seats, but also less competition on saver buckets.
- **Award chart and tier benefits live on the Miles & More page** - this carrier page references the umbrella.',
  award_chart = 'SWISS metal redeems at Miles & More partner-chart pricing via partner Star Alliance programs, and at dynamic M&M-direct pricing when booked through Miles & More. The full award chart lives on the [Miles & More page](/programs/miles-and-more); key cells for SWISS as of May 2026:

| Route | Cabin | Best partner program | Approx. miles one-way |
|---|---|---|---|
| US-ZRH | First (777-300ER) | Aeroplan | 110,000 |
| US-ZRH | First | Avianca LifeMiles | 87,000-110,000 |
| US-ZRH | First | ANA Mileage Club | 110,000 (RT only) |
| US-ZRH | Business | Aeroplan | 70,000-77,000 |
| US-ZRH | Business | LifeMiles | 63,000-78,000 |
| US-ZRH | Economy | Aeroplan | 35,000-45,000 |

Verify saver availability on aeroplan.com, lifemiles.com, and ana.co.jp.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'swiss';

-- ============================================================
-- 3. AUSTRIAN AIRLINES (Star Alliance, VIE)
-- ============================================================
update programs set
  type = 'airline',
  name = 'Austrian Airlines',
  alliance = 'star_alliance',
  hubs = ARRAY['VIE'],
  intro = 'Austrian Airlines is the Vienna-based flag carrier of Austria (founded 1957) and a Lufthansa Group subsidiary since 2009. The fleet runs roughly 80 aircraft: Embraer 195, A320 family, 777-200ER, and 787-9 deliveries 2024-2025 that are gradually replacing the older 777s on long-haul. Hub is VIE (Vienna), a manageable single-terminal connecting airport that punches above its weight as a Eastern Europe gateway. US gateways include JFK, EWR, ORD, IAD, and LAX (verify current LAX status on austrian.com).

For US travelers, Austrian is the underrated Lufthansa Group play. The Austrian Business product on 777 / 787 is solid (lie-flat reverse herringbone) but less aspirational than LH First or SWISS First, which means saver award availability tends to open more readily than on flagship LH/SWISS routes. Aeroplan US-Vienna in business is roughly 60K one-way; Avianca LifeMiles US-VIE business is around 63K one-way. Same Miles & More umbrella, so award chart and tier benefits live on the M&M page. The carrier-specific advantages: more saver seats on average, and VIE is often a smoother transit hub than FRA/MUC during peak periods.',
  how_to_spend = '- **Austrian Business via Aeroplan (60K one-way US-Vienna)** - the workhorse US-Europe premium redemption with strong saver availability.
- **Austrian Business via Avianca LifeMiles (~63K one-way)** - LifeMiles transfers from Amex MR, Capital One, Citi, Bilt.
- **Austrian Business via United MileagePlus** at dynamic pricing (typically less efficient than Aeroplan/LifeMiles).
- **Austrian Economy via Aeroplan (~35K-45K one-way)** for cash-saving transatlantic.
- **Avoid M&M-direct** on Austrian metal - YQ pass-through hits hard same as LH/SWISS.
- **787-9 fleet rollout 2024-2025** - newer product, generally better seat than older 777-200ER.',
  sweet_spots = '- **Austrian Business saver via Aeroplan (60K one-way)** - often more open than LH/SWISS saver on the same dates.
- **VIE as a smoother European transit hub** than FRA/MUC during peak periods.
- **787-9 fleet rollout** - newer cabin product replacing older 777-200ERs.
- **Austrian Business class on 777/787** - solid lie-flat reverse herringbone, less aspirational than LH F but more accessible.
- **Da Vinci Lounge at VIE** for Star Alliance Gold and Austrian Business passengers.
- **Smaller fleet, fewer competing redemptions** - saver buckets often more open than flagship LH routes.',
  lounge_access = 'Austrian operates the HON Circle Lounge, Senator Lounge, and Business Lounge at VIE - the standard Lufthansa Group three-tier lounge structure. Da Vinci Lounge serves Austrian Business passengers and Star Gold members. Star Alliance Gold from any partner gets reciprocal lounge access on same-day Star international flights. Across the rest of the network, Austrian premium passengers and Star Gold members access partner Star lounges.',
  quirks = '- **Heavy YQ on M&M-direct Austrian awards** - same Lufthansa Group pattern; book via Aeroplan or LifeMiles to skip.
- **787-9 deliveries 2024-2025** are gradually replacing 777-200ERs on long-haul.
- **Austrian saver availability tends to open more readily** than flagship LH/SWISS routes - smaller fleet, less demand pressure.
- **VIE is a manageable single-terminal hub** - smoother connections than FRA/MUC during peaks.
- **Lufthansa Group subsidiary since 2009** - same M&M loyalty engine.
- **Eastern European network strength** - Austrian connects more thoroughly to Belgrade, Bucharest, Sofia, Tirana than other Western European carriers.
- **No First Class on Austrian metal** - long-haul tops out at Business.
- **Austrian Business is solid but not aspirational** - reverse herringbone lie-flat, similar to many other carriers.
- **Award chart and tier benefits live on the Miles & More page** - this carrier page references the umbrella.',
  award_chart = 'Austrian metal redeems at Miles & More partner-chart pricing via partner Star programs, and at dynamic M&M-direct pricing when booked through Miles & More. The full award chart lives on the [Miles & More page](/programs/miles-and-more); key cells for Austrian as of May 2026:

| Route | Cabin | Best partner program | Approx. miles one-way |
|---|---|---|---|
| US-VIE | Business | Aeroplan | 60,000 |
| US-VIE | Business | LifeMiles | ~63,000 |
| US-VIE | Economy | Aeroplan | 35,000-45,000 |
| VIE-Eastern Europe | Business | Aeroplan | 15,000-25,000 |

Verify saver availability on aeroplan.com and lifemiles.com.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'austrian';

-- ============================================================
-- 4. BRITISH AIRWAYS (oneworld, LHR + LGW + LCY)
-- ============================================================
update programs set
  type = 'airline',
  name = 'British Airways',
  alliance = 'oneworld',
  hubs = ARRAY['LHR','LGW','LCY'],
  intro = 'British Airways is the Heathrow-based flag carrier of the UK (founded 1974 from the merger of BOAC and BEA) and the flagship of IAG, parent of Iberia, Aer Lingus, Vueling, and LEVEL. The fleet runs roughly 280 aircraft: A380, 777-200/300ER, 787-8/9/10, A350-1000, A320 family, with A220s incoming. Hubs are LHR (Heathrow) primary, LGW (Gatwick) secondary leisure, and LCY (London City) for European business routes. US gateways are extensive - 22+ US cities served from LHR including JFK, EWR, BOS, IAD, MIA, ORD, ATL, DFW, IAH, DEN, LAX, SFO, SEA, MSP, RDU, BNA, ORL, AUS, PHX, SAN, PHL, CLT.

The Club Suite rollout (2019-2026) is BA''s biggest cabin story: a new Business class with 1-2-1 layout and a privacy door, on A350-1000s, retrofitted A380s, and retrofitted 777-300ERs. As of May 2026, most US routes have Club Suite; notable holdouts include JNB, KUL, MEX, MIA, SCL, NRT (mostly older A380 / un-refurbed 787-9). For US travelers, the BA story is dominated by one structural reality: BA-direct Avios redemption on BA metal carries enormous fuel surcharges (~$700-1,100 one-way in J transatlantic). The fix is sister-Avios redemption: Iberia Plus or Aer Lingus AerClub Avios (via Combine My Avios) book identical BA metal at significantly lower YQ, especially on UK-Ireland-US routings via Aer Lingus. Award chart and tier benefits live on the BA Avios page.',
  how_to_spend = '- **BA short-haul intra-Europe via Avios (4,500 OW economy)** - cheapest positioning flights ex-LHR.
- **Reward Flight Saver guaranteed seats** - fixed Avios + cash co-pay; 8Y/2W/4J ex-LHR/LGW, 2Y/2J ex-LCY.
- **BA Club Suite via Iberia Plus or Aer Lingus AerClub Avios (via Combine My Avios)** - identical metal at lower YQ.
- **AerClub Avios on UK-Ireland-US routings** - particularly low YQ via Aer Lingus US flights (DUB connection).
- **Avoid BA-direct Avios redemption on BA metal long-haul** - $700-1,100 one-way in J due to YQ.
- **Combine My Avios** - free, near-instant pooling across BA, Iberia, Aer Lingus, Finnair, Qatar, Vueling, Loganair.',
  sweet_spots = '- **BA Club Suite (1-2-1 with privacy door) on A350-1000 and refurbished A380** - solid premium product, broadly available on US routes by May 2026.
- **First Wing at LHR T5** - dedicated F security and lounge entry from check-in to plane.
- **Concorde Room at LHR T5 and JFK T7** - F-only lounges (the JFK T7 location is a notable point of difference vs. other US-bound flagship F products).
- **Reward Flight Saver guaranteed seats** ex-LHR/LGW/LCY at fixed Avios + cash co-pay.
- **Sister-Avios route around BA fuel surcharges** - Iberia Plus or AerClub Avios book BA metal at lower YQ.
- **BA short-haul intra-Europe at 4,500 Avios** - one of the cheapest positioning flight options in the points world.',
  lounge_access = 'BA operates the Concorde Room (F-only) at LHR T5 and JFK T7, plus the First Wing at LHR T5 (dedicated First Class security and lounge entry from check-in to plane). Galleries First serves F passengers and oneworld Emerald (BA Gold + above). Galleries Club Lounge and Galleries North/South serve oneworld Sapphire (BA Silver) and Business passengers. Across the network, oneworld Emerald and Sapphire from any partner (American AAdvantage, Cathay, Qatar, etc.) gets reciprocal access. American Admirals Clubs are accessible via oneworld Sapphire on same-day international.',
  quirks = '- **BA-direct Avios redemption on BA metal carries enormous YQ** - typically $700-1,100 one-way in business class transatlantic.
- **Iberia Plus or Aer Lingus AerClub Avios (via Combine My Avios) book identical BA metal at lower YQ** - the canonical fix.
- **AerClub Avios on UK-Ireland-US routings has particularly low YQ** via Aer Lingus US flights (DUB connection).
- **Combine My Avios is free and near-instant** across BA, Iberia, Aer Lingus, Finnair, Qatar, Vueling, Loganair.
- **Reward Flight Saver caps cash co-pay** ex-LHR/LGW (8Y/2W/4J) and ex-LCY (2Y/2J).
- **Club Suite rollout 2019-2026** with notable holdouts on older A380 and un-refurbed 787-9 routes (JNB, KUL, MEX, MIA, SCL, NRT as of April 2026).
- **First Wing at LHR T5** - dedicated F security and lounge access from check-in straight through.
- **Concorde Room at JFK T7** - one of the few flagship-F lounges on US soil.
- **22+ US gateways from LHR** - widest US footprint among European carriers.
- **22.5-hour minimum connecting time at LHR for inbound F to onward flights** is unusually generous - useful for Concorde Room dwell.
- **Award chart and tier benefits live on the BA Avios page** - this carrier page references the umbrella.',
  award_chart = 'BA metal redeems at the BA Avios distance-based award chart when booked via BA, Iberia, Aer Lingus, Finnair, Qatar, Vueling, or Loganair Avios (all interchangeable via Combine My Avios). The full award chart lives on the [BA Avios page](/programs/ba-avios); key cells for BA as of May 2026:

| Route | Cabin | Avios + cash one-way (off-peak) |
|---|---|---|
| US East Coast-LHR | Club Suite (J) | 50,000-62,500 + ~$700-1,100 BA-direct YQ |
| US East Coast-LHR | Club Suite via Iberia Plus | 50,000-62,500 + lower YQ |
| US East Coast-LHR | Club Suite via AerClub | 62,500 + lower YQ |
| US East Coast-LHR | Economy | 13,000-26,000 + cash |
| Intra-Europe short-haul | Economy | 4,000-4,500 + cash |
| Intra-Europe short-haul | Business | 7,750-9,750 + cash |

Reward Flight Saver caps cash co-pay ex-LHR/LGW. Verify on ba.com and iberia.com.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'british-airways';

-- ============================================================
-- 5. AIR FRANCE (SkyTeam, CDG + ORY)
-- ============================================================
update programs set
  type = 'airline',
  name = 'Air France',
  alliance = 'skyteam',
  hubs = ARRAY['CDG','ORY'],
  intro = 'Air France is the Paris-based flag carrier of France (founded 1933) and one half of the Air France-KLM Group formed in 2004. The fleet runs roughly 210+ aircraft: A220, A320/321 family, A330-200, A350-900, 777-200ER/300ER, 787-9. Hubs are CDG (Charles de Gaulle / Roissy) primary and ORY (Orly) secondary for European and domestic routes. US gateways are extensive - JFK, EWR, BOS, IAD, MIA, ATL, ORD, DFW, IAH, DEN, LAX, SFO, SEA, MSP, RDU.

For US travelers, Air France''s standout product is La Premiere - the four-suite First Class on the 777-300ER, one of the most exclusive European F experiences. La Premiere is redeemable only via Flying Blue (no SkyTeam partner award path), with dynamic mileage cost that historically lands above 200,000 miles one-way US-CDG. The La Premiere lounge at CDG includes private dining, a spa, and bedrooms - it sets the tier-above standard for European F lounges. AF Business is a strong but more conventional product, with new Business class debuting on A350-1000s 2024-2026. The Flying Blue Promo Rewards (25-50% off rotating routes) are the bread-and-butter US-flyer sweet spot for AF Business at 60K-100K one-way during promos. Award chart and tier benefits live on the Flying Blue page since AF and KLM share the same loyalty engine.',
  how_to_spend = '- **Flying Blue Promo Rewards** (25-50% off rotating routes) for AF Business US-CDG at 60K-100K one-way during promos.
- **AF Business via Flying Blue dynamic** at ~60K-100K one-way US-CDG (varies by date/route).
- **AF La Premiere via Flying Blue only** - 200K+ miles one-way US-CDG (dynamic; verify).
- **Avoid AF metal via Delta SkyMiles** - dynamic pricing typically 250K-400K one-way for J. Skip.
- **AF via Korean SkyPass partner chart** at ~80K J round-trip historical (verify post-2024 chart).
- **Air France Business class on the new A350-1000** (rolling out 2024-2026) is the freshest cabin in the fleet.',
  sweet_spots = '- **AF La Premiere on 777-300ER** - 4 enclosed suites, redeemable only via Flying Blue. Most exclusive European F.
- **La Premiere lounge at CDG** - private dining, spa, bedrooms. Sets the European F-lounge bar.
- **Flying Blue Promo Rewards** - bread-and-butter sweet spot. 25-50% off rotating routes month-to-month.
- **AF Business on A350-1000** - newest cabin in the fleet, rolling out 2024-2026.
- **CDG Terminal 2E** for SkyTeam departures - newer, generally smoother than older T2 segments.
- **AF via Korean SkyPass** at ~80K business round-trip historical (verify).',
  lounge_access = 'Air France operates the La Premiere lounge at CDG - private dining room, spa, and bedrooms - access limited to F passengers and Flying Blue Ultimate (top tier). Air France Business Lounges at CDG, JFK, IAD, and LAX serve AF Business passengers and SkyTeam Elite Plus. The Salon Air France network covers most US gateway airports. SkyTeam Elite Plus from any partner (Delta Diamond, KLM Platinum, Korean SKYPASS Million Miler, etc.) gets reciprocal lounge access on same-day SkyTeam international flights.',
  quirks = '- **Heavy YQ on Flying Blue AF awards** - typically $300-500 one-way US-CDG in business class.
- **La Premiere is redeemable only via Flying Blue** - no SkyTeam partner award access. Dynamic pricing, typically 200K+ one-way.
- **AF metal via Delta SkyMiles is dynamic and almost always 250K+ one-way for J** - skip.
- **Flying Blue Promo Rewards rotate monthly** - 25-50% off select routes; check the promo list before transferring.
- **CDG Terminal 2E** for most SkyTeam departures - newer terminal segments.
- **A350-1000 deliveries 2025+** with new Business class.
- **La Premiere refresh announced 2024-2026** - new suite design rolling out.
- **Founded 1933** - one of the oldest continuously operating European flag carriers.
- **Award chart and tier benefits live on the Flying Blue page** - this carrier page references the umbrella.',
  award_chart = 'AF metal redeems at Flying Blue dynamic pricing when booked via Flying Blue, plus partner award pricing via Korean SkyPass and other SkyTeam partners. The full award chart lives on the [Flying Blue page](/programs/flying-blue); key cells for AF as of May 2026:

| Route | Cabin | Best path | Approx. miles one-way |
|---|---|---|---|
| US-CDG | La Premiere (F) | Flying Blue only | 200,000+ (dynamic) |
| US-CDG | Business | Flying Blue dynamic | 60,000-100,000 |
| US-CDG | Business | Flying Blue Promo Rewards | 30,000-75,000 (during promo) |
| US-CDG | Business | Korean SkyPass | ~80,000 RT historical (verify) |
| US-CDG | Economy | Flying Blue dynamic | 25,000-50,000 |

Verify Promo Reward routes on flyingblue.com - they rotate monthly.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-france';

-- ============================================================
-- 6. KLM ROYAL DUTCH AIRLINES (SkyTeam, AMS)
-- ============================================================
update programs set
  type = 'airline',
  name = 'KLM Royal Dutch Airlines',
  alliance = 'skyteam',
  hubs = ARRAY['AMS'],
  intro = 'KLM Royal Dutch Airlines is the Amsterdam-based flag carrier of the Netherlands and the oldest airline still operating under its original name (founded 1919). KLM merged with Air France in 2004 to form Air France-KLM Group. The fleet runs roughly 115+ aircraft: 737 family, A330-200/300, 777-200ER/300ER, 787-9/10, plus Embraer 175/190 via KLM Cityhopper. Hub is AMS (Amsterdam Schiphol) - one of Europe''s top transfer hubs and a notably efficient single-terminal connecting airport. US gateways include JFK, EWR, BOS, IAD, MIA, ATL, ORD, IAH, DEN, LAX, SFO, MSP.

KLM operates a single-aisle premium model: World Business Class (lie-flat 1-2-1 on 787-9/10 and refurbished 777-300ER; 2-2-2 angled on older 777-200ER), Premium Comfort, and Economy. There is no First Class on KLM. For US travelers, the Flying Blue playbook is identical to Air France: Promo Rewards rotate 25-50% off select routes month-to-month, and KLM Business US-AMS prices ~60K-100K Flying Blue dynamic. Korean SkyPass partner award is the alternative path (~80K business round-trip historical, verify). Award chart and tier benefits live on the Flying Blue page since AF and KLM share the same loyalty engine.',
  how_to_spend = '- **Flying Blue Promo Rewards** for KLM US-AMS at discount during 25-50% off promos (rotating monthly).
- **KLM Business via Flying Blue dynamic** ~60K-100K one-way US-AMS (varies by date).
- **KLM via Korean SkyPass** ~80K business round-trip historical (verify post-2024 chart).
- **Avoid KLM via Delta SkyMiles** - same dynamic-pricing problem as AF metal; typically 250K+ one-way for J.
- **Bilt 1:1 to Flying Blue on Rent Day** for direct funding without YQ markup vs. SkyMiles transfer.
- **KLM economy via Flying Blue Promo (often 12K-20K each way during promos)** - solid for cash-saving transatlantic.',
  sweet_spots = '- **Flying Blue Promo Rewards on KLM AMS-US economy** - sometimes 12K-20K each way during promos.
- **KLM Business on 787-9/10 (lie-flat 1-2-1)** - the newer, better seat in the long-haul fleet.
- **AMS Schiphol is one of Europe''s most efficient transfer hubs** - single-terminal layout, fast connections.
- **KLM Crown Lounges at AMS** (Schengen + non-Schengen) for SkyTeam Elite Plus and Business passengers.
- **No First Class** - KLM tops out at World Business Class. Cleaner premium-cabin redemption math than carriers with F.
- **787-10 deliveries continuing** - newest cabin product on key US routes.',
  lounge_access = 'KLM operates KLM Crown Lounges at AMS - a Schengen Crown Lounge and a non-Schengen Crown Lounge - for SkyTeam Elite Plus and KLM Business passengers. KLM also operates a lounge at JFK T4. SkyTeam Elite Plus from any partner (Delta Diamond, AF Platinum, Korean Million Miler, etc.) gets reciprocal lounge access on same-day SkyTeam international flights. AMS partner lounge access for non-Crown SkyTeam carriers also available.',
  quirks = '- **Heavy YQ on Flying Blue KLM awards** - same problem as AF; typically $300-500 one-way US-AMS in J.
- **KLM via Delta SkyMiles is dynamic and rarely competitive** - skip for premium-cabin.
- **AMS Schiphol single-terminal** - one of the fastest connecting hubs in Europe.
- **No First Class on KLM** - cleaner award math; long-haul tops out at World Business.
- **787-10 deliveries continuing** with newer 1-2-1 lie-flat J seat.
- **A330 retirement plan** - older cabins phasing out gradually.
- **Founded 1919 - oldest airline still operating under its original name**.
- **Same Flying Blue umbrella as Air France** - earnings, status, redemption all flow through Flying Blue.
- **Award chart and tier benefits live on the Flying Blue page** - this carrier page references the umbrella.',
  award_chart = 'KLM metal redeems at Flying Blue dynamic pricing when booked via Flying Blue, plus partner award pricing via Korean SkyPass and other SkyTeam partners. The full award chart lives on the [Flying Blue page](/programs/flying-blue); key cells for KLM as of May 2026:

| Route | Cabin | Best path | Approx. miles one-way |
|---|---|---|---|
| US-AMS | Business | Flying Blue dynamic | 60,000-100,000 |
| US-AMS | Business | Flying Blue Promo Rewards | 30,000-75,000 (during promo) |
| US-AMS | Business | Korean SkyPass | ~80,000 RT historical (verify) |
| US-AMS | Premium Comfort | Flying Blue dynamic | 40,000-70,000 |
| US-AMS | Economy | Flying Blue dynamic | 25,000-50,000 |
| US-AMS | Economy | Flying Blue Promo (rotating) | 12,000-25,000 each way |

Verify Promo Reward routes on flyingblue.com - they rotate monthly.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'klm';

-- ============================================================
-- 7. AIR CANADA (Star Alliance, YYZ + YVR + YUL)
-- ============================================================
update programs set
  type = 'airline',
  name = 'Air Canada',
  alliance = 'star_alliance',
  hubs = ARRAY['YYZ','YVR','YUL'],
  intro = 'Air Canada is the Toronto-based flag carrier of Canada (founded 1937), with a separate loyalty program (Aeroplan) that crazy4points covers in detail on its own page. The fleet runs roughly 190 aircraft: A220, A320/321 family, A330-300, 737 MAX 8/9, 777-200LR/300ER, 787-8/9. Hubs are YYZ (Toronto Pearson) primary, YVR (Vancouver), and YUL (Montreal). US gateway coverage is unmatched among non-US carriers - 50+ US cities served from Canadian hubs, essentially every major US metro.

Air Canada Signature Class (long-haul Business) is one of the better North American premium-cabin products: 1-1-1 reverse herringbone lie-flat on 787, 777, A330. The Signature Suite at YYZ, YVR, LHR, and YUL is a tier-above-lounge dining experience for Signature Class international passengers, separate from the Maple Leaf Lounge network. The standout Aeroplan-driven sweet spot for AC metal: NO fuel surcharges on partner-program-issued AC awards since 2020. That fuel-surcharge-free policy is the headline value of Aeroplan and a structural advantage when redeeming on AC vs. virtually any other long-haul Star carrier. Award chart and tier benefits live on the Aeroplan page.',
  how_to_spend = '- **AC Signature Class via Aeroplan partner award** - no fuel surcharges on AC metal. Headline value.
- **US-Asia / US-Europe via AC metal on Aeroplan** at chart-priced saver rates (verify post-June-2026 chart updates).
- **Intra-North America on AC short-haul** from 6,000 Aeroplan economy.
- **Bilt 1:1 to Aeroplan** as the cleanest US-flexible-currency path.
- **Amex MR 1:1 to Aeroplan** for direct US-AC redemption funding.
- **Chase UR 1:1 to Aeroplan** since the partnership launched 2024.',
  sweet_spots = '- **AC Signature Class with no fuel surcharges via Aeroplan** - structural advantage vs. heavy-YQ Star carriers (Lufthansa, SWISS).
- **Signature Suite at YYZ, YVR, LHR, YUL** - tier-above-lounge dining for Signature Class international passengers.
- **Intra-North America from 6,000 Aeroplan** - cheapest short-haul redemptions in the Star world.
- **AC metal on long-haul (787, 777, A330) all have lie-flat 1-1-1 J seats** - consistent premium product.
- **A220 fleet expansion** for thinner US routes from Canadian hubs.
- **Maple Leaf Lounges at hubs + select international** - solid Star Gold lounge network.',
  lounge_access = 'Air Canada operates Maple Leaf Lounges across its hubs (YYZ, YVR, YUL) and select international (LHR, etc.). Signature Suites at YYZ, YVR, LHR, and YUL provide a tier-above dining experience for Signature Class international passengers (separate from Maple Leaf). Aeroplan 50K and above (Star Gold) plus same-day AC business passengers get Maple Leaf access. Star Alliance Gold from any partner gets reciprocal lounge access on same-day Star international flights.',
  quirks = '- **NO fuel surcharges on partner-program-issued AC awards since 2020** - the headline value of Aeroplan and a structural advantage vs. heavy-YQ Star carriers.
- **Signature Suite at YYZ, YVR, LHR, YUL** - separate from Maple Leaf Lounges; pre-flight dining for international Signature Class.
- **Air Canada Cafe** - light premium product on select routes, between standard and Maple Leaf.
- **A220 fleet expansion** for thinner US-Canada and intra-Canada routes.
- **50+ US cities served from Canadian hubs** - widest US footprint among non-US flag carriers.
- **Aeroplan partner-chart updates June 2026** - verify pricing on aeroplan.com after that date for current bands.
- **Founded 1937** - one of the oldest continuously operating North American carriers.
- **Award chart and tier benefits live on the Aeroplan page** - this carrier page references the umbrella.',
  award_chart = 'AC metal redeems at the Aeroplan partner-chart distance/region-band pricing. The full award chart lives on the [Aeroplan page](/programs/aeroplan); key cells for AC as of May 2026 (verify post-June-2026 chart updates):

| Route | Cabin | Aeroplan miles one-way |
|---|---|---|
| Intra-North America short-haul | Economy | 6,000-12,500 |
| US-Canada transcon | Economy | 12,500-15,000 |
| US-Canada transcon | Business (Signature) | 25,000-35,000 |
| North America-Europe | Business (Signature) | 60,000-70,000 |
| North America-Asia | Business (Signature) | 75,000-87,500 |
| Within North America | Business | 15,000-25,000 |

NO fuel surcharges on AC metal via Aeroplan since 2020. Verify on aeroplan.com.',
  is_active = true,
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'air-canada';
