-- Seed Cathay Pacific Asia Miles full program page (Batch A #7).
--
-- Authored 2026-05-06. Sources: official cathaypacific.com pages (6/6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel publications
-- (The Points Guy, MileLion, Mainly Miles, SuitesSmile, Upgraded Points,
-- AwardWallet, point.me, NerdWallet).
--
-- Three major 2025-2026 events:
--   - October 2025: Major program overhaul ANNOUNCED (effective January 2027,
--     with 2026 as transition year). Status Points no longer reset on tier
--     qualification, calendar-year cycle, rollover up to 50% of excess SPs,
--     new Diamond Exec tier at 2,400 SP, Diamond Reserve lifetime banking.
--   - March 1, 2026: Amex MR -> Asia Miles ratio reduced from 1:1 to 5:4.
--   - May 1, 2026: Award chart adjustments. Long-haul J/F priced UP
--     (US-HKG Business +4K from 115K -> 119K; ultra-long-haul F +5K).
--     Some short-haul J priced DOWN (BKK J 28K -> 27K).
--
-- Lean Path-2 shape: structural overview in award_chart + sweet-spot narrative
-- + link to official chart. Tool-shaped data lives in partner_redemptions.

update programs set
  alliance = 'oneworld',
  hubs = array['HKG'],
  intro = 'Cathay Pacific Asia Miles is the loyalty program of Cathay Pacific, a oneworld founding member with its hub at Hong Kong International (HKG). The program is part of the unified "Cathay" membership brand (rebranded in 2023, retiring the legacy Marco Polo Club name); Asia Miles is the reward currency, and **Status Points** are the tier qualification currency. The flagship redemption product is the Aria Suites Business class on Cathay''s 777-300ER fleet, plus the legacy First class cabin on select 777-300ER routes.

For US-based readers, Asia Miles changed materially in 2026. **March 1, 2026** dropped the Amex MR transfer ratio from 1:1 to 5:4, so 1,000 MR points now yield 800 Asia Miles. Citi ThankYou, Capital One Miles, and Bilt Rewards remain 1:1 - those are now the highest-value transfer paths. **May 1, 2026** brought a chart adjustment that nudged long-haul Business and First up modestly (US-HKG J 115K -> 119K one-way; ultra-long-haul F 155K -> 160K) while trimming a few short-haul Asia routes.

A bigger event is on the horizon: in October 2025, Cathay announced a **major program overhaul effective January 1, 2027** (with 2026 as a transition year). Status Points will no longer reset to zero on tier qualification, the membership cycle aligns to calendar year, Gold and above retain up to 50% of excess SPs into the next year, and a new ultra-elite **Diamond Exec** tier debuts at 2,400 SP. Plan tier-strategy decisions with this in mind.',
  transfer_partners = '[
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"Best 1:1 path post-March-2026 Amex devaluation. Periodic transfer bonuses common.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"Direct 1:1. No tax. Strong US earner via Venture X / Venture / Spark Miles.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"Direct 1:1. Rent Day 2x bonuses periodically.","bonus_active":false},
    {"from_slug":"amex-membership-rewards","ratio":"5:4","notes":"Reduced from 1:1 effective March 1, 2026. Now 1,000 MR -> 800 Asia Miles. Still usable for large balances; consider transferring elsewhere first.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Asia Miles (5K bonus on every 60K block). Generally only useful when Bonvoy points have no better home.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Long-haul Business class US-HKG on Cathay** at 119,000 Asia Miles one-way (post-May 1, 2026 chart). Aria Suites is one of the most acclaimed Business cabins in the sky.
- **First class US-HKG on Cathay** at 160,000 Asia Miles one-way - aspirational, scarce inventory, but available to Asia Miles redeemers (no other US-accessible program books CX First as cleanly).
- **Intra-Asia Business class** at 27,000 Asia Miles one-way for Type 1 routes under 2,750 mi (HKG-Bangkok, HKG-Singapore, HKG-Taipei, HKG-Seoul).
- **HKG-Tokyo First class** at 50,000 Asia Miles one-way - Type 2 short-haul but a strong First Class price for 1,800 mi.
- **HKG-Sydney / Melbourne Business** at 60,000 Asia Miles one-way (under 5,000 mi band).
- **One-way awards at 50% of round-trip** - useful for one-way trip planning.
- **Free stopover on round-trip awards** - one stopover allowed; a few partners may charge a Miles surcharge for additional stopovers.
- **Mixed-cabin awards** supported - each segment priced by its own cabin class.
- **Partner award redemptions** (oneworld + select non-alliance) - typically priced 30-50% higher than CX metal for the same distance band.
- **Cathay Shopping Portal + dining + hotel partners** - non-flight Asia Miles earn (mostly Asia-based; reset the 18-month activity clock at minimum).',
  sweet_spots = '- **HKG to Bangkok / Singapore / Taipei / Seoul Business class at 27,000 Asia Miles one-way** (Type 1 under 2,750 mi). One of the best regional Business class redemptions in any program worldwide.
- **US-HKG Aria Suites Business at 119,000 Asia Miles** delivers the strongest premium-cabin experience among realistic transfer-partner redemptions. At cash-fare equivalents of $5,000-7,000, this is roughly 4-6 cents per Asia Mile.
- **Citi ThankYou + periodic transfer bonuses** are now the cleanest path post-March 2026. Watch for Cathay-specific transfer bonuses across Citi / Capital One / Bilt.
- **Free HKG stopover** lets you visit Hong Kong for a few days while routing onward - effectively a multi-destination award at no extra Miles cost.
- **CX flights credited to Alaska Mileage Plan / AAdvantage / JAL Mileage Bank** can earn more valuable miles than crediting to Asia Miles for non-CX-loyal travelers. Consider crediting strategy if you don''t need CX status specifically.
- **Booking BA flights via Asia Miles** can yield lower fuel surcharges than booking the same BA flight via BA Avios - a notable workaround for the BA-YQ problem on transatlantic Business.
- **HKG-Tokyo First at 50K Asia Miles** is a strong First Class redemption per mile flown.
- **2027 program changes coming** - if you''re close to Diamond and reset would normally hurt, the no-more-reset rule starting 2027 could reshape your earning strategy.',
  tier_benefits = '[
    {"name":"Green","qualification":"Free auto-enrollment. No Status Points threshold.","benefits":["Earn Asia Miles + Status Points on flights","Priority online check-in (48 hours)","Cathay member service hotline","PressReader digital magazines / newspapers","Mid-tier lounge pass at 200 SP"]},
    {"name":"Silver","qualification":"300 Status Points (currently within an annual qualification window; calendar-year cycle from Jan 2027)","benefits":["oneworld Ruby","Priority airport check-in and boarding","+10 kg extra checked baggage allowance","Advance seat selection","Priority waitlist and standby"]},
    {"name":"Gold","qualification":"600 Status Points","benefits":["oneworld Sapphire","Cathay Business class lounge access (The Wing / The Pier / The Deck at HKG, plus partner Business lounges) for member + 1 guest","+15 kg extra checked baggage allowance","Complimentary upgrades subject to availability","Priority baggage handling","From January 2027: rollover up to 50% of excess Status Points into the next year"]},
    {"name":"Diamond","qualification":"1,200 Status Points","benefits":["oneworld Emerald","Cathay First class lounge access (The Pier First, The Wing First) for member + 1 guest","+20 kg extra checked baggage allowance","Guaranteed Economy booking within 24 hours of departure","Priority everything","Companion lounge access for one guest","From January 2027: rollover up to 50% of excess Status Points; multi-year Diamond Reserve banking for 5+ year Diamonds"]},
    {"name":"Diamond Exec (NEW from January 2027)","qualification":"2,400 Status Points in a single calendar year","benefits":["All Diamond benefits","Top-tier ultra-elite recognition","Additional perks to be announced ahead of January 2027 launch"]}
  ]'::jsonb,
  lounge_access = 'Cathay operates one of the most acclaimed lounge networks in the world at Hong Kong International. The flagship lounges:

| Lounge | Location | Notable feature |
|---|---|---|
| The Pier, Business | HKG | Noodle Bar, day suites, shower suites |
| The Wing, Business | HKG | Long Bar, shower rooms |
| The Deck | HKG | Outdoor terrace with runway views |
| The Pier, First Class | HKG | Day suites with daybeds, a-la-carte dining, bath suites |
| The Wing, First Class | HKG | Cabanas with bathtubs, Haven restaurant |

Access rules:
- **Same-day Cathay or oneworld flight + oneworld Sapphire (Gold) or higher** - Business class lounges (The Wing / The Pier / The Deck) for member + 1 guest, any cabin.
- **Same-day Cathay or oneworld flight + oneworld Emerald (Diamond) or higher** - First Class lounges (The Pier First / The Wing First) for member + 1 guest, any cabin.
- **Same-day Cathay First Class boarding pass** - First Class lounges in any context.
- **Same-day Cathay Business Class boarding pass** - Business lounges.
- **Premium Economy or Economy on Cathay** - no lounge access without status.

Cathay does not generally sell day passes for these lounges to non-status passengers. The **mid-tier lounge pass at 200 Status Points** for Green members is the closest no-status path.',
  quirks = '- **Asia Miles never expire as long as you earn or redeem at least once every 18 months.** Activity resets the entire balance''s 18-month clock. Easy resets: shopping through the Cathay portal, donating 100 Miles to the carbon-offset program.
- **One-way awards = 50% of round-trip pricing.** Useful for flexible itinerary planning.
- **One free stopover allowed on round-trip awards on CX-operated itineraries.** Additional stopovers may carry a Miles surcharge.
- **Mixed-cabin awards supported.** Each segment is priced by its own cabin class.
- **Cathay does pass through fuel surcharges on its own award flights.** US-HKG Business can carry $200-600+ in surcharges - factor this in versus the Avios-family alternatives.
- **Distance-based award chart with Type 1 / Type 2 split** for short-haul (1-2,750 mi). Type 2 routes (involving Bangladesh, India, Indonesia, Japan, Nepal, Sri Lanka) are priced higher than Type 1.
- **No published award chart** since April 2025 - rates have been community-reverse-engineered. Use the Cathay booking engine to confirm before transferring miles.
- **Booking window: up to 360 days in advance** for CX-operated flights.
- **March 1, 2026 Amex MR devaluation**: ratio dropped from 1:1 to 5:4 (1,000 MR -> 800 Asia Miles). Citi / Cap One / Bilt remain 1:1.
- **May 1, 2026 chart adjustments**: long-haul J/F slightly more expensive (US-HKG J +4K, ultra-long-haul F +5K); a few short-haul J redemptions slightly cheaper.
- **No Chase Ultimate Rewards transfer** to Asia Miles directly. Workaround: Chase -> BA Avios -> book CX partner awards via BA. The BA Avios -> CX partner path costs more in Avios but avoids the Asia Miles transfer-ratio decisions entirely.
- **No US-issued co-brand credit card.** Co-brand cards are HK / Asia-only.
- **2027 program overhaul coming** (announced October 2025): no more Status Points reset, calendar-year cycle, rollover up to 50% of excess SPs, new Diamond Exec tier at 2,400 SP, Diamond Reserve lifetime banking. 2026 is a transition year.',
  award_chart = '## Asia Miles redemption structure

Cathay Pacific uses **two parallel charts**:

| Chart | Routes | Pricing model |
|---|---|---|
| **CX-Operated Standard Awards** | Cathay Pacific + HK Express metal | Distance-banded; Type 1 / Type 2 split for short-haul; one-way at 50% of round-trip |
| **Partner Award Chart** | oneworld + select non-alliance partners | Distance-banded; typically 30-50% higher than CX metal for the same distance band |

**Carrier-imposed surcharges (YQ):** CX DOES pass through fuel surcharges on its own metal. US-HKG long-haul Business can carry $200-600+ in YQ. Partner-airline surcharges vary - some (BA, Lufthansa) substantial, some (AA, Alaska, JAL) low or zero.

**One free stopover** allowed on CX-operated round-trip awards.

**Booking window:** up to 360 days in advance.

### CX-operated standard awards (post-May 1, 2026 chart)

| Distance band (mi) | Economy | Premium Economy | Business | First |
|---|---|---|---|---|
| 1-750 | 7,000 | 11,000 | 16,000 | n/a |
| 751-2,750 (Type 1) | 9,000 | 18,000 | 27,000 | 43,000 |
| 751-2,750 (Type 2) | 13,000 | 23,000 | 33,000 | 50,000 |
| 2,751-5,000 | 20,000 | 39,000 | 60,000 | 90,000 |
| 5,001-7,500 | 27,000 | 52,000 | 91,000 | 125,000 |
| 7,501+ | 38,000 | 78,000 | 119,000 | 160,000 |

(Type 1 = routes not involving Type 2 countries. Type 2 = routes to/from Bangladesh, India, Indonesia, Japan, Nepal, Sri Lanka.)

### Partner award chart (approximate; reverse-engineered from community data)

| Distance band (mi) | Economy | Business | First |
|---|---|---|---|
| 1-750 | 10,000 | 20,000 | n/a |
| 751-2,750 | 15,000 | 40,000 | 57,000 |
| 2,751-5,000 | 25,000 | 65,000 | 85,000 |
| 5,001-7,500 | 30,000 | 90,000 | 115,000 |
| 7,501+ | 42,000 | 110,000 | 150,000 |

### Earning rates on CX flights (% of distance flown)
- First (F, A): 150%
- Business (J, C, D): 125%
- Business discounted (I, R): 110%
- Premium Economy (W, E): 110% / R fare 100%
- Economy Flex (Y, B): 100%
- Economy Essential (H, K, M): 50-75%
- Economy Light (L, V, S, N, Q): 25-50%

Plus tier bonus: Silver 25%, Gold 75%, Diamond 100% (assumed forward-looking; verify on cathaypacific.com).

### Notable redemption pricing
- US-HKG Business: 119,000 Asia Miles one-way (post-May 1, 2026)
- US-HKG First: 160,000 Asia Miles one-way
- HKG-Bangkok / Singapore / Taipei / Seoul Business: 27,000 Asia Miles one-way (Type 1 short-haul)
- HKG-Tokyo First: 50,000 Asia Miles one-way (Type 2 short-haul)
- HKG-Sydney / Melbourne Business: 60,000 Asia Miles one-way

### What does NOT transfer to Asia Miles
- **Chase Ultimate Rewards** - no direct transfer. Workaround: Chase -> BA Avios -> book CX partner awards via BA Avios.
- **Wells Fargo Rewards** - no transfer.
- **US Bank Rewards** - no transfer.

### No US co-brand card
Cathay does not have a US-issued co-brand credit card. Co-brand cards are HK / Asia-only (e.g., Standard Chartered Cathay Mastercard). US readers reach Asia Miles via flexible-currency transfer.',
  partner_chart_url = 'https://flights.cathaypacific.com/en_US/redeem-flights/flight-award-chart.html',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'cathay';

-- Step 5.5 partner_redemptions: oneworld + key non-alliance partners
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + Asia Miles partner awards (distance-banded, post-May 2026 chart)', 'fixed',
  'Asia Miles partner chart is distance-banded with Type 1 / Type 2 split for short-haul. Partner awards typically 30-50% higher than CX-operated metal for same distance. Partner fuel surcharges vary - low on AA/Alaska/JAL, substantial on BA/Lufthansa. May 1 2026 chart adjustment: long-haul J/F priced UP, some short-haul J priced DOWN.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'cathay' and c.slug in ('cathay','cathay-pacific','aa','alaska','ba-avios','jal','finnair','iberia','malaysia','qantas','qatar','royal_jordanian','srilankan')
on conflict do nothing;

-- CX-operated awards row (with stopover quirk + Type 1/Type 2 split + YQ pass-through)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Business', 'CX-operated awards (distance-banded, Type 1/Type 2 split, free stopover)', 'fixed',
  'Cathay-operated awards: distance-banded chart with Type 1 / Type 2 split for short-haul (Type 2 = routes to/from Bangladesh, India, Indonesia, Japan, Nepal, Sri Lanka, priced higher). One-way at 50% of round-trip. One free stopover on round-trip CX awards. Cathay DOES pass through fuel surcharges on its own metal (US-HKG long-haul J = $200-600+ YQ). Post-May 1 2026 chart: US-HKG J 119K, F 160K, intra-Asia Type 1 J 27K.',
  'HIGH', current_date, true, 'high'
from programs p where p.slug = 'cathay'
on conflict do nothing;
