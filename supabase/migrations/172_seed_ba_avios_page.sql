-- Seed The British Airways Club / Avios full program page (Batch A #4).
--
-- Authored 2026-05-06. Sources: official BA pages (britishairways.com Club
-- T&C, tier point earning, partners, redemption, media centre) + 2026-dated
-- travel publications (The Points Guy, Head for Points, Upgraded Points,
-- AwardWallet, Frequent Miler, LoyaltyLobby, AwardFares, Award Travel
-- Finder, Sunset Weekly).
--
-- Three major 2024-2026 program events:
--   - Dec 30, 2024: Rebrand from "British Airways Executive Club" to "The
--     British Airways Club" + tier-point earning model overhaul.
--   - Dec 15, 2025: Avios redemption chart devaluation (8-14% more Avios on
--     most routes) + cash surcharge increases of up to 20%.
--   - Apr 1, 2026: New tier-point bonuses based on fare type (not just
--     cabin class), bonus tier points on AA + Iberia flights, add-on
--     purchases (seats/bags) now earn tier points at 2 TP per £1.
--
-- Lean Path-2 shape: structural overview in award_chart + sweet-spot
-- narrative + link to official chart. Tool-shaped data lives in
-- partner_redemptions for the Booking Tool.

update programs set
  alliance = 'oneworld',
  hubs = array['LHR','LGW'],
  intro = 'The British Airways Club (rebranded from "British Airways Executive Club" on December 30, 2024) is the loyalty program of British Airways and the original home of the Avios currency now shared across BA, Iberia, Aer Lingus, and Vueling. BA is a oneworld alliance member with primary hubs at London Heathrow (LHR) and London Gatwick (LGW). Avios is **the most-transferable airline currency for US-based readers** - it transfers 1:1 from Amex Membership Rewards, Chase Ultimate Rewards, Capital One Miles, Bilt Rewards, and Wells Fargo Rewards. Citi ThankYou does not transfer directly but reaches Avios indirectly via Qatar Privilege Club (1:1 from Citi to Qatar, then 1:1 to BA Avios).

The BA Avios program has two structural personalities. **Short-haul intra-Europe redemptions are excellent** - distance-banded pricing starts around 4,000 Avios one-way for routes like London-Paris/Amsterdam/Dublin, with manageable cash surcharges. **Long-haul BA-operated redemptions carry heavy carrier-imposed surcharges** - a transatlantic Business class round-trip can incur £400-1,000+ in cash YQ on top of the Avios cost. The classic move is to use Avios on partner metal (AA, Alaska, Cathay, JAL, Qantas, Iberia) where BA''s YQ does not apply.

December 15, 2025 brought a chart devaluation: Avios redemption costs rose 8-14% on most routes and cash surcharges rose up to 20%. April 1, 2026 added new tier-point earning bonuses based on fare type, plus tier-point earning on add-on purchases (seats, extra bags).',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"No US federal excise tax - foreign carrier. One of the most-transferred Amex partners.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"No fee. Periodic 25-30% transfer bonuses are common.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"No tax. BA was added in 2021 at 2:1.5; moved to 1:1 later.","bonus_active":false},
    {"from_slug":"bilt-rewards","ratio":"1:1","notes":"No tax. Rent Day 2x bonuses on transfers periodically (1st of each month).","bonus_active":false},
    {"from_slug":"wells-fargo-rewards","ratio":"1:1","notes":"No tax. No minimum transfer amount.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Avios (5K bonus on every 60K).","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Short-haul intra-Europe Economy** - 4,000-12,000 Avios one-way depending on distance band. London-Paris/Amsterdam/Dublin are headline 4K Avios routes. Reward Flight Saver feature caps cash surcharges on short-haul.
- **AA / Alaska partner awards in North America** - BA Avios prices distance-banded on AA and Alaska metal with NO BA-style fuel surcharges. US transcontinental Economy can run 13,000-26,000 Avios one-way; short-haul AA between US cities can be 7,500-9,000 Avios.
- **JAL Business class to Tokyo** - one of the program''s flagship sweet spots. Note: BA prices JAL and Cathay redemptions higher than other oneworld partners on the multi-carrier chart.
- **Iberia transatlantic** - same Avios but typically lower YQ than BA-operated.
- **Cathay Pacific Business / First class** to Asia.
- **Qantas premium cabins** to Australia.
- **Aer Lingus to Dublin from US East Coast** - lower fuel surcharges than BA-operated routes.
- **Hotels, BA Holidays packages, gift card and merchandise redemptions** at Avios.com - generally poor cents-per-Avios value but available at low balances.
- **Reward Flight Saver** on short-haul - fixed cash component instead of full surcharges (Economy/Premium Economy short-haul).',
  sweet_spots = '- **Short-haul intra-Europe at 4,000 Avios one-way** is BA Avios''s most enduring sweet spot. London-Paris, London-Amsterdam, London-Dublin, London-Berlin all price at the lowest distance band off-peak. Pair with Reward Flight Saver for capped cash surcharges.
- **AA partner short-haul in North America** - 7,500-9,000 Avios for short hops on AA metal (LAX-SFO, DFW-AUS-style routes). No BA-style YQ on partner metal. The Avios-to-AA-flight pipeline is one of the best uses for transferred Chase/Amex/Bilt points.
- **Alaska partner awards** - similar story to AA. 7,500-12,500 Avios for many North America segments, no fuel surcharges.
- **JAL First class US-Tokyo** - approximately 130,000-160,000 Avios one-way (priced higher on the multi-carrier chart vs other oneworld partners but still competitive given JAL F is premium-cabin gold).
- **Aer Lingus US-Dublin Business class** - 60,000-72,500 Avios one-way; lower YQ than BA-operated transatlantic Business at similar Avios cost.
- **Avoid BA-operated long-haul Business class for transatlantic** - the £400-1,000+ in YQ surcharges typically erodes the Avios value below 1 cent per Avios. Use Iberia, Aer Lingus, AA, or Cathay metal instead.
- **Most-transferable currency** - because Amex / Chase / Cap One / Bilt / Wells Fargo all transfer 1:1, you can hold any of them as flexible reserves and move them only when ready to book.',
  tier_benefits = '[
    {"name":"Bronze","qualification":"3,500 tier points within the April 1 - March 31 collection year (or 25 eligible flights with BA + partners)","benefits":["oneworld Ruby","Priority airport check-in at BA-operated airports","Free seat selection 7 days before flight","5% bonus Avios on flights"]},
    {"name":"Silver","qualification":"7,500 tier points within the April 1 - March 31 collection year (or 50 eligible flights with BA + partners)","benefits":["oneworld Sapphire","Priority airport check-in across oneworld","Lounge access (Business class lounges) on oneworld carriers worldwide for member + 1 guest","Free seat selection at booking","Priority boarding","25% bonus Avios on flights","Extra 12 kg checked baggage allowance"]},
    {"name":"Gold","qualification":"20,000 tier points within the April 1 - March 31 collection year (or 100 eligible flights with BA + partners)","benefits":["oneworld Emerald","First class lounge access on oneworld worldwide for member + 1 guest","Concorde Room access at LHR T5 + JFK T7 when traveling on BA-operated flights","Priority everything (boarding, baggage, irregular ops)","Guaranteed Economy seat on BA flights when booked 24+ hours in advance","100% bonus Avios on flights","Extra 20 kg checked baggage allowance"]},
    {"name":"Gold for Life","qualification":"550,000 lifetime tier points (introduced when The British Airways Club launched in April 2025)","benefits":["All Gold tier benefits, permanently","Status retained regardless of annual flight activity","Lifetime oneworld Emerald reciprocity"]}
  ]'::jsonb,
  lounge_access = 'British Airways operates the **British Airways Lounge** network at LHR (multiple terminals), LGW, JFK T7, and other major gateways. BA also operates the exclusive **Concorde Room** at LHR Terminal 5 and JFK Terminal 7 - a separate, more exclusive lounge above the standard First Class lounge.

Access rules:
- **Same-day BA / oneworld flight + oneworld Sapphire (Silver) status** - BA Business class lounges (Galleries Club / equivalent) for member + 1 guest, any cabin.
- **Same-day BA / oneworld flight + oneworld Emerald (Gold) status** - BA First lounges + Concorde Room (Concorde Room only on BA-operated flights at LHR T5 + JFK T7) for member + 1 guest, any cabin.
- **Same-day BA First Class boarding pass at LHR T5 / JFK T7** - Concorde Room access regardless of status.
- **Same-day BA Business / Club World boarding pass** - BA Business lounges in any context.
- **Same-day BA Premium Economy or Economy on its own** - no lounge access without status.

Single-visit / day passes: BA does sell paid lounge access at some airports (typically £35-50 per person), check the specific airport.',
  quirks = '- **Distance-based partner award chart with 9 zones.** Pricing is fixed per zone + cabin (not a "starting from" range). Cathay Pacific and JAL are priced higher than other oneworld partners on the same chart.
- **Heavy carrier-imposed surcharges (YQ) on BA-operated long-haul** - £400-1,000+ on a transatlantic Business class round-trip. This is the program''s biggest drawback. Surcharges do not apply on most partner metal (AA, Alaska, Cathay, JAL, Aer Lingus, Iberia, Qantas).
- **Reward Flight Saver** - fixed cash component (instead of full YQ) on short-haul Economy and Premium Economy. Does NOT apply to long-haul or to First class.
- **December 15, 2025 chart devaluation**: Avios redemption costs rose 8-14% on most routes; cash surcharges rose up to 20%; taxes/fees increased.
- **April 1, 2026 tier-point changes**:
  - Add-on purchases (seats, extra bags) now earn tier points at 2 TP per £1
  - Bonus tier points based on fare type (not just cabin class)
  - Bonus tier points on American Airlines and Iberia flights (75 TP short-haul Economy, 150 TP long-haul Economy, etc.)
  - Sustainable Aviation Fuel earn doubled to 2 TP per £, capped at 2,000 TP/year
- **Collection year is April 1 - March 31** (not calendar year). Aligns with UK fiscal year.
- **Avios shared currency** across BA, Iberia, Aer Lingus, and Vueling. You can move Avios between programs (Iberia Plus has its own redemption chart with different sweet spots).
- **No mile expiry** as long as you have any qualifying Avios activity (earn or redeem) within 36 months.
- **Most-transferable currency**: Amex / Chase / Cap One / Bilt / Wells Fargo all transfer 1:1 directly. Citi via Qatar Privilege Club indirectly.
- **Partner award redemptions** allowed: Aer Lingus, Alaska Airlines, American Airlines, Cathay Pacific, Finnair, Iberia, LATAM, Malaysia Airlines, Qantas, Qatar Airways, Royal Jordanian, SriLankan Airlines.
- **Lifetime Gold tier (Gold for Life)** at 550,000 lifetime tier points (introduced April 2025).',
  award_chart = '## BA Avios redemption structure

BA Avios uses a **distance-banded chart with 9 zones**. Pricing is fixed per zone + cabin (not a "starting from" range). Cathay Pacific and JAL are priced higher on the same chart than other oneworld partners.

**Carrier-imposed surcharges (YQ):**
- **Heavy on BA-operated long-haul** - £400-1,000+ on a transatlantic Business class round-trip
- **Minimal or none on partner metal** - AA, Alaska, Cathay, JAL, Aer Lingus, Iberia, Qantas typically have low or zero YQ on Avios redemptions
- **Reward Flight Saver caps cash on short-haul** - fixed cash component on short-haul Economy and Premium Economy

**Recent chart events:**
- **December 15, 2025 devaluation**: Avios costs +8-14% on most routes; cash surcharges +up to 20%
- **April 1, 2026 tier-point changes**: add-on purchases earn TPs, fare-type bonuses on AA + Iberia flights, SAF earn rate doubled

**Notable redemption pricing (verify before booking):**
- London-Paris/Amsterdam/Dublin Economy off-peak: 4,000-6,500 Avios one-way
- AA short-haul Economy in North America: 7,500-9,000 Avios one-way
- US transcontinental Economy on AA: 13,000-26,000 Avios one-way
- US-Dublin Aer Lingus Business class: ~60,000-72,500 Avios one-way
- US-Tokyo JAL First class: ~130,000-160,000 Avios one-way (multi-carrier chart, premium pricing)

**Official chart hub:** https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/flights

For exact per-route pricing across all 9 distance bands and partners, use the official chart or the upcoming Booking Tool.

### US co-brand cards
British Airways has multiple Chase-issued US co-brand cards (British Airways Visa Signature, plus the related Aer Lingus and Iberia cards in the same Chase Avios family). All earn Avios directly. The flagship benefit on the British Airways Visa is the Travel Together Ticket (companion certificate after high spend), which can pair with an Avios redemption to bring a companion for free in any cabin (taxes/fees still apply). Annual fees and earn rates are documented on the dedicated card page.',
  partner_chart_url = 'https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/flights',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ba-avios';

-- Step 5.5 partner_redemptions: oneworld partners + key non-alliance carriers
-- BA Avios can book.
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + Avios partners (distance-banded, 9 zones)', 'fixed',
  'BA Avios uses a distance-banded chart with 9 zones. Cathay Pacific and JAL priced higher than other partners on the same chart. Carrier-imposed surcharges (YQ) are HEAVY on BA-operated metal (£400-1000 on transatlantic) and MINIMAL on most partner metal (AA, Alaska, Cathay, JAL, Aer Lingus, Iberia, Qantas). Dec 15 2025 devaluation +8-14% Avios on most routes. See partner_chart_url for the full chart.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'ba-avios' and c.slug in ('ba-avios','british-airways','aa','alaska','cathay','jal','finnair','iberia','latam','malaysia','qantas','qatar','royal_jordanian','srilankan','aer_lingus')
on conflict do nothing;

-- BA-operated separate row to capture the high YQ pattern.
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Economy', 'BA-operated short-haul intra-Europe (Reward Flight Saver)',
  'fixed',
  'Short-haul Economy on BA-operated metal uses Reward Flight Saver: fixed cash component instead of full YQ. London-Paris/Amsterdam/Dublin start around 4,000 Avios one-way off-peak. Reward Flight Saver does NOT apply to long-haul or First class.',
  'HIGH', current_date, true, 'low'
from programs p, programs c
where p.slug = 'ba-avios' and c.slug = 'british-airways'
on conflict do nothing;
