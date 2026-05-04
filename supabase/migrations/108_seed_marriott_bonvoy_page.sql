-- Seed full Marriott Bonvoy program page content + skeleton rows for two
-- transfer-source programs that don't exist yet.
--
-- BACKGROUND
-- ----------
-- Step 1 research for Marriott Bonvoy ran via scripts/research-program.mjs
-- against programs.scrape_urls (seeded in mig 107) plus the WebSearch queue
-- the script printed. Inbound transfers reference Chase Ultimate Rewards and
-- Bilt Rewards as points currencies; neither has a programs row yet (only
-- the credit_card 'chase' and 'bilt' issuer rows exist). Without skeleton
-- rows the inbound transfer table renders raw slugs instead of names. Mirror
-- of mig 083's pattern.
--
-- KEY DECISIONS / NON-OBVIOUS BITS
-- --------------------------------
-- * award_chart uses Marriott-specific framing: Marriott eliminated the
--   fixed-price chart in March 2022. The FNA caps function as the de-facto
--   bands (officially published, current 2026): 20K / 25K / 35K / 50K / 85K.
--   Observed empirical ranges per category sourced from Frequent Miler are
--   explicitly tagged as third-party per feedback_flag_non_official_sources.
-- * tier_benefits includes 3 lifetime tiers (Lifetime Silver / Gold /
--   Platinum) as separate rows alongside the 5 earnable tiers. Per user
--   feedback during the authoring session: missing lifetime status was the
--   largest gap in the first draft.
-- * Sweet spots corrected: property categories are FIXED per property; only
--   the per-night point cost shifts based on off-peak / standard / peak
--   windows. The luxury-properties-falling-into-Cat-1-3 framing in the
--   first draft was wrong.
-- * 5th Night Free explicitly limited to standard award redemptions on
--   points stays - excludes Cash + Points, Suite Night Awards, Free Night
--   Awards, and Premium Rooms.
-- * No Capital One or Citi ThankYou inbound rows: confirmed via Frequent
--   Miler May 2026 that neither transfers to Marriott Bonvoy.
-- * ASCII-only inside string data per feedback_ascii_only_in_sql_data.

-- ============================================================
-- 1. Skeleton rows for missing transfer-source program slugs
-- ============================================================
insert into programs (slug, name, type, is_active) values
  ('chase-ultimate-rewards', 'Chase Ultimate Rewards', 'loyalty_program', true),
  ('bilt-rewards',           'Bilt Rewards',           'loyalty_program', true)
on conflict (slug) do nothing;

-- ============================================================
-- 2. Marriott Bonvoy full page content
-- ============================================================
update programs set
  alliance = 'none',
  hubs = ARRAY[]::text[],

  intro = $intro$Marriott Bonvoy is the loyalty program for one of the largest hotel portfolios on the planet - 30+ brands, more than 8,500 properties, everything from a Fairfield off the interstate to a St. Regis with a butler. The flip side of that scale: Marriott killed the fixed-price award chart back in 2022, so per-night point costs flex with demand within each property's category. Translation: the sweet spot hunt is alive and well, but it lives at the search bar, not the chart.

Where Bonvoy quietly punches above its weight is the Free Night Award - every co-brand card issues at least one cert per year, with caps from 20K up to 85K points, and as of March 2026 you can top off any cert with up to 25K points to reach a higher property. The 5th-night-free benefit on points stays is also automatic, requires no elite status, and stacks across longer reservations. If you can stomach the dynamic pricing dance, there is still a lot of value here.$intro$,

  transfer_partners = $tp$[
    {
      "from_slug": "amex-membership-rewards",
      "ratio": "1:1",
      "notes": "Instant transfers; no transfer tax (Marriott is a hotel, not a US-domiciled airline so the federal excise tax does not apply). Periodic transfer bonuses run; check tracker before moving points.",
      "bonus_active": false
    },
    {
      "from_slug": "chase-ultimate-rewards",
      "ratio": "1:1",
      "notes": "Transfers typically post within ~1 day. No transfer tax. Periodic transfer bonuses to Bonvoy run; check the transfer-bonus tracker before moving points.",
      "bonus_active": true
    },
    {
      "from_slug": "bilt-rewards",
      "ratio": "1:1",
      "notes": "Bilt-to-Marriott transfers run 1:1, instant. Bilt only allows transfers on Rent Day (the 1st of each month) - plan accordingly.",
      "bonus_active": false
    }
  ]$tp$::jsonb,

  how_to_spend = $hts$- **Standard award nights** - book any participating property at its current points rate. No fixed chart since 2022; pricing is dynamic within each property's Category 1-8 assignment.
