-- Seed Brilliant by Langham program page at /programs/langham.
-- Renames the legacy "Langham Club 1865" row to "Brilliant by Langham" (relaunched 2024).
-- Sourced from official brilliantbylangham.com pages (scraped via Firecrawl 2026-06-17):
--   - /about-brilliant   (brand list, 30 hotels, program positioning)
--   - /member-benefits   (full tier matrix, Status Point thresholds, elite bonus %, dining %)
--   - /faq               (earn rate 150 Award Pts/US$5, Status Point reset, 24-mo Award expiry, rules)
--   - /points-redemption (dynamic redemption, airline partners)
-- Status Point earn rate (150/US$5) + dollar equivalents corroborated by TPG (108,000 = US$3,600).
-- Airline conversion partners official; conversion ratio is secondary (Business Traveller/PR) and
-- "subject to change" per official terms -- stated approximately with a verify pointer.
-- Check-in/out + welcome-amenity tier mapping partly from Point Hacks/TPG (official matrix did not
-- preserve column checkmarks); room-upgrade (Sapphire/Ruby) + late-checkout 2pm/4pm values are official.

update programs set
  name = 'Brilliant by Langham',
  alliance = 'none',
  hubs = '{}',

  intro = 'Brilliant by Langham is the loyalty and experience platform Langham Hospitality Group launched in 2024, replacing the old 1865 Privilege / Langham Club program. It spans roughly 30 hotels across five brands -- The Langham Hotels & Resorts, Cordis, Eaton Workshop, Ying''nFlo, and Toronto''s Chelsea Hotel -- concentrated in Asia (especially Hong Kong and mainland China) with a handful in the US, UK, and Australia. It is a small, luxury-leaning program, not a globe-spanning chain like Marriott or Hilton.

The program runs on two separate point types: Award Points, which you redeem for stays and dining, and Status Points, which determine your tier (Onyx, Topaz, Diamond, Sapphire, Ruby). You earn both at 150 points per US$5 of qualified spend on rooms and dining. The two things worth knowing for a points-minded traveler: first, there is no published award chart -- Free Night redemptions are dynamically priced, so you cannot know a stay''s point cost until you look it up. Second, the fastest route to elite status is not spending at all but a Mastercard fast-track offer that hands World Elite cardholders top-tier Ruby status outright. Award Points can also be converted to a few Asian airline programs, though at a poor rate best treated as a last resort.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Free Night stays (dynamic pricing, no published chart)**: Redeem Award Points toward room reservations at participating hotels via the Brilliant website, app, or WeChat Mini-Program. Redemption is dynamically priced -- the point cost varies by property, brand, season, and demand, and is not published in advance. There are no blackout dates: any available room type on any night can be booked with points if you have enough.
- **Dining and bars (point-of-sale redemption)**: Award Points can be redeemed on-site at participating restaurants and bars by showing your digital membership card -- useful across Langham''s strong Asian dining portfolio (T''ang Court, Ming Court, and others).
- **Full cash or full points -- no mixing**: A reservation or experience must be paid entirely with cash or entirely with points. Brilliant does not offer cash-and-points combinations.
- **Airline mile conversion (last resort)**: Through the "Have a Brilliant Flight" program, Award Points convert to Cathay Pacific (Asia Miles), Singapore Airlines KrisFlyer, Air China PhoenixMiles, and China Eastern. Published terms indicate roughly 12,500 Award Points to 250 airline miles, with a 25,000-point minimum and a six-to-eight-week processing time (rate varies by airline and is subject to change -- verify at brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions). At 150 points per US$5 spent, that ratio is poor value -- redeem for stays or dining unless you have a specific award flight in mind.',

  sweet_spots = '- **Mastercard fast-track to elite status (the headline play)**: Mastercard runs a complimentary fast-track that grants Brilliant status by card tier with no spend required -- World Elite to Ruby (top tier), World to Sapphire, and Platinum/Titanium to Diamond. Status is valid 12 months and the offer has been extended through December 31, 2027. For a luxury program where Ruby otherwise needs 720,000 Status Points (about US$24,000 of spend), this is by far the best value route to elite benefits. Register at the Mastercard redemption portal, then via brilliantbylangham.com/en/enrolment/statusmatch.
