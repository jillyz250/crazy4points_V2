-- Apply user review feedback on the Marriott Bonvoy page (2026-05-05).
--
-- Five issues surfaced from spot-checking the live page:
--
-- 1. "The flip side of that scale:" intro phrasing was awkward - the chart
--    elimination isn't the opposite of having a large portfolio. Rewrite.
-- 2. The 20K and 25K FNA caps were presented as part of the active
--    co-brand spread; they only apply to legacy non-actively-issued cards
--    (older basic Marriott Bonvoy Chase, Premier Chase). Reframe so the
--    active spread is 35K / 50K / 85K and 20K / 25K are noted as legacy.
-- 3. Top-off raise from 15K to 25K verified via official marriott.com
--    scrape AND multi-source 2026 confirmation - keep but make stacking
--    explicit ("FNA + 25K points = redeem at properties up to cap+25K").
-- 4. Award chart hidden-by-default behavior changed in a separate code
--    edit (ProgramPageContent.tsx removed the <details> wrapper). This
--    migration only handles content; no DB change needed for the toggle.
-- 5. Chase UR transfer bonus active through May 15 2026 (65%, then 55%
--    May 16 - June 30) per Frequent Miler / OMAAT / LoyaltyLobby May 2026.
--    Adding the actual current bonus details so the BONUS badge means
--    something specific to readers.

update programs set
  intro = $intro$Marriott Bonvoy is the loyalty program for one of the largest hotel portfolios on the planet - 30+ brands, more than 8,500 properties, everything from a Fairfield off the interstate to a St. Regis with a butler. The trade-off for that scale: Marriott killed the fixed-price award chart back in 2022, so per-night point costs flex with demand within each property's category. Translation: the sweet spot hunt is alive and well, but it lives at the search bar, not the chart.

Where Bonvoy quietly punches above its weight is the Free Night Award. Most actively-issued co-brand cards issue at least one cert per year with caps from 35K up to 85K points, and as of March 2026 you can top off any cert with up to 25K Bonvoy points to reach a higher property tier - which means a 35K cert effectively books up to 60K, a 50K cert up to 75K, and an 85K cert up to 110K. The 5th-night-free benefit on award-points stays is also automatic, requires no elite status, and stacks across longer reservations. If you can stomach the dynamic pricing dance, there is still a lot of value here.$intro$,

  transfer_partners = $tp$[
    {
      "from_slug": "amex-membership-rewards",
      "ratio": "1:1",
      "notes": "Transfers typically post within minutes; not guaranteed instant. No transfer tax currently applies (Marriott is a hotel, not a US-domiciled airline). Periodic transfer bonuses run; check tracker before moving points.",
      "bonus_active": false
    },
    {
      "from_slug": "chase-ultimate-rewards",
      "ratio": "1:1.65 (65% bonus through May 15, 2026; 55% bonus May 16 - June 30, 2026; otherwise 1:1)",
      "notes": "Active 65% transfer bonus through May 15, 2026 (1,000 UR = 1,650 Bonvoy points), dropping to 55% May 16 - June 30. Transfers are typically instant on Chase's end. No transfer tax currently applies; confirm current tax treatment before transferring large balances.",
      "bonus_active": true
    },
    {
      "from_slug": "bilt-rewards",
      "ratio": "1:1",
      "notes": "Bilt-to-Marriott transfers run 1:1, typically instant. Bilt historically only allows transfers on Rent Day (the 1st of each month) - confirm current transfer windows on Bilt's site before planning a redemption.",
      "bonus_active": false
    }
  ]$tp$::jsonb,

  quirks = $q$- **Points expire after 24 months of inactivity** - any earning activity (stay, transfer, co-brand-card spend) resets the clock. Easy to keep alive even without staying.
- **No published award chart since 2022** - pricing is dynamic within each property's Cat 1-8 assignment. The de-facto bands surface via FNA caps (see below) and observed off-peak / standard / peak ranges.
- **Active Free Night Award caps (currently-issued co-brand cards):**
  - 35K cap - Bonvoy Boundless (Chase, anniversary); Bonvoy basic Amex (renewal); Premier Plus Business (renewal + spend bonus)
  - 50K cap - Bonvoy Bevy (Amex, calendar-year spend threshold)
  - 85K cap - Bonvoy Brilliant (Amex, renewal)
