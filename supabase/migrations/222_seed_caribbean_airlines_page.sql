-- Seed Caribbean Airlines (Caribbean Miles) Page content.
--
-- Editorial draft hedged for the items Copilot flagged UNVERIFIED on
-- 2026-05-08:
--   * Silver / Platinum spend thresholds: third-party (sflcn.com)
--   * Gold threshold: not publicly documented
--   * Per-tier earning multipliers: not publicly documented; omitted
--   * 15K/25K post-08-May-2026 chart: from program email to a member
--     (HIGH source, but full distance-band structure + one-way vs
--     round-trip not publicly published — hedged accordingly)
--   * Lounge access gated by Caribbean Club (separate $350/yr paid
--     membership), not by Miles elite tier. Caribbean Club + Miles are
--     distinct-but-complementary programs (Club auto-enrolls in Miles).
--
-- Site is a hash-routing SPA so Firecrawl can't reach loyalty content;
-- most editorial fields fall back to third-party sources, flagged via
-- "verify on next review" tags per feedback_flag_non_official_sources.md.

update programs set
  intro = $$Caribbean Airlines is the flag carrier of Trinidad and Tobago, with a secondary hub in Kingston, Jamaica - the airline that quietly does the heavy lifting connecting the English-speaking Caribbean to North America, the UK, and South America. The Caribbean Miles loyalty program got rebooted on 01 January 2025 (spend-based: Bronze / Silver / Gold / Platinum), and on 08 May 2026 they did something most loyalty programs do not: they eliminated peak rates entirely. What used to cost 30,000 miles for a peak-window economy redemption now costs 15,000, and members already booked into former peak windows are receiving automatic refunds of the difference.

For US points collectors this is a niche play. Caribbean Miles has no Amex / Chase / Capital One / Citi / Bilt transfer-in, no major alliance affiliation, and the co-brand RBC Caribbean Airlines Visa Platinum is only issued in select Caribbean territories (not the US). But if you live in the region or fly it often, the new flat chart is one of the cleaner regional currencies out there - and the separately-priced Caribbean Club paid membership ($350/yr) is the easiest path to lounge access on Caribbean Airlines metal.$$,

  how_to_spend = $$- Caribbean Airlines own-metal flights in economy and business class
- Cabin upgrades on a paid economy ticket (Classic Upgrade and Flex Upgrade redemptions)
- Earn-and-burn intra-Caribbean travel - the program's home turf
- 10% duty-free shopping discount when booking via the RBC Caribbean Airlines Visa Platinum (Caribbean territories only)$$,

  sweet_spots = $$- **Flat-rate post-08-May-2026 chart**: economy at 15,000 miles and business at 25,000 miles, year-round. The peak-rate elimination effectively cut summer / Christmas / New Year redemptions in half compared to the pre-08-May chart.
- **Flex Upgrade at 10,000 miles**: the cheapest way to put yourself in the front cabin if you already have a paid economy ticket on a flexible fare.
- **Business class redemption value**: at 25,000 miles for cash fares often $600-1,000+ on routes like POS-JFK or POS-LGW, the cents-per-point math gets favorable - if you can earn the miles via paid flying or the RBC card.

