-- Seed Singapore Airlines KrisFlyer full program page.
--
-- Authored 2026-05-05. Sources: official Singapore Airlines pages
-- (singaporeair.com KrisFlyer T&C, PPS qualification, redemption, partner
-- awards) + 2026-dated trusted travel publications (Mainly Miles, MileLion,
-- Pointalize, AwardWallet, SuitesSmile, One Mile at a Time, Upgraded Points).
-- Cross-fact-checked via Copilot/ChatGPT 2026-05-05 - all 2026-specific
-- structural claims (Access introduction, Nov 2025 + March 2026 devaluations,
-- Spontaneous Escapes) confirmed; no INCORRECT findings.
--
-- Lean Path-2 shape (per project decision): structural overview in award_chart
-- with sweet-spot narrative + link to official chart. Tool-shaped data lives
-- in partner_redemptions for the upcoming Booking Tool.
--
-- Notes:
-- - alliance = 'star_alliance'
-- - 4 tier elite system (KF Elite Silver, KF Elite Gold, PPS Club, Solitaire PPS)
-- - 4 award types (Saver, Advantage, Access, Spontaneous Escapes)
-- - Suites Class is exclusive to KrisFlyer (no partner program can book Suites)
-- - No US-issued co-brand card (must transfer flexible currency)
-- - Major events: Nov 1, 2025 chart devaluation + Access intro;
--                 March 28, 2026 Access devaluation 3-10%

update programs set
  alliance = 'star_alliance',
  hubs = array['SIN'],
  intro = 'Singapore Airlines KrisFlyer is the loyalty program of Singapore Airlines, anchored by the Suites Class product on the A380 - the most exclusive premium cabin in the sky and one that no partner program can book. KrisFlyer is a Star Alliance member operating out of Singapore Changi (SIN). It transfers 1:1 from Amex Membership Rewards, Chase Ultimate Rewards, Capital One Miles, and Citi ThankYou. Bilt does not currently transfer to KrisFlyer.

KrisFlyer went through two consecutive devaluations on the same chart system. **November 1, 2025** brought a major Saver/Advantage chart devaluation and the introduction of a new "Access" award level - a no-published-chart, dynamic-priced redemption tier where Singapore Airlines reserves discretion to set rates. **March 28, 2026** quietly raised Access rates a further 3-10% (Economy/Premium Economy ~10.9%, Business/First ~3.9%) without official announcement.