- **5th Night Free (Stay 5, Pay 4)** - automatically applied to standard award redemptions of 5+ consecutive nights on a single reservation. The lowest-points night becomes free. No elite status required; no opt-in. Multiple "Stay 5 Pay 4" segments can stack on a 10-night booking. **Award redemptions only** - Cash + Points stays, Premium Rooms, Nightly Upgrade Awards, and Free Night Awards do not qualify.
- **Free Night Awards (FNAs)** - issued by every Bonvoy co-brand card. Caps range from 20K to 85K points depending on which card earned them. As of March 2026, you can top off any FNA with up to 25K Bonvoy points to reach a higher property tier.
- **Cash + Points** - a partial-points booking option that varies by property. Generally weaker value than a full-points stay but useful when you are short.
- **Suite Night Awards (SNAs)** - Platinum-tier-and-above can earn 5 SNAs as the default Annual Choice Benefit at 50 elite nights. Used to confirm a suite upgrade in advance; clearance window is 5 days before arrival (3 days for EDITION, Ritz-Carlton, and St. Regis).
- **Outbound transfers to airlines** - 38 frequent-flyer programs at 3:1 ratio for most, with United MileagePlus offering a 10K bonus per 60K transferred (versus 5K bonus per 60K for other partners). AAdvantage, Avianca LifeMiles, and Delta SkyMiles are excluded from the transfer bonus. Air New Zealand AirPoints transfers at 200:1.$hts$,

  sweet_spots = $ss$- **Cat 1-3 budget brands** - Fairfield Inn, SpringHill Suites, Courtyard, and Four Points often fall in the 5,000-17,500-point band depending on demand window. With the 5th-night-free benefit on a 5-night points stay, a Cat 2 redemption can land around 32,000 points total - solid value for a road-trip overnight or family base.
