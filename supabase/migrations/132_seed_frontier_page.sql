-- Seed full /programs/frontier page content for Frontier Miles.
--
-- Research source: scripts/research-program.mjs scraped 5 official
-- Frontier pages 2026-05-05 (tiers, T&C, earn rules, news, program
-- landing) plus 6 WebSearch topics. Cross-fact-checked against Copilot
-- + ChatGPT.
--
-- KEY CORRECTIONS FROM FACT-CHECK PASS:
-- * Pricing model: Frontier is NOT pure-dynamic. They publish structured
--   "starting" award levels (5K domestic, 15K Mexico/Caribbean) with
--   three booking tiers (Value/Standard/Last Seat). Reframed as tiered/
--   hybrid in award_chart, NOT "dynamic only".
-- * Mile expiry: miles DO expire after 12 months of account inactivity.
--   The earlier "do not expire as long as account active" wording was
--   misleading - any earning activity resets the 12-month clock.
-- * Hubs: only Denver (DEN) is verified as the main operational hub.
--   The "LAS/MCO/MIA/ATL/PHX major bases" framing was unverified by
--   both Copilot and ChatGPT - dropped from intro and quirks.
-- * Diamond 20x earning: phrased as base 10x + 100% multiplier on top
--   = 20x effective for Diamond (matches official tier benefit text).
--
-- Wyndham Rewards isn't seeded as a program row yet - skeleton row
-- inserted via on-conflict-do-nothing so the inbound transfer table
-- renders the brand name instead of the raw slug.
--
-- ASCII-only inside string data per feedback_ascii_only_in_sql_data.

-- ============================================================
-- 1. Skeleton row for Wyndham Rewards (referenced as inbound transfer)
-- ============================================================
insert into programs (slug, name, type, is_active) values
  ('wyndham-rewards', 'Wyndham Rewards', 'loyalty_program', true)
on conflict (slug) do nothing;

-- ============================================================
-- 2. Frontier Miles full page content
-- ============================================================
update programs set
  alliance = 'none',
  hubs = ARRAY['DEN']::text[],

  intro = $intro$Frontier Miles is the loyalty program for America's biggest remaining ultra-low-cost carrier. As of May 2026, with Spirit's collapse, Frontier is the only national ULCC of size still standing - and they're in active reinvention mode. First Class debuted early 2026, miles can now redeem for bag/seat/priority bundles starting at 2,000, and the elite program has some of the lowest US status thresholds (Gold at just 20,000 points/year).

The catch: Frontier Miles uses a tiered award structure where redemption costs depend on which booking tier (Value, Standard, or Last Seat) is available on your route. Value-tier domestic awards start at 5,000 miles; US-to-Mexico/Caribbean Value awards start at 15,000. Standard tier costs more but has more inventory. Last Seat is Elite-only and expensive but always available when seats remain. If you book early or fly off-peak, this can deliver real value; book a holiday weekend at the last minute and you'll get crushed.$intro$,

  transfer_partners = $tp$[
    {
      "from_slug": "marriott-bonvoy",
      "ratio": "3:1",
      "notes": "Hotel-to-airline transfer at an unfavorable 3:1 ratio. Functional only as a top-off mechanism; you typically get more value redeeming Marriott points for hotel stays than transferring to Frontier. No transfer tax.",
      "bonus_active": false
    },
    {
      "from_slug": "wyndham-rewards",
      "ratio": "5:1",
      "notes": "Wyndham points transfer to Frontier at a poor 5:1 ratio. Useful only if you need a small number of Frontier miles and have stuck Wyndham points; not a meaningful earn path. No transfer tax.",
      "bonus_active": false
    }
  ]$tp$::jsonb,

  how_to_spend = $hts$- **Award flights** - book any Frontier-operated route at one of three booking tiers: Value (lowest miles, limited inventory), Standard (mid), or Last Seat (Elite-only, most miles, always available when seats remain). Domestic Value awards start at 5,000 miles one-way; US-to-Mexico/Caribbean Value awards start at 15,000 miles.
