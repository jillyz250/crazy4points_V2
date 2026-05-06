-- Seed Qantas Frequent Flyer full program page (Batch A #10).
--
-- Authored 2026-05-06. Sources: official qantas.com pages (5/6 scrapes
-- succeeded) + Copilot Master Fact Sheet + 2026-dated travel publications.
--
-- Major 2025 events:
--   - August 5, 2025: Classic Reward chart devaluation (~10-20% increase).
--     Same day: Emirates Classic Rewards moved to the cheaper Qantas table
--     (previously priced on the more expensive Partner table) - partial
--     offset for the general increase.
--   - August 2025: Carrier surcharges raised dramatically on premium cabins
--     (SYD-LHR Business RT A$473 -> A$648). Further increases in early 2026.
--   - September 15, 2025: Loyalty Bonus moved to Status-Credits-only (the
--     points option was removed).
--   - May 2026: Capital One 20% transfer bonus active through May 31.

update programs set
  alliance = 'oneworld',
  hubs = array['SYD','MEL','BNE','PER'],
  intro = 'Qantas Frequent Flyer is the loyalty program of Qantas Airways - the world''s oldest continuously operating airline (founded 1920) and a oneworld founding member. Qantas operates from Sydney (SYD) primary, with secondary hubs at Melbourne (MEL), Brisbane (BNE), and Perth (PER). The flagship product is the A380 First Class on transpacific US-Australia routes, plus the new A321XLR fleet for medium-haul. Project Sunrise (A350-1000ULR) is on order for late 2026 deliveries.

For US-based readers, Qantas has a defining structural advantage and a defining drawback. **Advantage:** transfer partners. Amex Membership Rewards, Capital One Miles, Citi ThankYou (premium cards 1:1, no-AF cards 1:0.7), and Brex Rewards all transfer 1:1. Capital One has a 20% transfer bonus active through May 31, 2026. **Drawback:** carrier-imposed surcharges on Classic Flight Rewards. As of August 2025, a SYD-LAX Business Class round-trip can carry over A$1,050 (~US$700) in carrier charges on top of the points. First Class is even higher. Emirates premium cabin surcharges remain among the highest globally.

The program changed materially in 2025. **August 5, 2025**: Classic Reward chart devaluation of 10-20% across most zones. Emirates simultaneously moved to the cheaper Qantas table - a partial offset. **September 15, 2025**: the Loyalty Bonus is now Status-Credits-only (the previous option to take it as points was removed). Award redemptions remain on the fixed zone-distance chart - no shift to dynamic pricing.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax. Periodic 20% bonus transfers (~3-4x per year). Cards: Platinum, Gold, Green, Business Platinum, Business Gold.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"Direct 1:1. 20% transfer bonus active through May 31, 2026. Cards: Venture X, Venture, Spark Miles.","bonus_active":true},
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"Direct 1:1 with premium cards (Strata Premier, Strata Elite). 1:0.7 with no-AF Citi cards. Periodic 20-25% transfer bonuses.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K Qantas Points (5K bonus on every 60K block). Indirect via Marriott''s airline partners list. Verify at qantas.com.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Transpacific Business class US-Australia** at 130,100 Qantas Points one-way (Zone 8, post-August 2025 chart). The flagship redemption for US-based members.
- **A380 First Class US-Australia** at 195,400 Qantas Points one-way. Cash fares exceed $10,000+ - excellent value when seats are available, plus the A380 First suite is a world-class hard product.
- **Intra-Australia hops** at 9,200-19,300 Qantas Points one-way (Zone 1-2). SYD-MEL, SYD-BNE, SYD-PER. Cheap positioning once in Australia.
- **Australia-Asia Business class** at 82,100-98,400 Qantas Points one-way (Zones 5-6). SYD-SIN, SYD-HKG on Qantas A330/A380.
- **AA partner awards** priced on the Qantas table - often cheaper than booking the same AA flight via AAdvantage for some routings.
- **Emirates redemptions** moved to the cheaper Qantas table August 2025 - Dubai-Australia in Emirates Business is now better-priced. Note Emirates premium-cabin surcharges remain very high.
- **Mileage Bargains-equivalent**: Qantas occasionally runs Reward Seat Sales with reduced points pricing on selected routes.',
  sweet_spots = '- **A380 First Class US-Australia at 195,400 Qantas Points one-way** is the marquee aspirational redemption. At ~$10,000-15,000 cash equivalent, that''s roughly 5-7 cents per point - and the QF First suite is widely considered one of the best in the sky.
