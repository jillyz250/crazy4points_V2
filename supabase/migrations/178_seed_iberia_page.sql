-- Seed Club Iberia Plus full program page (Batch A #5).
--
-- Authored 2026-05-06. Sources: official iberia.com pages (5 of 6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel publications
-- (NerdWallet, AwardWallet, Upgraded Points, Frugal Flyer, Frequent Miler,
-- The Points Guy, Award Travel Finder).
--
-- Two aggregator errors corrected (same as BA Avios):
--   ❌ US Bank Altitude Reserve: announced 2025, never launched any partners
--   ❌ Bank of America Premium Rewards: never been a transferable-points program
-- Real Iberia direct US transfer partner count: 5 (Amex / Chase / Cap One /
-- Bilt / Wells Fargo). Citi reaches Iberia indirectly via Qatar Privilege Club.
--
-- Major 2025-2026 program changes baked in:
--   - April 1, 2025: Iberia Plus rebranded to "Club Iberia Plus" + spend-based
--     Elite Points (€1 = 1 EP) replaced distance-based qualification.
--   - Platino Prime is a new tier introduced April 2025 at 30K EP.
--   - June 2025: Award chart devaluation - East Coast-MAD biz +19%
--     (34K -> 40,500 Avios off-peak); some economy routes saw small decreases.
--   - March 2026: ORD route repriced into 4,001-5,500 mi band (econ 16K->20K,
--     biz 40,500->50,500).

update programs set
  alliance = 'oneworld',
  hubs = array['MAD'],
  intro = 'Club Iberia Plus is the loyalty program of Iberia, the Spanish flag carrier and a oneworld alliance member with its primary hub at Madrid-Barajas (MAD, Terminals 4/4S). Club Iberia Plus uses **Avios** as its currency - the same currency as British Airways Club, Aer Lingus AerClub, Vueling Club, Finnair Plus, Qatar Privilege Club, and Loganair - but holds Avios in a separate account from those programs and prices redemptions on a separate, distinctly cheaper chart.

Iberia is the **classic transatlantic Avios sweet spot for US-based readers**. Same Avios redeemed through Iberia rather than BA typically saves $300-500+ in cash surcharges per round-trip Business class ticket plus 0-19% in Avios depending on route and date. The headline redemption is **MAD-JFK / MAD-BOS / MAD-IAD Business class at 40,500 Avios one-way off-peak** (~16,000 economy off-peak) on the new A350-900 lie-flat suite product. Surcharges typically run €30-€80 per one-way to the US, vs hundreds on BA-operated equivalents.

April 1, 2025 brought a major program reset: rebrand to "Club Iberia Plus", spend-based Elite Points replacing distance-based qualification, and a new "Platino Prime" tier above Platino. June 2025 brought an award chart devaluation that raised East Coast-MAD Business by ~19%. March 2026 repriced ORD into a longer distance band. Even after both adjustments, Iberia remains one of the strongest premium-cabin transatlantic redemptions in the game.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax pass-through. Transfer time instant to 2 days.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"No transfer fee. Periodic transfer bonuses common.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"No transfer tax.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"No transfer tax. Rent Day 2x bonuses periodically.","bonus_active":false},
    {"from_slug":"wells-fargo-rewards","ratio":"1:1","notes":"No transfer tax. No minimum transfer amount.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Avios (5K bonus on every 60K transferred). Currently routes through BA Avios first, then Combine My Avios to Iberia.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Transatlantic Business class on Iberia A350** - the headline use case. MAD-JFK / BOS / IAD / SJU at 40,500 Avios one-way off-peak; MAD-ORD / MIA / MCO / DFW at 50,500; MAD-LAX / SFO at 60,500. Plus minimal cash surcharges (€30-€80 each way to the US).
- **Latin America premium cabins via Madrid** - MAD-Buenos Aires, Bogota, Lima, Mexico City, Sao Paulo from 50,500-60,500 Avios Business class one-way off-peak. Iberia has the deepest European-to-LatAm network.
- **Intra-Spain and intra-Europe short hops** - 3,500 Avios one-way Economy off-peak in the 0-650 mile band (e.g., BCN-AGP, MAD-LIS).
- **oneworld partner awards** - 12 oneworld partners (Alaska, AA, BA, Cathay, Finnair, JAL, Malaysia, Qantas, Qatar, Royal Air Maroc, Royal Jordanian, SriLankan).
- **IAG family redemptions** - book BA, Aer Lingus, Vueling, or LEVEL flights through Club Iberia Plus.
- **Group bookings up to 9 passengers** on a single award reservation - one of the most generous group caps in the industry. Useful for family / group travel.',
  sweet_spots = '- **MAD-JFK / BOS / IAD Business class** at 40,500 Avios one-way off-peak (~$75-100 in taxes/fees). Round-trip = 81,000 Avios + ~$150-200 cash. Compare to BA''s identical Avios cost + $400-1,000 in YQ surcharges.
- **MAD-South America Business** at 50,500-60,500 Avios one-way off-peak. Iberia is the most extensive European carrier into Latin America - nine LatAm gateways from MAD - and surcharges stay low.
- **Combine My Avios arbitrage** - if you have Avios in your BA Club account that would price higher or carry heavier YQ, transfer them to Club Iberia Plus instantly via Combine My Avios and book on Iberia''s cheaper chart. This is one of the most reliably valuable points-arbitrage moves in the game.
- **Off-peak savings ~30%** versus peak. Iberia publishes a peak/off-peak calendar each year; US holidays not celebrated in Spain (Memorial Day, Thanksgiving, MLK Day) often fall in off-peak windows.
- **Promotional 30% off Avios sales** appear roughly twice a year on selected routes - watch the iberia.com promotions page.
- **Group bookings up to 9 passengers** on a single award reservation - rare in this industry.',
  tier_benefits = '[
    {"name":"Clasica","qualification":"Free entry tier. No EP threshold.","benefits":["Earn 5 Avios per €1 of net spend on Iberia / Iberia Express / Iberia Regional flights","Basic program access","Member-only offers"]},
    {"name":"Plata (Silver)","qualification":"3,500 Elite Points OR 20 segments on Iberia / Iberia Express in a calendar year","benefits":["oneworld Ruby","6 Avios per €1 on Iberia flights","Priority airport check-in","Extra checked baggage allowance","Air Shuttle (MAD-BCN) bonus +1 Avios/€1","Latin America bonus +2 Avios/€1"]},
    {"name":"Oro (Gold)","qualification":"7,500 Elite Points OR 40 segments","benefits":["oneworld Sapphire","7 Avios per €1 on Iberia flights","Business class lounge access on oneworld carriers worldwide for member + 1 guest","Priority boarding and baggage delivery","Higher checked bag allowance"]},
    {"name":"Platino","qualification":"20,000 Elite Points OR 90 segments (effectively 19,000 EP due to a 1,000 EP bonus awarded at 18,000)","benefits":["oneworld Emerald","8 Avios per €1 on Iberia flights","First class lounge access on oneworld worldwide for member + 1 guest","Upgrade vouchers (4 per qualifying year, per Iberia''s standard policy)","Guaranteed Economy seat on Iberia flights","Higher checked bag allowance"]},
    {"name":"Platino Prime (NEW April 2025)","qualification":"30,000 Elite Points (no segment shortcut at this tier)","benefits":["All Platino benefits","Enhanced upgrade vouchers","Additional partner benefits","Top-tier annual recognition below the lifetime tiers"]},
    {"name":"Infinita","qualification":"400,000 lifetime Elite Points","benefits":["All Platino Prime benefits","Lifetime oneworld Emerald","9 Avios per €1 on Iberia flights","Free Madrid home baggage collection service"]},
    {"name":"Infinita Prime","qualification":"640,000 lifetime Elite Points","benefits":["All Infinita benefits","Top-tier lifetime perks","Highest concierge access"]}
  ]'::jsonb,
  lounge_access = 'Iberia operates the **Iberia Premium Lounge** and **Iberia Velazquez Lounge** at Madrid-Barajas (Terminal 4 + 4S) and lounge facilities at select international gateways.

Access rules:
- **Same-day Iberia / oneworld flight + oneworld Sapphire (Oro) status** - Iberia Premium / Business lounges for member + 1 guest, any cabin.
- **Same-day Iberia / oneworld flight + oneworld Emerald (Platino+ ANA tiers, BA Gold, AA Executive Platinum, etc.)** - Iberia Velazquez (First Class) lounge for member + 1 guest.
- **Same-day Iberia Business class boarding pass** - Iberia Premium / Business lounge access in any cabin-paid context.
- **Same-day Iberia Premium Economy or Economy alone** - no lounge access without status.

Iberia does not operate paid day-pass entry for the Velazquez / Premium lounges. Access is by status or premium cabin only.

The closest US analog: oneworld Emerald (Platino and above) gets you into Iberia''s top lounges plus First class lounges across all oneworld carriers worldwide.',
  quirks = '- **Award chart is distinct from BA''s.** Same Avios currency, completely separate chart. Iberia''s prices are often equal or LOWER than BA''s for the same route in business class, AND Iberia''s cash surcharges are dramatically lower (€30-€80 to the US vs $300-600+ on BA).
- **Combine My Avios** lets you transfer Avios 1:1 instantly between Club Iberia Plus, BA Club, AerClub, Vueling Club, Loganair, and (via BA as a routing waypoint) Qatar Privilege Club + Finnair Plus. New 30-day account-age requirement applies as of 2026.
- **Spend-based Elite Points since April 1, 2025** - €1 of eligible net spend on Iberia / Iberia Express / Iberia Regional = 1 EP. Up to 30% of required EPs may come from partner spending (10 Avios earned with partners = 1 EP).
- **Per-tier Avios earning on Iberia flights** (net spend basis, excludes government taxes): Clasica 5 / Plata 6 / Oro 7 / Platino + Platino Prime 8 / Infinita + Infinita Prime 9 Avios per €1.
- **Air Shuttle bonus +1 Avios/€1** on MAD-BCN.
- **Latin America bonus +2 Avios/€1** on flights to Latin American destinations.
- **Group bookings up to 9 passengers** on one reservation. Excellent for families pooling Avios from multiple credit card sources.
- **Off-peak / peak calendar** drops Avios cost ~30% on off-peak dates. US holidays not celebrated in Spain often fall off-peak.
- **No US-issued co-brand credit card.** Iberia offers co-brand Visa cards in Spain and select EU markets only. US enthusiasts go via flexible-currency transfer.
- **Combine My Avios arbitrage**: transfer Citi ThankYou to Qatar Privilege Club, then Combine My Avios from Qatar to Iberia. Indirect path that unlocks Iberia for Citi cardholders despite the lack of direct Citi -> Iberia transfer.',
  award_chart = '## Club Iberia Plus redemption structure

Iberia uses a **distance-banded chart with 9 zones**, with peak and off-peak pricing on each cell. Pricing is **fixed per band + cabin + season**, not a "starting from" range.

**Carrier-imposed surcharges (YQ):** Iberia keeps surcharges low across the board - typically **€30-€80 per one-way to the US** vs hundreds on BA-operated identical routes. This is one of the program''s biggest structural advantages.

**Off-peak vs peak:** Off-peak dates save approximately 25-35% on Avios. Iberia publishes a peak/off-peak calendar each year. Many US holidays not celebrated in Spain (Memorial Day, Thanksgiving, MLK Day) often fall in off-peak windows.

### Standard one-way award chart (off-peak; June 2025 chart)

| Distance band (mi) | Economy off-peak | Premium Economy off-peak | Business off-peak |
|---|---|---|---|
| 1-650 | 3,500 | n/a | 9,750 |
| 651-1,150 | 6,500 | n/a | 16,500 |
| 1,151-2,000 | 9,500 | n/a | 22,000 |
| 2,001-3,000 | 10,500 | n/a | 23,000 |
| 3,001-4,000 | 16,000 | 29,500 | 40,500 |
| 4,001-5,500 | 20,000 | 36,750 | 50,500 |
| 5,501-6,500 | 24,000 | 44,000 | 60,500 |
| 6,501-7,000 | 28,250 | 51,000 | 70,500 |
| 7,001+ | 41,000 | 71,000 | 97,000 |

Peak pricing is roughly 25-50% higher on the Avios component (e.g., MAD-JFK Business jumps to 59,000 peak vs 40,500 off-peak).

### Notable redemption pricing
- **MAD-JFK / BOS / IAD / SJU Business off-peak**: 40,500 Avios + ~$75-100 cash (3,001-4,000 mi band)
- **MAD-ORD / MIA / MCO / DFW Business off-peak**: 50,500 Avios (4,001-5,500 mi band; ORD repriced March 2026)
- **MAD-LAX / SFO Business off-peak**: 60,500 Avios (5,501-6,500 mi band)
- **MAD-Buenos Aires Business off-peak**: 60,500 Avios (5,501-6,500 mi band)
- **Intra-Spain Economy**: 3,500 Avios (BCN-AGP, etc.)

### Recent chart events
- **June 2025 devaluation**: East Coast-MAD Business +19% (34,000 -> 40,500 off-peak); some Economy routes saw small decreases.
- **March 2026**: ORD route repriced into 4,001-5,500 mi band (Economy 16K->20K, Business 40,500->50,500 off-peak).

### Combine My Avios programs
You can transfer Avios 1:1 between Club Iberia Plus, BA Club, AerClub (Aer Lingus), Vueling Club, and Loganair Loyalty directly. Qatar Privilege Club and Finnair Plus transfers route through BA Club.

**Official chart:** https://www.iberia.com/us/iberia-plus/spend-avios/

### No US co-brand card
Iberia does not have a US-issued co-brand credit card. The path to Iberia Avios for US-based readers is flexible-currency transfer from Amex / Chase / Capital One / Bilt / Wells Fargo - or Citi / BA via the Combine My Avios family.',
  partner_chart_url = 'https://www.iberia.com/us/iberia-plus/spend-avios/',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'iberia';

-- Step 5.5 partner_redemptions: oneworld partners + IAG family
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + IAG partner awards (distance-banded, peak/off-peak)', 'fixed',
  'Iberia uses a distance-banded chart with 9 zones, peak and off-peak pricing per cell. Fixed value per band + cabin + season. Carrier-imposed surcharges (YQ) are LOW: typically €30-80 to the US (vs $300-600+ on BA). June 2025 devaluation raised East Coast-MAD biz +19%. March 2026 repriced ORD. See partner_chart_url for the official chart.',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'iberia' and c.slug in ('iberia','ba-avios','british-airways','aer_lingus','vueling','aa','alaska','cathay','jal','finnair','malaysia','qantas','qatar','royal_jordanian','srilankan')
on conflict do nothing;
