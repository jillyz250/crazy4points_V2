-- Best Western Rewards airline partner roster, from the OFFICIAL Travel Partners page
-- (pasted by Jill 2026-06-15). Closes the residual gap from migration 450.
-- ASCII-only.
--
-- IMPORTANT semantics: the figures on the Travel Partners page are EARN-INSTEAD rates -
-- the miles/points you earn PER QUALIFYING NIGHT if you set that airline as your earning
-- preference (instead of earning BW points). They are NOT points-to-miles conversion
-- ratios. The T&C states the direct point-to-mile CONVERSION rate is set by BWI in its
-- sole discretion and is not published (third-party reports peg it near 5,000 BW points
-- = 1,000 miles / 5:1, flagged as third-party). So ratio is recorded as "varies" with
-- the official per-night earn-instead figure captured in notes.
--
-- 10 airline partners seeded (PAYBACK Germany is a retail loyalty program, not an
-- airline, and is excluded). Each slug verified to resolve to a programs row.

update programs set
  transfer_partners_outbound = '[
    {"from_slug":"aeromexico","ratio":"varies","notes":"Aeromexico Rewards. Official earn-instead rate: 800 Aeromexico points per qualifying night if set as your earning preference. Direct point-to-points conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"aeroplan","ratio":"varies","notes":"Air Canada Aeroplan. Official earn-instead rate: 250 Aeroplan miles per qualifying night if set as your earning preference. Direct point-to-mile conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"flying-blue","ratio":"varies","notes":"Air France-KLM Flying Blue. Official earn-instead rate: 250 Flying Blue miles per qualifying night if set as your earning preference. Direct point-to-mile conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"atmos","ratio":"varies","notes":"Atmos Rewards (Alaska/Hawaiian). Official earn-instead rate: 250 Atmos points per qualifying night if set as your earning preference. Direct point-to-points conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"avianca","ratio":"varies","notes":"Avianca LifeMiles. Official earn-instead rate: 250 LifeMiles per qualifying night if set as your earning preference. Direct point-to-mile conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"cathay","ratio":"varies","notes":"Cathay (Asia Miles). Official earn-instead rate: 250 Asia Miles per qualifying night if set as your earning preference. Direct point-to-mile conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"sas","ratio":"varies","notes":"SAS EuroBonus. Official earn-instead rate: 600 EuroBonus points per qualifying night if set as your earning preference. Direct point-to-points conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"southwest","ratio":"varies","notes":"Southwest Rapid Rewards. Official earn-instead rate: 600 Rapid Rewards points per qualifying night if set as your earning preference. Direct point-to-points conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"united","ratio":"varies","notes":"United MileagePlus. Official earn-instead rate: 250 MileagePlus miles per qualifying night if set as your earning preference. Direct point-to-mile conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false},
    {"from_slug":"virgin-atlantic","ratio":"varies","notes":"Virgin Atlantic Flying Club. Official earn-instead rate: 500 Virgin Points per qualifying night if set as your earning preference. Direct point-to-points conversion rate is set by BWI (not published). No transfer tax.","bonus_active":false}
  ]'::jsonb,
  how_to_spend = '- **Free nights (dynamic by ADR):** Redeem points for free nights at participating hotels worldwide. Points required track the property''s expected average daily rate, so they vary through the year - starting around 5,000 points and scaling up for pricier properties. Standard rooms only (no suites), up to 7 consecutive nights, NO blackout dates. Book online or via the call center (not travel agents).
- **Pay with Points:** Combine points and cash on a stay - minimum 5,000 points plus cash, in 1,000-point increments, applied to the first night. You still earn (and qualify for elite on) the cash portion.
- **Airline miles - two ways:** (1) Set an airline as your earning preference and earn miles instead of points per night (e.g. 800 Aeromexico, 600 SAS / Southwest, 500 Virgin, 250 United / Aeroplan / Flying Blue / Asia Miles / LifeMiles / Atmos) - but this forfeits the elite bonus; or (2) convert accumulated points to miles at a BWI-set rate. Partners: Aeromexico, Aeroplan, Flying Blue, Atmos, Avianca LifeMiles, Asia Miles, SAS, Southwest, United, and Virgin Atlantic.
- **Gift cards and charity:** Redeem points for retail/dining gift cards, the never-expiring Best Western Gift Card, or charitable donations.',
  award_chart = 'Best Western Rewards uses DYNAMIC free-night pricing rather than a fixed category chart. The points required for a free night are based on the property''s expected average daily rate for the requested date, so they vary throughout the year (starting around 5,000 points and scaling up for premium properties). Redemptions are for STANDARD rooms only (no suites), up to 7 consecutive nights, with NO blackout dates, and points NEVER expire. EARNING is a flat 10 points per USD on the room rate for most brands (5 points at SureStay Studio, Executive Residency, and @HOME by Best Western); elite members add a tier bonus on Qualifying Nights (Gold +10%, Platinum +15%, Diamond +30%, Diamond Select +50%). Pay with Points combines a 5,000-point minimum (in 1,000-point increments) with cash on the first night. Airline conversion is available with 10 partners - Aeromexico, Air Canada Aeroplan, Air France-KLM Flying Blue, Atmos (Alaska), Avianca LifeMiles, Cathay Asia Miles, SAS EuroBonus, Southwest, United, and Virgin Atlantic - either by setting an airline as your earning preference (earning miles per night instead of points, which forfeits the elite bonus) or by converting accumulated points at a BWI-set rate (third-party reports near 5,000 points = 1,000 miles; the exact rate is not published). Points can also be redeemed for gift cards and charitable donations. Members booking the Best Western Rewards Rate save 7%+ off the Flexible Rate.',
  last_verified = current_date,
  updated_at = now(),
  content_updated_at = now()
where slug = 'best-western';