- **SYD-LAX Business at 130,100 Points** is the realistic premium-cabin sweet spot. Pair with a Capital One 20% transfer bonus through May 31, 2026, and 110,000 Cap One Miles becomes 132,000 Qantas Points.
- **Intra-Australia at 9,200 Points one-way** for short hops - one of the cheapest regional Business class redemptions in any program (19,300 Points for SYD-MEL Business).
- **Emirates moved to the Qantas table** - DXB-Australia in Emirates Business is now better-priced versus the Partner table. Note Emirates premium-cabin surcharges remain high.
- **AA partner awards on Qantas chart** - some US domestic and US-South America AA segments price more cheaply via Qantas Frequent Flyer than via AAdvantage.
- **Capital One 20% transfer bonus through May 31, 2026** brings effective rate to 1.2:1 - time large transfers to bonus windows.
- **Watch the carrier-charge math** before redeeming on QF / Emirates premium cabins. Always price out a specific itinerary on qantas.com to see exact taxes + carrier charges - the +A$1,050 RT charge can wipe out the points value on transpacific Business.',
  tier_benefits = '[
    {"name":"Bronze","qualification":"Free auto-enrollment.","benefits":["Earn Qantas Points on flights","Access to member fares","Points Plus Pay (mix points + cash on any fare)"]},
    {"name":"Silver","qualification":"300 Status Credits + 4 eligible QF / Jetstar (JQ/GK) sectors per membership year","benefits":["oneworld Ruby","+50% Status Bonus on eligible QF / JQ / AA flights","Priority airport check-in","+1 extra checked bag","1 lounge invitation per year (added benefit)"]},
    {"name":"Gold","qualification":"700 Status Credits + 4 eligible QF / JQ / GK sectors","benefits":["oneworld Sapphire","+75% Status Bonus","Qantas Club lounge access","Priority boarding and baggage","Economy seat selection","Lounge access on partner oneworld carriers worldwide for member + 1 guest"]},
    {"name":"Platinum","qualification":"1,400 Status Credits + 4 eligible QF / JQ / GK sectors","benefits":["oneworld Emerald","+100% Status Bonus","Qantas Business + oneworld Emerald lounges (First class lounges on partners worldwide)","Complimentary upgrades when available","Extra baggage allowance","Platinum Bonus at 2,400 SCs: 50,000 Qantas Points OR Gold status for a companion"]},
    {"name":"Platinum One","qualification":"3,600 Status Credits in a year, with at least 2,700 from QF-marketed flights","benefits":["All Platinum benefits","+100% Status Bonus","Platinum status for a partner / friend","Priority access to reward seats","Platinum One Bonus at 5,000 SCs: 75,000 Points; at 7,000 SCs: 100,000 Points","Personal concierge service"]},
    {"name":"Lifetime Silver / Gold / Platinum","qualification":"7,000 / 14,000 / 75,000 lifetime Status Credits","benefits":["Permanent corresponding tier benefits","Status retained regardless of annual flight activity"]}
  ]'::jsonb,
  lounge_access = 'Qantas operates the **Qantas Club** (Business class lounges) at major Australian airports plus a handful of international gateways, the **Qantas Business Lounge** at SYD/MEL/PER/BNE/LAX/SIN/HKG/AKL, and the **Qantas First Lounge** at SYD/MEL/LAX/SIN.

Access rules:
- **Same-day Qantas / oneworld flight + oneworld Sapphire (Gold) status** - Qantas Club / oneworld Business lounges worldwide for member + 1 guest, any cabin.
- **Same-day Qantas / oneworld flight + oneworld Emerald (Platinum / Platinum One) status** - Qantas First Lounge / oneworld First Lounges worldwide for member + 1 guest, any cabin.
- **Same-day QF First Class boarding pass** - QF First Lounge access in any context.
- **Same-day QF Business Class boarding pass** - Qantas Business Lounge.
- **Silver members** - 1 lounge invitation per year (new benefit added).

Qantas Club paid membership exists separately - an annual membership purchasable by Bronze members for around AU$650/year for unlimited Qantas Club access. Generally not worthwhile if you can chase Gold status instead.',
  quirks = '- **Award chart is fixed and zone-based by distance.** No shift to dynamic pricing as of May 2026 - Qantas remains one of the few major programs still publishing a fixed table.
- **August 5, 2025 Classic Reward devaluation** (10-20% on most zones, more on premium cabins). First chart change in 6 years.
- **Emirates moved to the cheaper Qantas table** August 5, 2025 (previously on the pricier Partner table). Partial offset for the broader devaluation. Emirates premium-cabin carrier charges remain among the highest in the industry.
- **Carrier-imposed surcharges (carrier charges)** apply to Classic Flight Rewards, especially in premium cabins. SYD-LAX Business RT can exceed A$1,050; First Class higher. Always price a specific itinerary on qantas.com to see exact charges.
- **Bilt does NOT transfer directly to Qantas**, despite some aggregator listings. The only indirect path is via Accor; ratio is poor (less than 1:1 effective). Treat Bilt -> Qantas as not viable.
- **September 15, 2025: Loyalty Bonus is Status-Credits-only.** The previous option to take the bonus as Qantas Points was removed.
- **Lifetime status thresholds**: 7,000 lifetime SCs = Lifetime Silver; 14,000 = Lifetime Gold; 75,000 = Lifetime Platinum. Among the more attainable lifetime-status tiers in major airline programs.
- **Minimum 4-sector requirement** on QF / Jetstar (JQ / GK) for Silver, Gold, and Platinum. Platinum One requires 2,700 of 3,600 SCs from QF-marketed flights.
- **Points Plus Pay conversion is poor** - approximately 0.50 AUc/pt (~0.33 USc/pt) as of mid-2025. Use Classic Flight Rewards for serious value; Points Plus Pay only as a small top-up.
- **No US-issued co-brand credit card.** Qantas issues co-brand cards in Australia and select markets but not in the US.
- **Heavy carrier-imposed surcharges** are the program''s defining drawback for premium-cabin redemptions.',
  award_chart = '## Qantas Frequent Flyer redemption structure