- **Off-peak windows on lower-cat properties** - properties in Southeast Asia, India, and rural US destinations often see off-peak pricing that pushes redemption value above 1.0 cpp. Note: the property's category assignment doesn't change with off-peak/standard/peak - only the per-night point cost shifts within that category.
- **Al Maha, a Luxury Collection Desert Resort & Spa, Dubai** - all-inclusive luxury runs roughly 100K-120K points/night against $2,500+ cash rates. Among the higher-redemption-value plays in the portfolio (~2.0-2.5 cpp range as of early 2026).
- **All-inclusive resorts** - Cat AI-1 starts at 15K off-peak, 20K standard, 25K peak. Royalton Negril (Jamaica) priced around 56K/night; Westin Reserva Conchal (Costa Rica) around 69K/night per recent observations.
- **Top off your FNA before booking** - a 35K Boundless cert + 25K points top-off gets you a 60K property; a 50K Bevy cert + 25K reaches 75K; an 85K Brilliant cert + 25K reaches 110K. As of March 2026's cap increase, this expanded eligibility to roughly 733 additional properties (~8% of the portfolio).
- **Heads up - devaluation territory:** Cat 4-6 bands have seen the most price creep across 2024-2026. Top-end Ritz-Carlton Reserve properties (e.g. Nujuma) now price up to ~327K/night; some North Island-tier outliers up to ~605K. TPG's mid-2026 valuation puts Bonvoy points around 0.7 cpp on average - sweet spots beat the average; do not assume cash rates make all redemptions winners.$ss$,

  tier_benefits = $tb$[
    {
      "name": "Silver Elite",
      "qualification": "10 elite nights/year",
      "benefits": [
        "10% bonus points on stays",
        "Priority late checkout (subject to availability)",
        "Free in-room internet upgrade where applicable",
        "Dedicated Elite reservation line"
      ]
    },
    {
      "name": "Gold Elite",
      "qualification": "25 elite nights/year",
      "benefits": [
        "25% bonus points on stays",
        "Enhanced room upgrade (room type only; subject to availability)",
        "2pm late checkout (subject to availability)",
        "Welcome gift (points)",
        "Free in-room internet upgrade where applicable"
      ]
    },
    {
      "name": "Platinum Elite",
      "qualification": "50 elite nights/year",
      "benefits": [
        "50% bonus points on stays",
        "Enhanced room upgrade including select suites (subject to availability upon arrival)",
        "Lounge access at participating properties (or Continental breakfast at properties without a lounge)",
        "4pm guaranteed late checkout (excludes resorts and convention hotels at some brands)",
        "Welcome gift (choice of points, F&B credit, or amenity)",
        "Annual Choice Benefit at 50 nights - defaults to 5 Suite Night Awards if no selection by Feb 1 of following year"
      ]
    },
    {
      "name": "Titanium Elite",
      "qualification": "75 elite nights/year",
      "benefits": [
        "75% bonus points on stays",
        "All Platinum benefits",
        "Second Annual Choice Benefit at 75 nights",
        "48-hour guaranteed reservation",
        "United MileagePlus Silver status via RewardsPlus partnership"
      ]
    },
    {
      "name": "Ambassador Elite",
      "qualification": "100 elite nights/year + $23,000 USD qualifying spend",
      "benefits": [
        "All Titanium benefits",
        "Dedicated personal Ambassador (in addition to Anytime Ambassador team)",
        "Your24 - choose your check-in time and keep your room until the same time on departure (request via Ambassador Service 2 days prior; subject to availability; property and brand exceptions apply)"
      ]
    },
    {
      "name": "Lifetime Silver",
      "qualification": "5 years of Silver Elite or higher + 250 lifetime nights",
      "benefits": [
        "Permanent Silver Elite status (does not expire)",
        "Includes all earnable Silver benefits",
        "Does NOT confer the highest-tier annual benefits if currently earned at higher tier"
      ]
    },
    {
      "name": "Lifetime Gold",
      "qualification": "7 years of Gold Elite or higher + 400 lifetime nights",
      "benefits": [
        "Permanent Gold Elite status (does not expire)",
        "Includes all earnable Gold benefits"
      ]
    },
    {
      "name": "Lifetime Platinum",
      "qualification": "10 years of Platinum Elite or higher + 600 lifetime nights",
      "benefits": [
        "Permanent Platinum Elite status (does not expire)",
        "Includes all earnable Platinum benefits including lounge access and 4pm late checkout",
        "Lifetime tiers do not include current-year Titanium / Ambassador-only benefits"
      ]
    }
  ]$tb$::jsonb,

  lounge_access = $la$**Marriott Bonvoy lounge access is tier-gated, not airline-style alliance access.** Platinum Elite and above receive complimentary access to Executive / Concierge / Club lounges at participating brands - typically Marriott (full-service), JW Marriott, Sheraton, Westin, Le Meridien, Renaissance, Delta Hotels, Autograph Collection (varies by property), and most Luxury Collection / St. Regis properties (where lounges exist). Limited-service brands (Courtyard, Fairfield, SpringHill, etc.) do not have lounges, so Platinum-and-above receive a daily F&B credit instead at most North American properties.

Lounge benefits typically include:
- Continental breakfast
- All-day non-alcoholic beverages and snacks
- Evening hors d'oeuvres and select beverages

Resort properties and convention hotels often opt out of lounge access for elite members; check the specific property's benefits page before booking. EDITION, Ritz-Carlton, and Bulgari brands generally do not extend Marriott Bonvoy lounge benefits.$la$,

  quirks = $q$- **Points expire after 24 months of inactivity** - any earning activity (stay, transfer, co-brand-card spend) resets the clock. Easy to keep alive even without staying.
