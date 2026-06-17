-- Seed Malaysia Airlines Enrich program page at /programs/malaysia (oneworld).
-- Sourced from official enrich.malaysiaairlines.com (main + EnrichUpdates2026) scraped via Firecrawl
-- 2026-06-17, plus 2026 WebSearch for transfer access + oneworld context.
-- Program refreshed effective 2026-01-01 (raised Elite Status requirements for 2027 qualification,
-- higher Enrich Points multipliers for elites). Lean style.
-- US transfer access limited: Marriott Bonvoy transfers in; Citi ThankYou has been on-and-off
-- (dropped 2022, sources differ on current status -- verify); Amex/Chase/Capital One do NOT; no US card.

update programs set
  alliance = 'oneworld',
  hubs = '{KUL}',

  intro = 'Enrich is the loyalty program of Malaysia Airlines, a oneworld member hubbed in Kuala Lumpur. Points redeem across the oneworld network -- American Airlines, British Airways, Qantas, Cathay Pacific, Japan Airlines, Qatar Airways and others -- so Enrich is most interesting as a way into oneworld premium cabins, with Malaysia''s own A350 Business Suite the standout home redemption.

The program was refreshed effective January 1, 2026: elites now earn more Enrich Points per ringgit, and the Elite Status thresholds were raised for 2027 qualification. Like most non-US programs, the catch for US travelers is access. Marriott Bonvoy transfers into Enrich, Citi ThankYou has been an on-and-off partner (verify current status), and Amex, Chase, and Capital One do not transfer at all -- there is no US Enrich co-brand card. For most US flyers the practical move is to book Malaysia Airlines flights using another oneworld currency such as AAdvantage miles or Avios, rather than building an Enrich balance directly.',

  transfer_partners = '[
    {"from_slug": "marriott", "ratio": "3:1", "notes": "Marriott Bonvoy transfers to Enrich at the standard hotel-to-airline rate (roughly 3 Bonvoy points to 1 mile, with a bonus on 60,000-point increments). No transfer tax. Verify the current ratio at marriott.com before transferring."}
  ]'::jsonb,

  how_to_spend = '- **oneworld award flights (the main draw)**: Redeem Enrich Points across oneworld -- American, British Airways, Qantas, Cathay Pacific, Japan Airlines, Qatar Airways and more -- plus Malaysia Airlines'' own network. Malaysia''s A350 Business Suite between Kuala Lumpur and London, Tokyo, or Sydney is the aspirational home redemption.
- **Cabin upgrades**: Use points to upgrade eligible Malaysia Airlines fares; Elite Points still accrue based on the upgraded cabin.
- **Golden Lounge access, hotels, retail, and dining**: Points redeem for Malaysia Airlines Golden Lounge access, hotel stays through Enrich Hotels, and a catalog of retail, dining, and lifestyle rewards -- generally lower value per point than premium-cabin flights.',

  sweet_spots = '- **Malaysia Airlines A350 Business Suite**: Malaysia''s long-haul business product is well regarded, and redeeming Enrich Points on its own metal (Kuala Lumpur to London, Tokyo, Sydney) is the program''s headline value -- check Enrich award pricing for the route before committing.