The published chart still has the original Saver tier as the price-anchored tier with finite inventory; Access is the "always available" but variable-priced fallback. If you want predictable pricing, Saver is the only tier with a published chart.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax pass-through. Transfer time historically near-instant.","bonus_active":false},
    {"from_slug":"chase-ultimate-rewards","ratio":"1:1","notes":"No transfer fee. Periodic 25% transfer bonuses are common.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"No transfer fee. Cap One added KrisFlyer at 1:1 in 2021.","bonus_active":false},
    {"from_slug":"citi-thankyou","ratio":"1:1","notes":"No transfer fee. Premium Citi cards eligible.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K KrisFlyer (5K bonus on 60K transferred).","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Singapore Airlines flights (Saver tier)** - the headline use case. Suites Class A380 redemptions, long-haul Business, Premium Economy, and Economy across SQ''s network.
- **Singapore Suites Class** - exclusive to KrisFlyer. No Star Alliance partner (United, Aeroplan, ANA, Avianca LifeMiles) can book Suites. KrisFlyer is the only currency that opens this cabin.
- **Star Alliance partner award flights** - 25+ partner airlines bookable through KrisFlyer. Note: partner awards through KrisFlyer DO incur partner-imposed fuel surcharges (Lufthansa, Swiss, etc.), unlike Aeroplan partner awards.
- **Access awards** - the dynamic, unpublished tier. Use as a fallback when Saver inventory is closed, but expect to pay materially more.
- **Spontaneous Escapes** - rotating 30%-off-Saver promotional menu. Refreshed monthly; check the dedicated promo page.
- **Upgrade awards** - upgrade a paid SQ ticket to the next cabin using miles (separate upgrade chart).
- **KrisShop / Pelago** - Singapore-owned retail and experiences platforms. Generally poor cents-per-mile redemption value but useful at low balances or to extend miles.',
  sweet_spots = '- **Singapore Suites Class A380 (JFK-FRA, SIN-FRA, SIN-LHR)** - Saver redemption is the only way to book Suites with miles, full stop. Approximately 102,000 miles one-way Saver JFK-FRA when available.
- **Spontaneous Escapes 30% off Saver** - refreshed monthly, varies by destination. Worth checking before any Saver redemption to see if your route is on the discount menu.
- **Singapore-Malaysia short-haul Saver** starts at around 1,500 miles one-way - the cheapest regional connector in the program.
- **PPS Value path to Solitaire** - the only US carrier with a meaningful spend-only path to top-tier status that includes guaranteed Business class redemption seats. Requires SGD 50,000 in PPS Value annually (Business/Suites/Premium First fares only).
- **Save the partner awards for Aeroplan** - because KrisFlyer does pass through partner fuel surcharges (unlike Aeroplan), Star Alliance partner awards are usually a better value through Aeroplan than through KrisFlyer for the same flight.',
  tier_benefits = '[
    {"name":"KrisFlyer Elite Silver","qualification":"25,000 Elite Miles in 12 consecutive months","benefits":["Star Alliance Silver","Priority airport check-in","Priority reservations and waitlist","Extra baggage allowance"]},
    {"name":"KrisFlyer Elite Gold","qualification":"50,000 Elite Miles in 12 consecutive months","benefits":["All Elite Silver benefits","Star Alliance Gold (lounge access on all Star Alliance partners worldwide for member + 1 guest when traveling on Star Alliance)","Priority boarding","Priority baggage delivery"]},
    {"name":"PPS Club","qualification":"25,000 PPS Value in 12 consecutive months. PPS Value is earned ONLY on Business / Suites / Premium First fares; Economy and Premium Economy do not contribute. Non-flight PPS Value can be earned via Kris+, KrisShop, and Pelago at 1 PPS Value per SGD 3 spent (qualifying-only, not redeemable as miles).","benefits":["All Elite Gold benefits","Lounges worldwide","Higher checked baggage allowance","Accelerated KrisFlyer mile earning","KrisFlyer miles never expire while PPS membership is active"]},
    {"name":"Solitaire PPS Club","qualification":"50,000 PPS Value annually","benefits":["All PPS Club benefits","Guaranteed Business class redemption seats on Singapore Airlines","Membership card and leather luggage tags","Concierge-level service","Top-tier exclusive perks"]}
  ]'::jsonb,
  lounge_access = 'Singapore Airlines operates the renowned **SilverKris Lounge** network at major hubs (Singapore Changi, plus key international gateways). Access rules:

- **Same-day Singapore Airlines or Star Alliance flight + Star Alliance Gold status** (KrisFlyer Elite Gold and above, or any Star Alliance Gold member from any partner program) - access for member + 1 guest.
- **PPS Club / Solitaire PPS Club members** - SilverKris and KrisFlyer Gold lounges; Solitaire PPS gets exclusive sections at SIN.
- **Same-day SQ Suites Class or Business Class boarding pass** - access in any cabin-paid context regardless of status.
- **Premium Economy on SQ** - no lounge access on its own.

Single-visit / day passes: Singapore generally does not sell SilverKris day passes to non-status passengers; access is by status or premium cabin only. (Compare to Air Canada''s Maple Leaf Lounge which does sell day passes.)

Star Alliance Gold members from any program can use SilverKris with a same-day Star Alliance ticket in any cabin.',
  quirks = '- **Miles expire 36 months after they are earned** with individual death dates - activity does NOT reset the expiry of older miles. Each batch of miles expires at 23:59 Singapore Time on the last day of its calendar month of validity.
- **PPS Club members'' miles do not expire** while the membership is active.
- **No mile pooling.** You cannot combine miles with your spouse into a shared pot. However, you can designate up to **5 Redemption Nominees** and book award tickets for them with your miles.
- **Singapore Suites Class is exclusive to KrisFlyer** - no Star Alliance partner program (United, Air Canada Aeroplan, Avianca LifeMiles, ANA Mileage Club) can book Suites. KrisFlyer is the only currency that books this cabin.
- **No fuel surcharges on SQ-operated Saver awards** - but partner awards through KrisFlyer DO incur partner-imposed fuel surcharges (notable on Lufthansa, Swiss, etc.).
- **Access award level (introduced Nov 1, 2025) is unpublished.** Singapore Airlines does not publish Access award rates and quietly raised them 3-10% in March 2026. Treat Saver as the chart-priced tier and Access as the "ask the website" fallback.
- **PPS Value is not earned in Premium Economy or Economy** - PPS qualification is a premium-cabin-only path.
- **No US-issued co-brand credit card.** KrisFlyer is reached via flexible-currency transfers from Amex, Chase, Capital One, or Citi.
- **Bilt does not currently transfer to KrisFlyer** as of May 2026.
- **Waitlist redemptions are available** - Singapore will hold a place if Saver inventory opens up later. Confirmation incurs a small service fee.',
  award_chart = '## KrisFlyer redemption structure

Singapore Airlines uses **four parallel award types** for redemptions on its own metal:

| Award type | Pricing model | Inventory | Use when |
|---|---|---|---|
| **Saver** | Published chart, fixed by zone + cabin | Limited; popular routes vanish quickly | You can plan ahead and want the cheapest published rate. The "real" sweet spots live here. |
| **Advantage** | Published chart, higher than Saver | Generally always available | You need confirmed inventory and Saver isn''t open. |
| **Access** | Unpublished, dynamic | Always available | Saver and Advantage are closed. Expect to pay materially more. |
| **Spontaneous Escapes** | 30% off Saver, rotating menu | Limited to promotional routes/dates | You''re flexible on destination and date. |

**Carrier-imposed surcharges:** $0 on SQ-operated Saver awards. Partner awards through KrisFlyer DO incur partner-imposed fuel surcharges.

**Booking fees:** Phone booking fees may apply for non-online channels; waitlist confirmation fees are charged on confirmation.

**Recent program changes:**
- **November 1, 2025**: Saver/Advantage chart devaluation + Access award type introduced (no published rates).
- **March 28, 2026**: Access rates quietly raised 3-10% (Economy/PE ~10.9%, Business/First ~3.9%). No official announcement.

**Singapore Suites Class is exclusive to KrisFlyer.** No partner program (United, Aeroplan, Avianca LifeMiles, ANA Mileage Club) can book the Suites cabin. JFK-FRA Suites Saver is approximately 102,000 miles one-way when inventory is available.

**Official chart:** https://www.singaporeair.com/content/dam/sia/web-assets/pdfs/ppsclub-krisflyer/krisflyer/progupdates/awardcharts/SingaporeAirlinesOne-WayAdvantageSaverAwardChartupdated1Nov25.pdf

**Spontaneous Escapes:** https://www.singaporeair.com/en_UK/us/plan-travel/promotions/global/kf/kf-promo/kfescapes/

For exact per-route pricing, use the official chart or the upcoming Booking Tool, which prices your route across all currencies that can book it.

### No US co-brand card
KrisFlyer does not have a US-issued co-brand credit card as of May 2026. The path to KrisFlyer miles for US-based readers is flexible-currency transfer from Amex / Chase / Capital One / Citi.',
  partner_chart_url = 'https://www.singaporeair.com/content/dam/sia/web-assets/pdfs/ppsclub-krisflyer/krisflyer/progupdates/awardcharts/SingaporeAirlinesOne-WayAdvantageSaverAwardChartupdated1Nov25.pdf',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'krisflyer';

-- Step 5.5 partner_redemptions (Singapore + key Star Alliance partners
-- KrisFlyer can book; Suites Class included as separate row given its
-- exclusivity).
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'Singapore Airlines + Star Alliance partners (zone + cabin)', 'fixed',
  'KrisFlyer uses a zone+cabin Saver chart with limited inventory, plus Advantage (higher cost, wider availability), Access (unpublished/dynamic, +3-10% as of Mar 28, 2026), and Spontaneous Escapes (30% off Saver, rotating). $0 fuel surcharges on SQ-operated Saver. Partner awards through KrisFlyer pass through partner fuel surcharges. See partner_chart_url for the official chart.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'krisflyer' and c.slug in ('krisflyer','singapore_airlines','united','lufthansa','swiss','austrian','sas','ana','eva','asiana','turkish','tap','avianca','copa','air-china')
on conflict do nothing;

-- Singapore Suites Class - separate row (KrisFlyer-only redemption)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'First', 'Singapore Airlines A380 Suites Class (KrisFlyer-only)',
  'fixed',
  'Singapore Suites Class is exclusively bookable through KrisFlyer. No Star Alliance partner program (United, Aeroplan, Avianca LifeMiles, ANA) can book Suites. JFK-FRA Suites Saver is approximately 102,000 miles one-way when inventory is available.',
  'HIGH', current_date, true, 'none'
from programs p, programs c
where p.slug = 'krisflyer' and c.slug = 'singapore_airlines'
on conflict do nothing;