- **Legacy FNA caps (cards no longer actively issued to new applicants but still held by existing cardmembers):** 20K (basic Marriott Bonvoy Chase, calendar-year spend bonus), 25K (Marriott Bonvoy Premier Chase, anniversary), 85K (Ritz-Carlton Chase, anniversary).
- **March 2026: FNA top-off raised from 15K to 25K points.** Any cert can be combined with up to 25K Bonvoy points to redeem at a higher property: a 35K cert reaches up to 60K, a 50K cert up to 75K, an 85K cert up to 110K. The cap raise expanded eligibility to roughly 733 additional properties.
- **5th Night Free** applies to standard award redemptions only on points stays. Cash + Points, NUAs, FNAs, and Premium Rooms do not qualify. Lowest-points night is the free one. Multi-stack on stays of 10+ nights.
- **Suite Night Awards (SNAs)** clear automatically 5 days before arrival (3 days for EDITION, Ritz-Carlton, and St. Regis). Default Annual Choice Benefit for Platinum at 50 nights if no selection is made by Feb 1 of the following year.
- **Soft landing 2026** - members who do not requalify in 2025 hold the next-tier-down status from March 2026 through February 2027. Ambassador to Titanium, Titanium to Platinum, Platinum to Gold, Gold to Silver. Whether this soft-landing policy will continue beyond the 2026 membership year has not been officially confirmed - check official Bonvoy communications before counting on it.
- **United MileagePlus partnership (RewardsPlus)** confers reciprocal status: Bonvoy Titanium maps to MileagePlus Silver. Linking accounts is required.
- **Singapore Airlines KrisFlyer partnership (launched April 2026)** - points transfer 3:1 in both directions; benefits / status crossover available to linked members. Exact perks evolving - check official Bonvoy and KrisFlyer pages before relying on a specific benefit.
- **Lifetime status** - Lifetime Silver (5 yr Silver + 250 lifetime nights), Lifetime Gold (7 yr Gold + 400 nights), Lifetime Platinum (10 yr Platinum + 600 nights). Lifetime tiers do not include the highest annual perks of currently-earned Titanium / Ambassador.
- **Resort fees** - many Marriott resorts charge a daily resort fee even on award stays. Check each property's terms before booking.$q$,

  award_chart = $ac$**Marriott Bonvoy has not published a fixed award chart since March 2022.** Per-night award pricing is dynamic within each property's Category 1-8 assignment, with off-peak / standard / peak windows determined by demand and set roughly 12 months in advance. The official "calendar" view appears on each property's booking page. Properties stay in their assigned category - off-peak / standard / peak shifts the per-night point cost, not the category itself.

The **Free Night Award (FNA) caps** function as the de-facto published bands, since FNAs are what give the categories teeth: a 35K FNA can be redeemed at any property whose nightly award price falls at or below 35K points. As of March 2026, members can top off any FNA with up to 25K points to reach a higher tier.

**Active FNA tier reference (currently-issued co-brand cards, 2026):**

| FNA cap | Earned via |
|---|---|
| 35,000 pts | Bonvoy Boundless (Chase, anniversary); Bonvoy basic Amex (renewal); Premier Plus Business (renewal + spend bonus) |
| 50,000 pts | Bonvoy Bevy (Amex, calendar-year spend threshold) |
| 85,000 pts | Bonvoy Brilliant (Amex, renewal) |

**Legacy FNA caps (cards no longer issued to new applicants):** 20K (basic Marriott Bonvoy Chase, spend bonus), 25K (Marriott Bonvoy Premier Chase, anniversary), 85K (Ritz-Carlton Chase, anniversary).

**Observed point ranges per category (third-party - Frequent Miler empirical observations as of early 2026, NOT Marriott-published):**

| Category | Off-peak ~ | Standard ~ | Peak ~ |
|---|---|---|---|
| Cat 1 | 5K | up to 18K | varies |
| Cat 2 | 10K | up to 28K | varies |
| Cat 3 | 15K | up to 37K | varies |
| Cat 4 | 22K | up to 55K | varies |
| Cat 5 | 35K | up to 76K | varies |
| Cat 6 | 40K | up to 88K | varies |
| Cat 7 | 50K | up to 105K | varies |
| Cat 8 | 52K | up to 140K | varies |

Treat these as ballparks, not chart entries. Always confirm the actual nightly cost on the property's calendar before assuming a redemption is in reach.

**All-Inclusive sub-chart (officially published by Marriott, current 2026):**

| AI Category | Off-peak | Standard | Peak |
|---|---|---|---|
| AI-1 | 15,000 | 20,000 | 25,000 |
| AI-2 | 20,000 | 25,000 | 30,000 |

5th Night Free does not apply at All-Inclusive properties. Resort fees may still apply on award stays.$ac$,

  last_verified = now(),
  content_updated_at = now(),
  updated_at = now()
where slug = 'marriott-bonvoy';