- **A gateway to oneworld premium cabins**: Because Enrich redeems across oneworld, points can reach Qatar Qsuite, Cathay, Japan Airlines, and Qantas premium cabins -- useful if you can build a balance, though award pricing and surcharges vary by partner.
- **For US flyers, book the flights -- do not chase the currency**: With no Amex/Chase/Capital One transfer and only on-and-off Citi access, the better play is usually to book Malaysia Airlines metal using AAdvantage miles or Avios (both easy to top up from US cards) rather than accumulating Enrich Points.
- **Reality check**: Enrich is a regionally focused program with limited US on-ramps. It rewards travelers already flying Malaysia Airlines or oneworld in the region, not US-based points collectors looking to fund it from a bank stash.',

  tier_benefits = '[
    {
      "name": "Blue",
      "qualification": "Automatic on joining (base tier); earns 1.5 Enrich Points per RM1 on Malaysia Airlines and Firefly",
      "benefits": [
        "Earn Enrich Points (the spendable currency, valid 3 years) on Malaysia Airlines, Firefly, oneworld, and partners",
        "Earn Elite Points (status, based on distance flown and cabin) on Malaysia Airlines, Firefly, and oneworld member airlines",
        "Redeem across the oneworld network and Enrich lifestyle partners"
      ]
    },
    {
      "name": "Silver",
      "qualification": "35 Elite Points in a year (from 2026 flying, for 2027 qualification); maps to oneworld Ruby. Earns 1.8 Enrich Points per RM1 on Malaysia Airlines and Firefly",
      "benefits": [
        "All Blue benefits",
        "oneworld Ruby recognition",
        "10kg extra baggage allowance and priority baggage handling",
        "Priority check-in and other Ruby-level benefits depending on fare"
      ]
    },
    {
      "name": "Gold",
      "qualification": "70 Elite Points in a year (2026 flying, 2027 qualification); maps to oneworld Sapphire. Earns 2.2 Enrich Points per RM1 on Malaysia Airlines and Firefly",
      "benefits": [
        "All Silver benefits",
        "oneworld Sapphire recognition -- business-class lounge access, priority boarding, and extra baggage across the alliance",
        "Malaysia Airlines Golden Lounge access when flying eligible flights"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "140 Elite Points in a year (2026 flying, 2027 qualification); maps to oneworld Emerald. Earns 2.5 Enrich Points per RM1 on Malaysia Airlines and Firefly",
      "benefits": [
        "All Gold benefits",
        "oneworld Emerald recognition -- first-class lounge access, the highest priority handling, and the most extra baggage across the alliance",
        "Companion card benefits (digitalised via the Malaysia Airlines app)"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Malaysia Airlines operates its own Golden Lounges at its Kuala Lumpur hub and select outstations. Enrich lounge access is delivered through oneworld recognition:

- **Platinum (oneworld Emerald)** receives first-class lounge access across oneworld, plus the highest priority handling.
- **Gold (oneworld Sapphire)** receives business-class lounge access across oneworld and Golden Lounge access on eligible flights.
- **Silver (oneworld Ruby)** does not include general lounge access.

Eligibility follows standard oneworld rules (same-day onward travel on a oneworld carrier). Paid Golden Lounge access may also be available at some locations.',

  quirks = '- **Program refreshed January 1, 2026**: Enrich Points multipliers rose for elite members, and Elite Status thresholds were raised for 2027 qualification (Silver 35, Gold 70, Platinum 140 Elite Points, up from 30/60/100). Guides predating the refresh are stale.
- **Two point types**: Enrich Points are the spendable currency and are valid 3 years from the month earned; Elite Points determine status and are earned by distance flown and cabin class. Elite Points accrue only on Malaysia Airlines, Firefly, and oneworld member airlines -- non-oneworld partner flights do not earn Elite Points.
- **US transfer access is limited**: Marriott Bonvoy transfers into Enrich; Citi ThankYou has been an on-and-off partner (it was dropped in 2022 and sources differ on its current status -- verify at thankyou.com); Amex, Chase, and Capital One do not transfer, and there is no US Enrich co-brand card.
- **The US workaround**: To fly Malaysia Airlines on points, US travelers can usually book its metal through another oneworld program -- AAdvantage miles or Avios -- both of which are easy to fund from US cards. That sidesteps the Enrich access problem entirely.
- **oneworld tier mapping**: Enrich Silver maps to oneworld Ruby, Gold to Sapphire, and Platinum to Emerald -- so Gold and above carry alliance-wide lounge and priority benefits.',

  award_chart = 'Enrich prices award flights using its own redemption structure rather than a single public chart, and pricing varies by route, cabin, and whether you fly Malaysia Airlines or a oneworld partner. Verify the point cost for a specific route at enrich.malaysiaairlines.com before transferring in or committing, as Malaysia Airlines adjusts redemption pricing periodically.

**Highlights:**
- Malaysia Airlines'' own A350 Business Suite (Kuala Lumpur to London, Tokyo, Sydney) is the standout premium redemption.
- oneworld partner awards reach Qatar, Cathay Pacific, Japan Airlines, and Qantas premium cabins, with surcharges and pricing varying by partner.
- Enrich Hotels and lifestyle redemptions are available but return less value per point than premium-cabin flights.

**Earning:** Enrich Points accrue at 1.5 per RM1 (Blue), rising to 1.8 / 2.2 / 2.5 for Silver / Gold / Platinum on Malaysia Airlines and Firefly, plus earning on oneworld and lifestyle partners. Enrich Points are valid 3 years.

**Transfers in:** Marriott Bonvoy transfers to Enrich (standard hotel-to-airline rate). Citi ThankYou has been an on-and-off partner -- verify current status. Amex, Chase, and Capital One do not transfer to Enrich.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'malaysia';