- **No published award chart since 2022** - pricing is dynamic within each property's Cat 1-8 assignment. The de-facto bands surface via FNA caps (see below) and observed off-peak / standard / peak ranges.
- **Free Night Award caps by co-brand card (officially published, current 2026):**
  - 20K cap - Marriott Bonvoy basic Chase ($25K calendar-year spend)
  - 25K cap - Marriott Bonvoy Premier (Chase, legacy - anniversary)
  - 35K cap - Bonvoy Boundless (Chase, anniversary); Bonvoy basic Amex (renewal); Premier Plus Business (renewal + $60K spend bonus)
  - 50K cap - Bonvoy Bevy (Amex, $15K calendar-year spend)
  - 85K cap - Bonvoy Brilliant (Amex, renewal); Ritz-Carlton (Chase, legacy - anniversary)
- **March 2026: FNA top-off raised from 15K to 25K points.** Any cert can now be topped off with up to 25K points, expanding eligibility to roughly 733 additional properties.
- **5th Night Free** applies to standard award redemptions only on points stays. Cash + Points, NUAs, FNAs, and Premium Rooms do not qualify. Lowest-points night is the free one. Multi-stack on stays of 10+ nights.
- **Suite Night Awards (SNAs)** clear automatically 5 days before arrival (3 days for EDITION, Ritz-Carlton, and St. Regis). Default Annual Choice Benefit for Platinum at 50 nights if no selection is made by Feb 1 of the following year.
- **Soft landing 2026** - members who do not requalify in 2025 hold the next-tier-down status from March 2026 through February 2027. Ambassador to Titanium, Titanium to Platinum, Platinum to Gold, Gold to Silver. Marriott has indicated this policy continues into the 2026 membership year.
- **United MileagePlus partnership (RewardsPlus)** confers reciprocal status: Bonvoy Titanium maps to MileagePlus Silver. Linking accounts is required.
- **April 2026 partnership: Singapore Airlines KrisFlyer + Marriott Bonvoy** - points transfer 3:1 in both directions; benefits / status crossover available to linked members. Exact perks evolving - check official Bonvoy and KrisFlyer pages before relying on a specific benefit.
- **Lifetime status** - Lifetime Silver (5 yr Silver + 250 lifetime nights), Lifetime Gold (7 yr Gold + 400 nights), Lifetime Platinum (10 yr Platinum + 600 nights). Lifetime tiers do not include the highest annual perks of currently-earned Titanium / Ambassador.
- **Resort fees** - many Marriott resorts charge a daily resort fee even on award stays. Check each property's terms before booking.$q$,

  award_chart = $ac$**Marriott Bonvoy has not published a fixed award chart since March 2022.** Per-night award pricing is dynamic within each property's Category 1-8 assignment, with off-peak / standard / peak windows determined by demand and set roughly 12 months in advance. The official "calendar" view appears on each property's booking page. Properties stay in their assigned category - off-peak / standard / peak shifts the per-night point cost, not the category itself.

The **Free Night Award (FNA) caps** function as the de-facto published bands, since FNAs are what give the categories teeth: a 35K FNA can be redeemed at any property whose nightly award price falls at or below 35K points. As of March 2026, members can top off any FNA with up to 25K points to reach a higher tier.

**FNA tier reference (officially published by Marriott, current 2026):**

| FNA cap | Earned via |
|---|---|
| 20,000 pts | Marriott Bonvoy basic Chase ($25K calendar-year spend) |
| 25,000 pts | Marriott Bonvoy Premier (Chase, legacy - anniversary) |
| 35,000 pts | Bonvoy Boundless (Chase, anniversary); Bonvoy basic Amex (renewal); Premier Plus Business (renewal + $60K spend bonus) |
| 50,000 pts | Bonvoy Bevy (Amex, $15K calendar-year spend) |
| 85,000 pts | Bonvoy Brilliant (Amex, renewal); Ritz-Carlton (Chase, legacy - anniversary) |

**Observed point ranges per category (third-party - Frequent Miler empirical observations as of mid-2026, NOT Marriott-published):**

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
