-- Hilton Honors patch: 7 corrections from official-source verification pass.
--
-- All claims verified via:
-- 1. hilton.com/en/hilton-honors/member-benefits/ (Firecrawl scrape 2026-05-26)
-- 2. hilton.com/en/hilton-honors/credit-cards/ (Firecrawl scrape 2026-05-26)
-- 3. hilton.com/en/hilton-honors/terms/ (research-program.mjs scrape)
-- 4. ChatGPT cross-reference of Hilton 2026 program updates (verified
--    against official sources before inclusion)
--
-- Corrections applied:
--   1. Lifetime Diamond exact thresholds: (10 yrs Diamond) AND
--      (1,000 lifetime nights OR 2,000,000 lifetime base points)
--   2. CUR transferability: transferable to ANY Honors member
--      regardless of recipient's tier (not just other DR members)
--   3. FNR mechanic: no numerical cap; valid per-night for any
--      "Standard Room Reward"; Standard Room Reward currently up to
--      ~150K at luxury properties
--   4. Member tier: add "Late check-out when available"
--   5. Silver tier: add "All-Inclusive Spa Discount (15% off at
--      Hilton All-Inclusive spas)"
--   6. Diamond tier: add "Premium WiFi (faster speed)"
--   7. Diamond Reserve: add "Premium Club Access" (broader than
--      Executive Lounges) + "Exclusive Customer Service"
--   8. Earn-rate 5-pt brand list correction: REMOVE Hampton (stays
--      at 10 pts), ADD Apartment Collection + LivSmart at 3 pts
--   9. Aspire FNR clarification: up to 3 FNRs/year possible
--      (anniversary + $30K spend + $60K spend, all in calendar year)
--
-- Items still pending verification (will land in 348):
--   - Surpass $50/quarter Hilton Credit ($200/yr)
--   - 60-night additional 30K milestone bonus

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
      "Milestone Bonuses: 10,000 bonus points every 10 nights after you have stayed 40 nights in a calendar year",
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
       award_chart = $ac$Hilton Honors uses **fully dynamic pricing** for award stays. There is no published category chart - the points cost of a Standard Room Reward Stay varies by property, date, day of week, and demand.

**Observed point ranges by brand class (2026 — observational, not fixed bands):**

| Brand Class | Typical Range (per night) |
|---|---|
| Hampton Inn, Spark, Tru, Home2 Suites | 15,000 - 30,000 (secondary US markets); 35,000 - 50,000 (high-demand US) |
| Hilton Garden Inn, DoubleTree, Hilton (full-service) | 30,000 - 80,000 |
| Curio, Canopy, Tapestry (lifestyle) | 50,000 - 120,000 |
| Embassy Suites, Hilton resort properties | 50,000 - 150,000 |
| All-Inclusive Resorts (Cancun, Tulum, Riviera Maya, Curacao) | 80,000 - 130,000 (with all food, drinks, and activities) |
| Conrad, Waldorf Astoria | 95,000 - 250,000+ (urban / aspirational) |
| Small Luxury Hotels (SLH) on Hilton | 80,000 - 200,000 |

**Free Night Reward (FNR) certificates — how they work:**

FNR certificates from the Amex Hilton Surpass and Aspire cards do NOT have a fixed numerical points cap printed on the certificate. Instead, they are valid for any room classified as a "Standard Room Reward" at the booking property.

- **Mechanic is per-night, not averaged across the stay.** Each redemption night must have "Standard Room Reward" availability for that specific night. If a night is only available as a "Premium Room Reward," the FNR cannot be used for that night.
- **Effective ceiling in 2026:** the long-standing 95,000-point ceiling on Standard Room Rewards has lifted. Many luxury properties (Waldorf Astoria Maldives, Conrad Bora Bora, LXR properties) now price Standard Room Rewards at 120,000-150,000 points — and the FNR remains valid at those rates.
- **The FNR is invalid only when the room is classified as a Premium Room Reward**, not based on the point cost.

**FNR earn paths (current 2026):**
- **Amex Hilton Surpass:** earn 1 bonus FNR after $15,000 in calendar-year card spend.
- **Amex Hilton Aspire:** receive 1 anniversary FNR each year, plus earn an additional FNR after $30,000 calendar-year spend, plus another after $60,000 spend — up to 3 FNRs per year possible.

**5th Night Free rule** - applies on award stays of 5+ consecutive nights for Silver-and-above members. Stack with the dynamic-pricing model by booking stays where the per-night cost is already strong (Hampton in secondary US markets, all-inclusive resorts at shoulder season). Free nights apply to the 5th, 10th, 15th, and 20th nights; capped at 20 consecutive nights per reservation; points-only stays (not Points & Money).$ac$,
       last_verified = current_date
 where slug = 'hilton';
