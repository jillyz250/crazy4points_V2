-- Seed Sonesta Travel Pass program page at /programs/sonesta.
-- Sourced from official travelpass.sonesta.com main page + FAQ (scraped via Firecrawl 2026-06-17):
--   tier thresholds, earn rates by brand, redemption mechanic, status carryover, status match,
--   reward-night family transfer, qualifying-rate rules, brand/geography footprint.
-- Lean style per editorial directive: avoid derived math + excessive specificity; keep only
-- official figures, stated lightly. Airline-transfer claim (JetBlue/Lufthansa 5:1) seen in
-- secondary sources is NOT on Sonesta's official partner roster -- omitted rather than asserted.
-- Co-brand card discontinued 2026 (BofA); no current card. No inbound bank transfers.

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'Sonesta Travel Pass is the loyalty program for Sonesta International Hotels, spanning more than a dozen brands and over a thousand properties -- from the upscale Royal Sonesta and The James down through Sonesta Select, Red Lion, and value brands like Americas Best Value Inn. The footprint is US-centric, with a growing presence across Latin America (Chile, Colombia, Ecuador, Peru) and a handful of other markets. It is free to join and has been a repeat winner of USA Today''s readers'' choice for hotel loyalty programs.

Two things make it interesting for a points-minded traveler. First, status is unusually easy to reach: you climb the four tiers (Bronze, Silver, Gold, Platinum) by qualifying nights OR by points earned in a calendar year, so a few stays -- or a status match from another hotel program -- can unlock meaningful perks like breakfast and upgrades. Second, redemptions are simple and flexible: free nights start low and scale with a hotel''s tier, with no airline or bank transfer partners and no current co-brand card to complicate things. The trade-off is that value lives entirely inside the Sonesta family -- points are useful for Sonesta stays and little else.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Free nights at Sonesta properties**: Redeem points for award nights at participating Sonesta hotels. The point cost starts low for entry-tier hotels and scales up with a property''s tier, so the same balance stretches much further at a budget Sonesta than at a Royal Sonesta resort. Book directly on Sonesta.com and select "Rewards Points" at checkout, or redeem by phone with the Travel Pass team.
- **No award chart to study**: There is no published fixed chart -- you see the points needed for a free night right below the cash price when you look up a room, so redemption value is transparent at the moment of booking even though it varies by hotel and date.
- **Gift a free night to family**: Unusually, you can transfer a free reward night to an immediate family member -- a flexibility most hotel programs do not offer (see Sonesta''s terms for details).
- **No transfers or merchandise**: Points are not convertible to airline miles, bank currencies, or merchandise through any current Sonesta partner. The program''s value is realized as free Sonesta nights.',

  sweet_spots = '- **Status match is the headline play**: Sonesta will match Silver, Gold, or Platinum status from a competing hotel program -- just enroll and send Travel Pass Customer Care proof of your existing status. For a traveler who already holds elite status elsewhere, this is the fastest route to Sonesta breakfast, upgrades, and bonus earning with no spend required.