- **Status match from another program**: Brilliant also runs its own status-match enrolment (brilliantbylangham.com/en/enrolment/statusmatch) for members holding status elsewhere -- another no-spend path to mid or upper tiers worth checking before chasing points.
- **Elite bonus points scale steeply at the top**: Elite members earn bonus Award Points on qualified stays -- 10% at Topaz, 15% at Diamond, 25% at Sapphire, and 50% at Ruby. If you can fast-track to Ruby via Mastercard, that 50% bonus meaningfully accelerates Free Night earning on paid stays.
- **Earn on standalone dining, not just stays**: Because you earn 150 points per US$5 at participating restaurants and bars, members who frequent Langham/Cordis dining venues in Hong Kong and mainland China accrue points without ever booking a room -- a genuine edge for locals.
- **Reality check -- dynamic redemption hides value**: With no published award chart, you cannot calculate redemption value in advance, and the program is geographically narrow (heavily Asia). Treat Brilliant as a nice-to-have for Langham loyalists rather than a points-earning engine, and lean on the Mastercard fast-track rather than spending your way up.',

  tier_benefits = '[
    {
      "name": "Onyx",
      "qualification": "No minimum -- evergreen entry tier (free to join)",
      "benefits": [
        "Earn 150 Award Points and 150 Status Points per US$5 of qualified spend on rooms and dining",
        "Brilliant Member Rates on direct bookings",
        "5% dining discount at participating restaurants outside Hong Kong (15% at designated Hong Kong restaurants)"
      ]
    },
    {
      "name": "Topaz",
      "qualification": "12,000 Status Points (about US$400 of qualified spend at 150 Status Points per US$5)",
      "benefits": [
        "All Onyx benefits",
        "10% Elite Bonus Award Points on qualified stays",
        "5% dining discount outside Hong Kong (15% at designated Hong Kong restaurants)"
      ]
    },
    {
      "name": "Diamond",
      "qualification": "108,000 Status Points (about US$3,600 of qualified spend)",
      "benefits": [
        "All Topaz benefits",
        "15% Elite Bonus Award Points on qualified stays",
        "10% dining discount outside Hong Kong (15% at designated Hong Kong restaurants)",
        "Early check-in, subject to availability (Diamond and above, per published tier guides)"
      ]
    },
    {
      "name": "Sapphire",
      "qualification": "360,000 Status Points (about US$12,000 of qualified spend)",
      "benefits": [
        "All Diamond benefits",
        "25% Elite Bonus Award Points on qualified stays",
        "Room upgrade voucher (Sapphire and Ruby exclusive)",
        "Late check-out to 2pm, subject to availability (excludes resort hotels)",
        "Choice of Elite Welcome Amenity each stay (Elite Amenity Points, welcome drink, or dining credit)",
        "Selection of preferred room type, subject to availability",
        "Access to VIP events and member-exclusive experiences"
      ]
    },
    {
      "name": "Ruby",
      "qualification": "720,000 Status Points (about US$24,000 of qualified spend); also reachable via Mastercard World Elite fast-track",
      "benefits": [
        "All Sapphire benefits",
        "50% Elite Bonus Award Points on qualified stays",
        "Room upgrade voucher (Sapphire and Ruby exclusive)",
        "Late check-out to 4pm, subject to availability (excludes resort hotels)",
        "Expanded Elite Welcome Amenity choice, adding a Local Welcome Gift option",
        "Selection of preferred room type, subject to availability",
        "Access to VIP events and member-exclusive experiences"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Brilliant by Langham does not publish a club-lounge access benefit tied to loyalty tier, and the program does not include airport lounge access at any level.

Elite recognition is delivered through room upgrades (Sapphire and Ruby), early check-in (Diamond and above) and late check-out (Sapphire to 2pm, Ruby to 4pm, excluding resort hotels), preferred-room-type selection, and a choice of Elite Welcome Amenity each stay for top tiers (Elite Amenity Points, a welcome drink, a dining credit, and -- for Ruby -- a local welcome gift). Several Langham properties operate their own in-hotel club lounges tied to specific room categories or rates, but that access is a room-product feature booked separately, not a Brilliant tier benefit. Confirm club-lounge availability and the exact tier-by-tier benefit cutoffs on the official benefits page at brilliantbylangham.com/en/member-benefits.',

  quirks = '- **Two separate point currencies**: Award Points (redeemable for stays and dining) and Status Points (tier qualification only) are earned at the same 150-per-US$5 rate but tracked separately. Spending earns both; redeeming spends only Award Points.
- **No published award chart -- dynamic redemption**: Free Night point costs are set dynamically by property, brand, season, and demand, and are not published in advance. You must look up a specific date and hotel to see the cost. Upside: no blackout dates, and any available room type can be booked with points.
- **Award Points expire after 24 months of inactivity**: Award Points lapse if you have no earning activity for 24 consecutive months. Any qualifying earn (stay, dining, partner activity) resets the clock.
- **Status Points reset every membership year**: Status Points zero out at the end of each membership year (and are deducted on tier upgrade) -- they never roll over. Requalify each year, or use the Mastercard fast-track / status match.
- **Mastercard fast-track is the value route to status**: World Elite -> Ruby, World -> Sapphire, Platinum/Titanium -> Diamond, valid 12 months, extended through December 31, 2027. Far cheaper than earning 720,000 Status Points for Ruby. Register at brilliantbylangham.com/en/enrolment/statusmatch.
- **Airline conversion exists but is poor value**: Award Points convert to Cathay Pacific Asia Miles, Singapore KrisFlyer, Air China PhoenixMiles, and China Eastern (roughly 12,500 points to 250 miles per published terms, 25,000-point minimum, 6-8 week processing, rate varies and is subject to change). Given you earn 150 points per US$5, conversion is a last resort -- only with a specific award flight in mind. Verify current ratios at brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions.
- **Points are non-transferable**: Membership and points cannot be transferred or pooled between members; one member per room earns points on a given reservation. You can earn on up to three rooms per reservation if booked under your name at the same hotel.
- **Direct-booking only**: Points are earned solely on stays booked via Brilliant''s website, app, or WeChat Mini-Program -- third-party / OTA bookings do not earn.
- **No co-brand credit card and no inbound bank transfers**: There is no Brilliant by Langham co-brand card, and Amex MR, Chase UR, Bilt, Citi, and Capital One do not transfer in. Points come from Langham stays, dining, and qualified partners.
- **Geographically narrow**: Roughly 30 hotels, heavily concentrated in Hong Kong and mainland China, with only a few in the US (Boston, Chicago, Pasadena), UK (London), and Australia (Melbourne, Gold Coast). Useful mainly if your travel overlaps Langham''s footprint.',

  award_chart = 'Brilliant by Langham does not publish an award chart. Free Night redemptions are dynamically priced -- the Award Point cost of a stay varies by property, brand, season, and demand, and is only visible when you look up a specific hotel and date. There are no blackout dates, and any available room type can be booked with points if your balance covers it. Reservations are paid entirely in cash or entirely in points (no cash-and-points combinations).

**How points are earned:**
- 150 Award Points and 150 Status Points per US$5 of qualified spend on rooms and dining (corporate travel bookers earn 15 Award Points per US$5 of eligible room revenue)
- Elite Bonus Award Points on qualified stays: 10% (Topaz), 15% (Diamond), 25% (Sapphire), 50% (Ruby)
- Earned only on direct bookings (website, app, WeChat Mini-Program) and at participating restaurants/bars; not on third-party bookings

**Status tiers (Status Points, which reset each membership year):**
- Onyx: no minimum
- Topaz: 12,000 (about US$400 of qualified spend)
- Diamond: 108,000 (about US$3,600)
- Sapphire: 360,000 (about US$12,000)
- Ruby: 720,000 (about US$24,000) -- or via Mastercard World Elite fast-track

**Airline conversion ("Have a Brilliant Flight"):**
Award Points convert to Cathay Pacific Asia Miles, Singapore Airlines KrisFlyer, Air China PhoenixMiles, and China Eastern. Published terms indicate roughly 12,500 Award Points to 250 miles, with a 25,000-point minimum and 6-8 week processing. The rate varies by airline and is subject to change -- verify at brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions. At the 150-points-per-US$5 earn rate, this is poor value relative to redeeming for stays.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'langham';