- **Bundle redemptions** - redeem miles for bags, seat selection, priority boarding, and no-change-fee bundles. Economy bundles from 2,000 miles, Premium bundles from 4,000, Business bundles from 8,000. Useful for low mile balances that won't fund a full ticket.
- **Companion certificates** - Frontier Airlines World Mastercard cardmembers get a companion travel benefit. Diamond elites get unlimited companion travel and can change companion on every flight.
- **Charitable donations** - donate miles to Frontier's partner charities. Extends use cases beyond travel but no personal value.$hts$,

  sweet_spots = $ss$- **Domestic short-haul Value awards** - 5,000 miles one-way for short-haul routes when Value-tier inventory is open. Books up early on holidays and weekends; if you can grab Value on a peak-cash date you can hit 3-5 cpp.
- **US to Mexico / Caribbean Value awards** - 15,000 miles one-way to Cancun, Cabo, San Jose del Cabo, Punta Cana, Montego Bay, etc. Strong value during winter peak when paid fares run $300-500+.
- **Bundle the small balance** - if you have 2,000-8,000 leftover miles, the bundle redemptions can outperform converting to a partial flight. A priority + bag bundle at ~3K miles typically lands at ~3 cpp.
- **Elite-only Last Seat awards** - Diamond and Platinum elites can redeem on Last Seat when no Value or Standard is open. Use this when paid fares are high and Value isn't available - the math still works for Elite redemptions on $400+ cash dates.
- **Heads up - tiered does not mean cheap** - Standard and Last Seat redemptions cost considerably more than the Value floor. Frontier's earlier claim of "starting at 5K miles" only applies when Value inventory is open, which on holiday weekends is often never. Always check the cash equivalent before redeeming.
- **Status match offer** - Frontier offers Elite Gold status through 2026 for $69 to current elite members of Southwest, JetBlue, or Alaska Airlines. Worth a look if you're elite elsewhere and fly Frontier even occasionally - you get free carry-on and Group 1 boarding for the year.$ss$,

  tier_benefits = $tb$[
    {
      "name": "Elite Silver",
      "qualification": "10,000 Elite Status Points/calendar year (or $1,000 spent on Frontier purchases)",
      "benefits": [
        "Priority Customer Care online chat",
        "No change/cancel fee on the Member's reservation 7+ days before departure (subject to fare difference)",
        "Family Pooling option",
        "Standard seat assignment at booking (subject to availability)",
        "Preferred seat at check-in (subject to availability)",
        "Group 4 boarding for the Member and up to 8 companions on same reservation",
        "20% mile multiplier on flyfrontier.com purchases (does not apply to Frontier card spend)"
      ]
    },
    {
      "name": "Elite Gold",
      "qualification": "20,000 Elite Status Points/calendar year",
      "benefits": [
        "All Silver benefits",
        "Free carry-on bag",
        "Group 1 boarding for the Member",
        "Standard or Preferred seat at booking; Premium or Preferred at check-in",
        "40% mile multiplier on flyfrontier.com purchases"
      ]
    },
    {
      "name": "Elite Platinum",
      "qualification": "50,000 Elite Status Points/calendar year",
      "benefits": [
        "All Gold benefits",
        "Free carry-on bag for Member and up to 8 companions on same reservation",
        "1 free checked bag for Member and up to 8 companions on same reservation",
        "Standard seat at booking + Premium or Preferred at check-in for full party (up to 8)",
        "Zone 1 boarding for full party"
      ]
    },
    {
      "name": "Elite Diamond",
      "qualification": "100,000 Elite Status Points/calendar year",
      "benefits": [
        "All Platinum benefits",
        "20x effective miles on flyfrontier.com purchases (10x base earn + 100% multiplier on top)",
        "Refundability on Member's reservation up to 24 hours before departure",
        "Premium or Preferred seat at booking for full party (up to 8)",
        "UpFront Plus seat at check-in for Member (debuted 2024)",
        "Priority Boarding",
        "2 free checked bags for full party",
        "Pet fee waiver (subject to availability)",
        "Unlimited companion travel - companion can change each flight"
      ]
    }
  ]$tb$::jsonb,

  lounge_access = $la$**Frontier does not operate physical lounges and does not have alliance lounge access.** As an ultra-low-cost carrier, Frontier's elite tiers (Silver through Diamond) do NOT include any lounge benefits. Travelers needing lounge access at Frontier-served airports must use:

- **Priority Pass** (sold separately or via a premium-card benefit)
- **Plaza Premium / The Club / Escape** networks (paid day passes, typically $50-65)
- **American Express Centurion / Capital One Lounges** (premium-card benefits at limited airports)