Qantas uses a **fixed zone-based distance chart** for Classic Flight Rewards. Pricing is **fixed per zone + cabin** (not a "starting from" range). Effective from August 5, 2025 (most recent update; ~10-20% increase over previous rates).

**Carrier-imposed surcharges:** HEAVY on QF metal premium cabins as of August 2025. SYD-LAX Business RT can exceed A$1,050 (~US$700); First Class higher. Emirates premium-cabin surcharges remain among the industry highest.

**Coverage:** Qantas (QF), Jetstar (JQ), Fiji Airways (FJ), American Airlines (AA), Emirates (EK) all priced on the Qantas table from August 5, 2025.

### Classic Flight Reward chart (one-way, post-August 2025)

| Zone | Distance (mi) | Economy | Prem Econ | Business | First |
|---|---|---|---|---|---|
| 1 | 0-600 | 9,200 | 14,500 | 19,300 | 29,000 |
| 2 | 601-1,200 | 13,800 | 21,600 | 29,000 | 43,600 |
| 3 | 1,201-2,400 | 20,700 | 32,600 | 43,600 | 65,300 |
| 4 | 2,401-3,600 | 23,300 | 50,600 | 68,400 | 102,600 |
| 5 | 3,601-4,800 | 29,000 | 61,600 | 82,100 | 123,100 |
| 6 | 4,801-5,800 | 36,200 | 73,800 | 98,400 | 147,700 |
| 7 | 5,801-7,000 | 43,200 | 85,300 | 113,900 | 170,800 |
| 8 | 7,001-8,400 | 48,200 | 97,600 | 130,100 | 195,400 |
| 9 | 8,401-9,600 | 58,900 | 113,900 | 151,800 | 227,800 |
| 10 | 9,601-15,000 | 63,500 | 124,700 | 166,300 | 249,400 |

### Notable redemptions (one-way)
- SYD-LAX Business: 130,100 Qantas Points (Zone 8)
- SYD-LAX First (A380): 195,400 Points (Zone 8)
- SYD-SIN/HKG Business: 82,100-98,400 Points (Zones 5-6)
- SYD-MEL Economy: 9,200 Points
- SYD-MEL Business: 19,300 Points

### Earning rates (representative; per mile flown)
- Discount Economy (E/N/O/Q): 0.5 pts/mi
- Economy Saver (G/K/L/M/S/V): 1.0 pts/mi
- Economy Flex (B/H/Y): 1.5 pts/mi
- Discount Premium Economy (T): 1.0 pts/mi
- Premium Economy Saver (R): 1.5 pts/mi
- Premium Economy Flex (W): 2.0 pts/mi
- Discount Business (I): 1.5 pts/mi
- Business Saver (D): 2.0 pts/mi
- Business Flex (C, J): 3.0 pts/mi
- First (A, F): 4.0 pts/mi

Plus Status Bonus on top: Silver +50%, Gold +75%, Platinum/Platinum One +100%. Minimum Points Guarantee of 800 points on most QF segments.

**Official Points Calculator:** https://www.qantas.com/us/en/frequent-flyer/use-points/points-calculator.html

**Official Classic Reward chart:** https://www.qantas.com/us/en/frequent-flyer/use-points/use-points-for-flights/classic-flight-rewards.html

### Points Plus Pay
Sliding mix of points + cash on any available fare (not just Classic Reward seats). Conversion rate is poor (~0.50 AUc/pt = ~0.33 USc/pt). Use only for small top-ups.

### What does NOT transfer to Qantas
- **Chase Ultimate Rewards** - no direct transfer
- **Bilt Rewards** - no viable direct transfer (the Bilt -> Accor -> Qantas indirect path is not competitive)
- **Wells Fargo Rewards** - no transfer

### No US co-brand card
Qantas does not have a US-issued co-brand credit card. Reach Qantas Points via Amex / Capital One / Citi / Brex direct, or Marriott indirect.',
  partner_chart_url = 'https://www.qantas.com/us/en/frequent-flyer/use-points/use-points-for-flights/classic-flight-rewards.html',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'qantas';

-- Step 5.5 partner_redemptions
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'oneworld + Emirates Classic Reward chart (zone-distance, post-Aug 2025)', 'fixed',
  'Qantas Classic Reward chart is fixed zone+distance, applies to QF / JQ / FJ / AA / EK. August 5, 2025 chart raised premium-cabin pricing 10-20%. EK moved from pricier Partner table to cheaper Qantas table same day. Heavy carrier-imposed surcharges on QF and EK premium cabins (SYD-LAX Business RT can exceed A$1,050).',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'qantas' and c.slug in ('qantas','aa','alaska','ba-avios','cathay','jal','finnair','iberia','malaysia','qatar','royal_jordanian','srilankan','jetblue','latam')
on conflict do nothing;