⚠️ Caribbean Miles cannot be transferred in from Amex / Chase / Capital One / Citi / Bilt as of May 2026 - earning is via paid Caribbean Airlines flights, the Caribbean-issued RBC card, or local retail partners. US-based collectors who don't fly the region routinely will struggle to accumulate a meaningful balance.$$,

  tier_benefits = $$[
    {
      "name": "Bronze",
      "qualification": "Sign up - no spend requirement",
      "benefits": [
        "Base earn rate on paid Caribbean Airlines flights",
        "Mile redemption for flights and cabin upgrades",
        "Eligible to earn through partner activity"
      ]
    },
    {
      "name": "Silver",
      "qualification": "Approximately $3,000 USD ticket spend per program year (third-party reported - verify on next review)",
      "benefits": [
        "Bonus mile multiplier on flights",
        "Increased baggage allowance",
        "Tier-specific perks per current program terms"
      ]
    },
    {
      "name": "Gold",
      "qualification": "Spend threshold not publicly documented as of May 2026 - verify on next review",
      "benefits": [
        "Higher bonus mile multiplier than Silver",
        "Priority check-in and priority boarding",
        "Increased baggage allowance"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "Approximately $12,000 USD ticket spend per program year (third-party reported - verify on next review)",
      "benefits": [
        "Top-tier bonus mile multiplier",
        "Upgrade reward eligibility",
        "Business class counter check-in",
        "Priority boarding",
        "Highest baggage allowance"
      ]
    }
  ]$$::jsonb,

  lounge_access = $$Caribbean Airlines operates one own-brand lounge: the **Caribbean Club Lounge** at Piarco International Airport (POS), near Gate 14 in Trinidad. About 3,062 sq ft with capacity around 80 passengers, a self-serve bar, catered breakfast / lunch / dinner depending on departure time, charging stations, free WiFi, and a children's playroom.

**Important - lounge access is gated by Caribbean Club, not by Caribbean Miles elite tier.** Caribbean Club is a separate paid membership program ($350 USD per year for an individual, $650 USD for an individual and co-applicant) that auto-enrolls you in Caribbean Miles but is distinct from the Miles tier system. Eligibility for the Caribbean Club Lounge:

- Same-day Caribbean Airlines business class ticket
- Active Caribbean Club membership (regardless of fare class on the day's flight)
- Paid day pass purchased at the lounge (subject to availability)

**Outstation lounges via Caribbean Club:** Club members also get partner lounge access at JFK (New York), MIA (Miami), MCO (Orlando), YYZ (Toronto), KIN (Kingston), and GEO (Georgetown, Guyana) when flying Caribbean Airlines that day. As a non-aligned carrier (not in oneworld / SkyTeam / Star Alliance), there is no reciprocal alliance lounge access at airports outside the Caribbean Club partner network. Verify the current Club partner-lounge list on caribbean-airlines.com before relying on access at any specific outstation.$$,

  quirks = $$- **Caribbean Club is not Caribbean Miles.** Club is a $350/yr paid membership that controls lounge access and includes priority boarding / standby / 5 free change vouchers. Miles is the free points-and-tier loyalty program (Bronze / Silver / Gold / Platinum). Joining Club auto-enrolls you in Miles, but the reverse is not true - earning Miles tiers does not grant lounge access.
- **Miles do not expire** as long as there is any qualifying activity (a paid Caribbean Airlines flight, partner activity, or an RBC Caribbean Airlines Visa Platinum purchase) at least once every 36 months. Separately, an account with no flying or partner activity for 24 months may be flagged inactive and stop receiving statements - though miles persist while the 36-month rule is satisfied.
- **No flexible-currency transfer partners** as of May 2026: no Amex / Chase / Capital One / Citi / Bilt / Wells Fargo transfers, and no Marriott / Hilton / IHG / Hyatt / Wyndham hotel-to-airline transfers in. Earning is via paid flights, the Caribbean-issued RBC card, or local retail partners only.
- **Co-brand card is region-locked.** The RBC Caribbean Airlines Visa Platinum is issued in select Caribbean territories (Trinidad and Tobago, Aruba, Curacao, others) - there is no US-issued Caribbean Airlines co-brand option, and references to a Bank of America Caribbean Airlines MasterCard in older articles are out of date.
- **Non-aligned carrier** - no oneworld / SkyTeam / Star Alliance affiliation. No tier crossover from other airline elite programs, no alliance-wide lounge access, no codeshare-to-elite-status pathway.
- **Peak rates eliminated 08 May 2026** - rare in loyalty world. Refunds of the difference between old and new rates are being applied automatically to members already booked into former peak windows (01 Jul - 04 Sep 2026, 15 Dec - 24 Dec 2026, 01 Jan - 08 Jan 2027).
- **Annual tier reset** with no soft-landing - missing your spend threshold drops you to the next tier down at year-end.$$,

  award_chart = $$Post-08-May-2026, peak redemption rates have been eliminated. Per the program email sent to members on 08 May 2026:

| Redemption | Old peak | New rate (year-round) |
|---|---|---|
| Economy | 30,000 | 15,000 |
| Business | 50,000 | 25,000 |
| Classic Upgrade | 30,000 | 15,000 |
| Flex Upgrade | 20,000 | 10,000 |

Former peak windows that triggered the higher rates (now refunded automatically to members already booked):
- 01 July 2026 - 04 September 2026
- 15 December 2026 - 24 December 2026
- 01 January 2027 - 08 January 2027

⚠️ The full chart structure (distance bands, one-way vs round-trip directionality, partner-airline pricing if any) is not publicly published as of May 2026. The 15K / 25K rates above come from the official program email and may apply to a single distance band or as a flat single-rate chart. Verify on caribbean-airlines.com Caribbean Miles redemption page before booking - and, in particular, confirm whether the rate is per direction or round-trip before assuming.$$,

  transfer_partners = '[]'::jsonb,

  partner_chart_url = 'https://www.caribbean-airlines.com/caribbean-miles/redeem-miles',
  last_verified = now(),
  updated_at = now()
where slug = 'caribbean-airlines';
