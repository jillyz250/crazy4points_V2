-- Seed ANA Mileage Club full program page (Batch A #3).
--
-- Authored 2026-05-05. Sources: official ANA pages (ana.co.jp/en/us/amc)
-- + 2026-dated travel publications (NerdWallet, Prince of Travel, point.me,
-- AwardWallet, Pointalize, Upgraded Points, The Points Guy, FlyerTalk,
-- LoyaltyLobby, Wego). All claims cross-checked across multiple sources.
--
-- Lean Path-2 shape: structural overview in award_chart + sweet-spot narrative
-- + link to official chart. Tool-shaped data lives in partner_redemptions.
--
-- Notes:
-- - alliance = 'star_alliance'
-- - 3 tier elite (Bronze, Platinum, Diamond) qualified by Premium Points
-- - Round-trip required for award flights (no one-way redemptions)
-- - 36-month hard expiry from earn date (no extensions, no inactivity reset)
-- - YQ surcharges DO apply (heavy on ANA metal + Thai/Lufthansa partners,
--   minimal on United partner awards)
-- - Major 2026 events: surcharge increase, ITA Airways added April 1, 2026

update programs set
  alliance = 'star_alliance',
  hubs = array['HND','NRT'],
  intro = 'ANA Mileage Club is the loyalty program of All Nippon Airways, Japan''s largest airline and a Star Alliance member. ANA operates from Tokyo Haneda (HND) and Tokyo Narita (NRT), with the famed THE Suite first-class product on its flagship 777 aircraft. ANA Mileage Club is one of the highest-leverage Amex Membership Rewards transfer partners for US-based travelers - the round-trip Business class US-Europe redemption at 88,000-104,000 miles is the program''s most-cited sweet spot, and round-trip Business US-Japan starts around 75,000-90,000 miles in low season.

The program has two notable structural quirks. **First: round-trip required.** ANA does not allow one-way award redemptions on its own metal - every booking must be a round-trip itinerary, though one stopover and open-jaw routings are both allowed within the chart pricing. **Second: heavy fuel surcharges (YQ) on ANA metal.** Where Aeroplan and KrisFlyer have eliminated YQ on partner awards, ANA passes through fuel surcharges on its own flights and on most partner awards. As of 2026, US-Japan one-way YQ runs roughly $185 per sector. The exception: United partner awards through ANA usually have $0 or very low YQ, making ANA Mileage Club a sweet spot specifically for booking United metal.

Miles expire 36 months from the month they were earned, with no extension via activity - this is one of the strictest expiry policies of any major program.',
  transfer_partners = '[
    {"from_slug":"amex-membership-rewards","ratio":"1:1","notes":"Foreign carrier - no US federal excise tax pass-through. Transfers can take 1-4 days (slow vs other Amex partners). One of Amex''s highest-leverage transfer destinations.","bonus_active":false},
    {"from_slug":"marriott-bonvoy","ratio":"3:1","notes":"60K Marriott = 25K ANA (5K bonus on every 60K transferred). No transfer tax. Useful for topping off ANA balances.","bonus_active":false},
    {"from_slug":"capital-one","ratio":"1:1","notes":"No transfer tax. Cap One added ANA at 1:1 in 2021.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Round-trip Business class US-Europe** on Star Alliance partners (United, Lufthansa, Swiss, Austrian, Brussels): 88,000-104,000 miles round-trip is the headline sweet spot for Amex MR holders.
- **Round-trip Business class US-Japan** on ANA: 75,000-90,000 miles round-trip in low season, 90,000-110,000 in regular season (ANA-operated, includes YQ).
- **Round-trip First class US-Japan on ANA THE Suite**: 150,000-200,000 miles round-trip (when available; very limited inventory).
- **Round-trip Business class US-Asia** beyond Japan via Star Alliance: 90,000-130,000 miles round-trip depending on zone.
- **United partner awards** (US domestic, US-Asia via Tokyo connection): ANA-priced awards on UA metal with low or zero YQ - one of the few ways to book UA awards without paying United''s award fees.
- **Partner Round-the-World award** - separate chart from standard zone awards. 5 continents, 8 segment max. Star Alliance member airlines only. ANA-operated metal cannot be used.
- **Stopover + open-jaw** - one stopover and an open-jaw both permitted on standard round-trip awards within zone pricing.',
  sweet_spots = '- **US-Europe round-trip Business class** at 88,000-104,000 miles is the headline ANA sweet spot. Pair it with Amex MR transfers and a partner like Lufthansa or United and the per-direction value clears 4-5 cents per mile. Add the Amex transfer time (1-4 days) into your planning - ANA is not for last-minute bookings.
- **United partner awards via ANA** for low or zero YQ. Booking UA metal through ANA Mileage Club at zone pricing is one of the few clean ways to redeem on United without paying United''s own surcharges or close-in fees.
- **US-Japan low season Business class**: 75,000-90,000 miles round-trip on ANA-operated 777/787 (THE Room product on most US routes). Note that ANA imposes YQ on its own metal - you''ll pay several hundred dollars in surcharges on top.
- **Round-the-World partner award** for travel across 5 continents on Star Alliance partners. Distance-banded pricing; harder to research but yields massive value if your itinerary fits the segment max.
- **THE Suite first class US-Japan** is the program''s flagship product - 150,000-200,000 miles round-trip when bookable. Inventory is rare (ANA prioritizes its own elites and Diamond members) so plan very far ahead.',
  tier_benefits = '[
    {"name":"Bronze","qualification":"30,000 Premium Points (15,000 from ANA Group flights)","benefits":["Star Alliance Silver","40% bonus miles in first elite year (50% bonus in subsequent years)","Priority airport check-in","Priority reservations and waitlist on award flights"]},
    {"name":"Platinum","qualification":"50,000 Premium Points (25,000 from ANA Group flights)","benefits":["All Bronze benefits","Star Alliance Gold (lounge access on all Star Alliance partners worldwide for member + 1 guest when traveling on Star Alliance, regardless of cabin)","Waived advanced seat fees on ANA international flights","Additional baggage allowance","Priority security and boarding","Higher mile-earning bonus on ANA flights"]},
    {"name":"Diamond","qualification":"100,000 Premium Points (50,000 from ANA Group flights)","benefits":["All Platinum benefits","Access to ANA Suite Lounge and Star First Lounges worldwide","Dedicated travel concierge when flying ANA from HND or NRT","Top-priority access to award seats including THE Suite first class","Maximum mile-earning bonus on ANA flights","Top-tier exclusive perks"]}
  ]'::jsonb,
  lounge_access = 'ANA operates the **ANA Lounge** and **ANA Suite Lounge** networks at Tokyo Haneda (HND), Tokyo Narita (NRT), and select international gateways. Access rules:

- **Same-day ANA or Star Alliance flight + Star Alliance Gold status** (ANA Platinum/Diamond, KrisFlyer Elite Gold, United Premier Gold/Platinum/1K, Aeroplan 50K+, Lufthansa Senator, etc.) - access to ANA Lounge / Star Business Lounges worldwide for member + 1 guest, any cabin.
- **ANA Diamond members** - access to ANA Suite Lounge and Star First Lounges worldwide.
- **Same-day ANA First Class boarding pass** - access to ANA Suite Lounge in any cabin-paid context.
- **Same-day ANA Business Class boarding pass** - access to ANA Lounge.
- **Premium Economy or Economy on ANA** - no lounge access on its own without elite status.

ANA does not generally sell day passes to non-status passengers; access is by status or premium cabin only.',
  quirks = '- **Round-trip required for award flights on ANA metal.** No one-way redemptions on ANA''s own chart. Partner awards do allow one-way bookings.
- **One stopover and open-jaw routings** are permitted on round-trip awards within zone pricing - useful for combining two destinations on one itinerary.
- **Miles expire 36 months from the calendar month earned**, with no extension via activity. Each batch of miles has its own death date (not pooled). One of the strictest expiry policies of any major program.
- **Heavy fuel surcharges (YQ)** on ANA-operated awards (~$185/sector US-Japan as of 2026). Surcharges also pass through on most partner awards (Thai, Lufthansa, Swiss). The major exception: United partner awards through ANA typically have $0 or very low YQ.
- **Award booking channel matters** - online vs phone bookings can yield different YQ amounts on partner awards. Always price both before paying.
- **No mile pooling, no sharing.** ANA explicitly prohibits selling, sharing, combining, or donating miles to third parties.
- **No US-issued co-brand credit card.** ANA Card products are Japan-only (JCB). The path to ANA miles for US-based readers is Amex MR transfer (slow, 1-4 days) or Marriott Bonvoy 3:1 transfer.
- **Round-the-World partner award** is a separate chart with distance-banded pricing, 5 continents max, 8 segments max, Star Alliance members only.
- **ITA Airways added as a partner April 1, 2026.**',
  award_chart = '## ANA Mileage Club redemption structure

ANA uses **two parallel charts**:

| Chart | Routes | Pricing model | Format |
|---|---|---|---|
| **ANA International Flight Awards** | Routes operated by ANA only | Zone + season + cabin | Round-trip required; one stopover + open-jaw permitted |
| **Partner Flight Awards** | Star Alliance + Star Alliance Connecting Partners | Zone + cabin (no seasonality) | One-way redemptions allowed; stopover + open-jaw permitted |

**Carrier-imposed surcharges (YQ):**
- Heavy on ANA-operated awards (~$185/sector US-Japan as of 2026)
- Variable on partner awards: $0 or very low on United metal; substantial on Thai, Lufthansa, Swiss, others
- Always price online + phone before paying - YQ can vary by channel

**Round-the-World award** is a third, separate chart based on segment count and total mileage. Star Alliance-only, max 5 continents, max 8 segments. ANA metal cannot be used on RTW awards.

**Recent program changes (2026):**
- ITA Airways (AZ) added as a redemption partner April 1, 2026.
- Surcharge levels on ANA + Thai partner awards rose materially in early 2026.

**Notable redemption pricing (round-trip, zone-based; verify before booking):**
- US-Europe Business class on partners: 88,000-104,000 miles
- US-Japan Business class on ANA (low season): 75,000-90,000 miles
- US-Japan First class on ANA THE Suite: 150,000-200,000 miles
- US-Asia Business class on partners: 90,000-130,000 miles

**Official charts:**
- ANA International Flight Awards: https://www.ana.co.jp/en/us/amc/international-flight-awards/
- Partner Flight Awards: https://www.ana.co.jp/en/us/amc/partner-flight-awards/

For exact per-route pricing, use the official charts or the upcoming Booking Tool.

### No US co-brand card
ANA does not have a US-issued co-brand credit card as of May 2026. The path to ANA miles for US-based travelers is flexible-currency transfer (Amex MR 1:1, Cap One 1:1, or Marriott Bonvoy 3:1).',
  partner_chart_url = 'https://www.ana.co.jp/en/us/amc/partner-flight-awards/',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ana';

-- Step 5.5 partner_redemptions covering ANA + Star Alliance partners
-- US readers most often book through ANA. Note ANA-on-United is a sweet spot
-- for low/zero YQ; ANA on Thai/LH passes through high YQ.
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, c.id, 'Business', 'Star Alliance partner awards (zone + cabin)', 'fixed',
  'ANA partner award chart is zone + cabin (no seasonality on partner chart, unlike ANA-operated). One-way redemptions allowed on partner awards. YQ varies sharply by partner - $0 or low on United, substantial on Thai/Lufthansa/Swiss. ITA Airways added April 1, 2026. See partner_chart_url for the official chart.',
  'HIGH', current_date, true, 'high'
from programs p, programs c
where p.slug = 'ana' and c.slug in ('ana','united','lufthansa','swiss','austrian','sas','singapore_airlines','eva','asiana','turkish','tap','avianca','copa','air-china')
on conflict do nothing;

-- ANA-operated awards (round-trip required, seasonal pricing)
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Business', 'ANA-operated international (zone + season + cabin)',
  'fixed',
  'ANA International Flight Awards: ROUND-TRIP REQUIRED on ANA-operated metal. Zone + season + cabin pricing. One stopover + open-jaw permitted within zone pricing. Heavy YQ pass-through (~$185/sector US-Japan). Low season US-Japan Business is 75,000-90,000 miles RT.',
  'HIGH', current_date, true, 'high'
from programs p where p.slug = 'ana'
on conflict do nothing;
