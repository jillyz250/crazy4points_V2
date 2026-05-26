-- Hilton Honors patch 2: Surpass $50/qtr Hilton Credit + 60-night milestone.
--
-- Both items verified per Jill's Firecrawl Interact pass against official
-- 2026 Hilton program terms + Amex Surpass card terms (2026-05-26).
--
-- 1. Amex Hilton Surpass Card: provides up to $200/year back as $50 quarterly
--    statement credits on eligible purchases at Hilton portfolio properties
--    (room rates, spa services, room dining). Adding to quirks because it's
--    a card-specific perk that stacks for Surpass holders booking direct.
--
-- 2. Gold tier 60-night Milestone Bonus: in addition to the recurring 10,000
--    points every 10 nights AFTER 40 nights, members earn a one-time
--    30,000-point bonus at exactly 60 nights. So at 60 nights the total
--    milestone earning that night = 10,000 (recurring) + 30,000 (one-time)
--    = 40,000 points. Updating Gold tier_benefits.

update programs
   set tier_benefits = $tb$[
  {
    "name": "Member",
    "qualification": "Sign up free; no nights required",
    "benefits": [
      "Base earn 10 points per $1 at most Hilton brands",
      "Earn 5 points per $1 at Home2 Suites, Homewood Suites, Spark, Tru, and Apartment Collection",
      "Earn 3 points per $1 at LivSmart Studios",
      "No resort fees on reward stays",
      "Hilton Honors app digital check-in and digital key",
      "Choose Your Room (up to 24 hours before arrival)",
      "Free WiFi at most properties",
      "Late check-out when available (call the front desk to request)",
      "Member-only Hilton Honors discount rate"
    ]
  },
  {
    "name": "Silver",
    "qualification": "4 stays, 10 nights, or $2,500 USD eligible spend per calendar year",
    "benefits": [
      "20% bonus on base points earning (effective 12 points per $1 most brands)",
      "5th Night Free on Standard Room Reward Stays of 5+ consecutive nights",
      "All-Inclusive Spa Discount: 15% off at Hilton All-Inclusive spas",
      "Two complimentary bottles of water per stay (at select hotels)",
      "Elite Rollover Nights ended starting 2026 (2025 nights were the last to roll over)"
    ]
  },
  {
    "name": "Gold",
    "qualification": "15 stays, 25 nights, or $6,000 USD eligible spend per calendar year (lowered from 40 nights in 2026)",
    "benefits": [
      "80% bonus on base points earning (effective 18 points per $1 most brands)",
      "Daily Food & Beverage Credit at participating US hotels (or complimentary continental breakfast at most non-US brands)",
      "Space-available room upgrades up to Executive Floor room types",
      "Milestone Bonuses: 10,000 bonus points every 10 nights after 40 nights in a calendar year",
      "60-night milestone: one-time 30,000-point bonus at exactly 60 nights (stacks with the 10,000 recurring bonus that night, for 40,000 points total)",
      "Gift Gold status to any Honors member after 60 nights in a calendar year",
      "5th Night Free on award stays"
    ]
  },
  {
    "name": "Diamond",
    "qualification": "25 stays, 50 nights, or $11,500 USD eligible spend per calendar year (lowered from 60 nights in 2026)",
    "benefits": [
      "100% bonus on base points earning (effective 20 points per $1 most brands)",
      "Executive Lounge Access (where available) for Member plus 1 additional registered guest",
      "Space-available upgrades up to a one-bedroom suite",
      "Premium WiFi (faster speed than standard Member WiFi)",
      "Guaranteed 48-hour room availability (book at least 48 hours in advance)",
      "Gift Diamond status to any Honors member after 100 nights in a calendar year",
      "1-year Diamond status extension: available after 3 years at Diamond plus 250 lifetime nights or 500,000 lifetime base points"
    ]
  },
  {
    "name": "Diamond Reserve",
    "qualification": "80 nights or 40 stays AND $18,000 USD annual eligible spend (new tier in 2026; cannot be reached via cobranded credit card alone)",
    "benefits": [
      "120% bonus on base points earning (effective 22 points per $1 most brands)",
      "Confirmable Upgrade Reward (CUR): lock in suite upgrade at booking, up to a one-bedroom suite for stays up to 7 nights",
      "Second CUR option at 120-night milestone, or convert to 30,000 points",
      "CURs expire 12 months after issuance and are transferable to ANY Hilton Honors member (recipient does not need to be Diamond Reserve)",
      "Guaranteed 4 PM late checkout (other tiers are subject to availability)",
      "Premium Club Access: complimentary access to all lounges including the expanding collection of Premium Clubs (broader than Executive Lounges)",
      "Exclusive Customer Service: priority access to top Hilton Honors agents",
      "Stacks all Diamond benefits"
    ]
  },
  {
    "name": "Lifetime Diamond",
    "qualification": "(10 Years of Diamond status, non-consecutive) AND (1,000 lifetime nights OR 2,000,000 lifetime base points - the latter equates to ~$200,000 USD in eligible lifetime Hilton spend)",
    "benefits": [
      "Permanent Diamond status",
      "All standard Diamond benefits retained for life"
    ]
  }
]$tb$::jsonb,
       quirks = $q$- **Fully dynamic pricing, no chart** - there is no published category chart. The same property can vary 50,000 to 100,000+ points week to week. Always price the paid rate first to gauge whether the points cost is reasonable (target 0.5+ cents per point).
- **5th Night Free is points-only** - does not apply to Points & Money Rewards bookings or paid stays. Must be 5 consecutive nights at the same property, confirmed at time of booking.
- **Free Night Reward (FNR) certificates have no numerical points cap** - they are valid for any night classified as a Standard Room Reward (mechanic is per-night, not averaged across the stay). In 2026, many luxury properties price Standard Room Rewards at 120,000-150,000 points and FNRs remain valid.
  - **Amex Hilton Surpass:** earn 1 bonus FNR after $15,000 in calendar-year spend on the card.
  - **Amex Hilton Aspire:** receive 1 anniversary FNR each year, plus earn an additional FNR after $30,000 calendar-year spend, plus another after $60,000 - up to 3 FNRs per year possible.
- **Amex Hilton Surpass quarterly Hilton Credit** - up to $200 per year as $50 quarterly statement credits on eligible Hilton portfolio purchases (room rates, spa services, room dining). Stack-able with Surpass 12x earning + FNR mechanics.
- **Points expire after 24 months of inactivity** - any earning or redemption activity resets the clock.
- **Rollover nights eliminated starting 2026** - 2025 nights still rolled to 2026, but going forward the status year resets fully at calendar year-end.
- **Diamond Reserve cannot be earned via credit card alone** - requires the $18,000 annual spend threshold on actual Hilton charges (not credit-card-spend across all categories).
- **Spark and Homewood Suites earning cut** - starting January 8, 2026, base earning at these brands (and Home2 Suites, Tru, Apartment Collection) is 5 base points per $1; LivSmart Studios earns 3 base points per $1.
- **No public status match program** - Hilton occasionally runs targeted status match offers but does not maintain a published match program.
- **Devaluations have been frequent** - top-tier properties now run well into 200,000+ points per night versus 95,000 just a couple years ago. Always price-check before booking.
- **YOTEL and Explora Journeys partnerships** - YOTEL earn/redeem integration is arriving by end of 2026 (not yet live). Explora Journeys cruises earn/redeem launches summer 2026.$q$,
       last_verified = current_date
 where slug = 'hilton';