- **Low bar to real perks**: Unlike programs that gate meaningful benefits behind dozens of nights, Sonesta''s elite tiers arrive after relatively few qualifying nights -- and you can alternatively reach them on points earned. The mid tiers already deliver the perks travelers actually use (early check-in, late checkout, breakfast, upgrades where available).
- **Military and veterans reach Gold directly**: Active-duty military and veterans can book a dedicated rate that confers Gold status -- bypassing the usual qualification entirely.
- **Redeem at value properties for outsized stretch**: Because award pricing scales by hotel tier and starts low, points go a long way at Sonesta''s mid- and economy-tier brands -- a practical way to turn a modest balance into several free nights.
- **Reality check**: Sonesta is a regional, US-anchored program with no transfer partners and no current co-brand card, so points only matter if your travels actually touch a Sonesta property. Treat it as a useful program for Sonesta guests rather than a flexible points currency.',

  tier_benefits = '[
    {
      "name": "Bronze",
      "qualification": "Automatic on enrollment (free to join)",
      "benefits": [
        "Earn points toward free nights on qualifying stays",
        "Complimentary upgraded Wi-Fi",
        "Member-only rates and offers",
        "Custom room preferences (bed type and location) where available"
      ]
    },
    {
      "name": "Silver",
      "qualification": "Reached with 10 qualifying nights or by earning enough points in a calendar year",
      "benefits": [
        "All Bronze benefits",
        "Early check-in and late check-out (subject to availability)",
        "Exclusive member reservations line",
        "Welcome gift on arrival",
        "Complimentary room upgrade at select properties (subject to availability)",
        "Bonus point multiplier on qualified stays"
      ]
    },
    {
      "name": "Gold",
      "qualification": "Reached with 20 qualifying nights or by earning enough points in a calendar year; also available to active-duty military and veterans via the dedicated rate",
      "benefits": [
        "All Silver benefits",
        "Complimentary daily continental breakfast",
        "Preferred self-parking where available"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "Reached with 40 qualifying nights or by earning enough points in a calendar year",
      "benefits": [
        "All Gold benefits",
        "The program''s largest bonus point multiplier on qualified stays"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Sonesta Travel Pass does not include a club-lounge or executive-lounge program, and there is no airport lounge access at any tier.

Elite recognition is delivered through stay perks instead -- early check-in and late check-out (Silver and above), complimentary room upgrades at select properties, and complimentary daily continental breakfast from Gold. Individual Royal Sonesta and resort properties may operate their own club floors or lounges tied to specific room products, but that is a property feature booked separately, not a Travel Pass tier benefit.',

  quirks = '- **Status by nights OR points**: You reach each tier either by qualifying nights or by points earned in a calendar year -- so heavy spenders can effectively earn status through paid stays rather than night count alone.
- **Status carries into the next year**: Status earned in a calendar year holds through the end of the following calendar year before requalification.
- **Dynamic redemption, no fixed chart**: Free-night point costs scale with a hotel''s tier and are shown alongside the cash price at booking. Award nights start low at entry-tier hotels and rise at premium properties.
- **Free nights are family-transferable**: A free reward night can be transferred to an immediate family member -- a flexibility most hotel programs do not allow.
- **Earn rate varies by brand**: Most Sonesta brands earn the full points rate on qualifying room spend; the value and economy brands (Sonesta Simply Suites, Americas Best Value Inn, Canadas Best Value Inn, Signature Inn) earn at a reduced rate. Meetings/events and cruise bookings earn at their own lower rates.
- **Direct-booking only**: Points and benefits are earned on stays booked through Sonesta.com or the call center; third-party / OTA, wholesale, group, and award stays do not qualify.
- **Points lapse with inactivity**: Points expire after a prolonged period with no qualifying activity -- keep earning or redeeming periodically to keep them alive.
- **No co-brand card and no transfer partners**: The former Sonesta World Mastercard was discontinued in 2026, and there is no current Sonesta credit card. Points do not transfer to airline or bank programs; Sonesta''s partner roster covers travel services (car rental, fuel, fitness, dining) rather than points transfers.
- **Regional footprint**: Strongest in the US, with growing coverage in Latin America and select international markets (plus Sonesta''s Egypt Nile cruises). Useful mainly where your travel overlaps a Sonesta brand.',

  award_chart = 'Sonesta Travel Pass does not publish a traditional fixed award chart. Free-night pricing is tied to a hotel''s tier and is shown next to the cash rate when you look up a room, so you see the cost before you commit. Award nights start low at entry-tier hotels and scale up at premium properties; redemptions are made by selecting "Rewards Points" at checkout on Sonesta.com.

**How points are earned:**
- Members earn the full points rate per dollar on qualifying room spend at most Sonesta brands, and a reduced rate at the value and economy brands (Sonesta Simply Suites, Americas Best Value Inn, Canadas Best Value Inn, Signature Inn)
- Meetings/events bookings and Sonesta cruise bookings earn at their own lower rates
- Earned only on direct bookings (Sonesta.com or the call center); third-party, wholesale, group, and award stays do not qualify

**Status tiers (by qualifying nights or points earned in a calendar year):**
- Bronze: automatic on enrollment
- Silver: 10 qualifying nights (or the points equivalent)
- Gold: 20 qualifying nights (or the points equivalent); also via the military/veterans rate
- Platinum: 40 qualifying nights (or the points equivalent)
Status earned in a calendar year holds through the end of the following year. Elite tiers add bonus point multipliers on qualified stays, with Platinum earning the largest.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'sonesta';