Frontier's Denver hub (DEN) and other major-volume airports all have multiple Priority Pass and credit-card-issuer lounges available, but Frontier itself does not subsidize, partner with, or offer access to any of them.$la$,

  quirks = $q$- **Tiered award pricing, not pure-dynamic** - Frontier publishes "starting" mile costs per route group, but actual redemption depends on which booking tier (Value / Standard / Last Seat) is open on your specific date. Value sells out fast on peak weekends. The fixed-chart era ended with the FRONTIER Miles relaunch (revenue-based earning rolled out January 2024).
- **Family Pooling requires either Elite Status OR the Barclays Frontier Mastercard** to open a pool. Up to 8 family/friends can contribute. The pool head has full redemption control without contributor permission. 90-day cooldown before a member can switch pools.
- **Elite Status Points (ESP) are calendar-year** - January 1 through December 31. Status earned in 2026 is valid through February 2027. Easier on/off compared to legacy carriers' rolling-year systems.
- **Easy alt-path to Silver: $1,000 spent on Frontier purchases** unlocks Silver status without accumulating 10K ESP. Friendly to occasional flyers who put a few flights on the Barclays card.
- **Frontier Airlines World Mastercard (Barclays)** is the only co-brand card. $99 annual fee, 5x flyfrontier.com / 3x dining / 1x other. Current SUB is 50,000 miles after $500 spend in first 90 days. 2 free checked bags benefit added recently. $100 annual flight voucher after $2,500 spend.
- **Status match: Elite Gold through 2026 for $69** if you currently hold elite status with Southwest, JetBlue, or Alaska Airlines. Frontier had Spirit on the eligible list before Spirit's May 2026 collapse - check the current frontierstatusmatch.com offer page before relying on partner eligibility.
- **GoWild! All-You-Can-Fly Pass** - $349 for the 2026-2027 annual pass during the limited early-access window (regular price $599). Separate from the miles program; bookings made within 24 hours of departure on empty seats.
- **Mile expiry** - Frontier Miles expire after 12 months of account inactivity. Any earning event (a flight, a Frontier-card purchase, a partner earn) resets the 12-month clock.
- **Spring 2026 program changes** - First Class debuted early 2026 (combination of larger seats + new fare bundle). 23 new routes launched late winter / early spring 2026 including new Mexico routes. Network expanding aggressively into top-20 US metros.
- **No alliance, no lounge access, no global partner network** - Frontier Miles awards are on Frontier-operated metal only. The program isn't a transferable-currency partner of Amex MR, Chase UR, Citi TYP, Cap One, or Bilt.$q$,

  award_chart = $ac$**Frontier Miles uses a tiered award structure**, not a fixed chart. Three booking tiers govern per-flight redemption cost; the lowest published "starting" levels apply only when the cheapest tier (Value) is open on your date.

**Three booking tiers:**

| Tier | Description | Inventory |
|---|---|---|
| **Value** | Lowest mile cost. Books up fast on holidays and weekends. | Limited |
| **Standard** | Mid-tier. More inventory, more miles than Value. | Moderate |
| **Last Seat** | Elite-only (Silver and above). Most miles. Available whenever seats remain. | Always |

**Sample Value-tier minimums (when Value inventory is open):**

| Route group | Starting miles one-way |
|---|---|
| US domestic + Puerto Rico | 5,000 |
| US to Mexico / Jamaica / Dominican Republic | 15,000 |
| US to other Caribbean / Central America | 15,000-20,000 (varies) |

Standard and Last Seat tiers cost progressively more. There is no single published table for Standard or Last Seat - the cost varies by route, date, and live demand. Always check the cash equivalent before redeeming.

**Bundle redemptions (announced 2025-2026):** miles can also redeem for ancillaries instead of full flights:

| Bundle type | Includes | Starts at |
|---|---|---|
| Economy bundle | Bag, seat, priority boarding | 2,000 miles |
| Premium bundle | Above + premium seat assignment | 4,000 miles |
| Business bundle | Above + bigger seat (UpFront Plus / First Class adjacent) | 8,000 miles |

**No partner award chart.** Frontier doesn't have airline alliance partners or partner-award redemption options. All Frontier Miles awards book Frontier-operated metal only.

Average mile value sits around 1.0-1.1 cpp per third-party trackers (TPG mid-2026 valuations); peak-cash-date Value-tier redemptions can reach 3-5 cpp. Compare cash before redeeming: dynamic-cash days are often poor mile dates.$ac$,

  last_verified = now(),
  content_updated_at = now(),
  updated_at = now()
where slug = 'frontier';
