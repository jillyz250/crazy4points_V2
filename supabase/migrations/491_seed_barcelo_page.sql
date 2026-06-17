-- Seed myBarcelo Benefits page at /programs/barcelo
--
-- Key editorial decision: myBarcelo is a DISCOUNT + AMENITIES program, not a points program.
-- There is no Barcelo points currency to earn or redeem for award nights.
-- The program delivers value via tiered percentage discounts (5%/10%) and in-stay perks.
-- Airline partners (LifeMiles, Copa ConnectMiles) earn miles on stays -- not hotel->airline
-- point transfers. Both transfer_partners and transfer_partners_outbound are empty arrays.
--
-- T&C URL corrected: /mybarcelo/terms-conditions/ -> /mybarcelo/general-conditions/ (old URL 404s)
-- Program name corrected: "Barcelo My Barcelo" -> "myBarcelo Benefits"
--
-- Sources: barcelo.com/en-us/mybarcelo/ (tiers + FAQ), barcelo.com/en-us/bhg/partners/ (airlines),
--          lifemiles.com/partners/hotel/BARGL (LifeMiles T&C), scraped 2026-06-17.

update programs set
  name                    = 'myBarcelo Benefits',
  alliance                = 'none',
  hubs                    = '{}',
  partner_chart_url       = 'https://www.barcelo.com/en-us/mybarcelo/',

  intro = 'myBarcelo Benefits is the loyalty program for Barcelo Hotel Group -- and it works nothing like the points-and-miles programs you are used to. No points to earn, no award chart to decode, and no minimum redemption threshold to stress over. Instead, booking direct through barcelo.com (or the Call Center) unlocks a tiered discount starting at 5% -- plus a progressive menu of in-stay perks as you accumulate stays and spending.

The flip side: with around 180 hotels across four brands (Barcelo Hotels and Resorts, Royal Hideaway Luxury Hotels, Occidental, and Allegro all-inclusives), this is a program that rewards loyalty to a single mid-size Spanish group, not a global network. If Barcelo''s Europe-and-Caribbean footprint aligns with where you already travel -- particularly for all-inclusive stays in the Dominican Republic, Mexico, or Aruba -- the Unique tier''s 10% room discount, 20% off experiences, late checkout, room upgrade, and complimentary minibar can add real value. For occasional visitors, Essential is painless to join and still beats OTA pricing on most rate categories.',

  how_to_spend = 'myBarcelo has no redeemable points currency -- the program''s "reward" IS your status tier and the discounts it unlocks. Benefits activate automatically when you book through official channels.

- **Member rate (all tiers):** Essential members access member-only pricing that typically undercuts OTA rates. The Best Price Guarantee means barcelo.com is always the right starting point.
- **Tier booking discounts:** Essential = 5% off best rate; Special and Unique = 10% off best rate.
- **Tier service discounts:** Essential = 5% off hotel services; Special = 10% off hotel services; Unique = 20% off hotel experiences, spa, dining, and excursions.
- **Unique amenity stack:** Room upgrade at check-in, early check-in from 10am, late checkout until 4pm, complimentary welcome minibar (non-alcoholic), complimentary daily bottled water, gift upon arrival, and preferential room assignment.
- **Airline miles as a side benefit:** Declare your LifeMiles (Avianca) membership at checkout to earn 1 LifeMile per USD 1 spent on applicable charges. Copa Airlines ConnectMiles members can also earn miles on stays -- check barcelo.com/en-us/bhg/partners/ for current rates.',

  award_chart = '**myBarcelo Benefits is a discount and amenities program, not a traditional hotel points program.** There is no points currency to accumulate, no award night chart, and no redemption minimum.

Value is delivered through tiered discounts applied to the member rate at barcelo.com:

| Tier | Booking discount | Services and experiences |
|---|---|---|
| Essential | 5% | 5% |
| Special | 10% | 10% |
| Unique | 10% | 20% |

The practical "redemption value" is whatever you save versus an OTA price -- typically 5-15% depending on tier and rate type, before stacking with advance-purchase sales. For a EUR 300/night Royal Hideaway stay, Unique tier saves EUR 30/night on the room alone, plus 20% off spa treatments and excursions.',

  sweet_spots = '- **Royal Hideaway for the full Unique amenity stack.** Royal Hideaway Luxury Hotels and Resorts -- Barcelo''s five-star collection -- is where Unique-tier perks land hardest. A room upgrade, 4pm late checkout, 20% off spa, and 10am early check-in turns a long weekend at a Royal Hideaway into a soft-splurge play at real savings. Strong representation in the Canary Islands, Spain, and Mexico.

- **10% + sale price stacking at Caribbean all-inclusives.** Barcelo''s Occidental and Allegro resorts in the Dominican Republic and Mexico frequently run advance-purchase sales of 15-30% off. Stack your Unique or Special 10% member discount on top -- confirm both apply before booking, as some promotional rates exclude member discount stacking.

- **LifeMiles double-dip on Barcelo stays.** Declare your LifeMiles membership at checkout and earn 1 LifeMile per USD 1 spent on applicable charges. It will not offset the stay cost, but it adds a steady drip toward short-haul Avianca redemptions and Star Alliance partner awards. Declare at checkout -- retroactive credit is not guaranteed.

- **Fast Special qualification on a multi-stop Spanish trip.** Special status requires just 2 qualifying stays and EUR 1,000 in cumulative spend within 24 months. A single Spain/Portugal itinerary with two Barcelo hotel nights -- Barcelona + Malaga, for example -- can achieve both in one trip if the combined spend clears the threshold. That unlocks 10% discounts from your very next stay.',

  tier_benefits = '[
    {
      "name": "Essential",
      "qualification": "Automatic on joining myBarcelo Benefits (free to register at barcelo.com).",
      "benefits": [
        "5% discount on bookings at barcelo.com or via Call Center",
        "Best price guarantee on official channels",
        "Access to advance member offers and promotions",
        "Special requests honored with 48-hour advance notice",
        "Online check-in access",
        "Preferential check-in and check-out treatment",
        "5% discount on hotel services and on-property purchases"
      ]
    },
    {
      "name": "Special",
      "qualification": "Minimum 2 qualifying stays AND cumulative spend of EUR 1,000 within a rolling 24-month window. Qualifying stays require booking through barcelo.com or Barcelo Call Center -- OTA bookings do not count. Two consecutive reservations at the same property on consecutive dates are counted as one stay.",
      "benefits": [
        "10% discount on bookings at barcelo.com or via Call Center",
        "10% discount on hotel services and on-property purchases",
        "Booking flexibility (enhanced change and cancellation terms)",
        "All Essential benefits"
      ]
    },
    {
      "name": "Unique",
      "qualification": "Minimum 4 qualifying stays AND cumulative spend of EUR 3,000 within a rolling 24-month window. Same direct-booking and stay-counting rules as Special apply.",
      "benefits": [
        "10% discount on bookings at barcelo.com or via Call Center",
        "20% discount on hotel experiences and services (spa, dining, excursions)",
        "Preferential room assignment at check-in",
        "Room upgrade at check-in (subject to availability)",
        "Early check-in from 10am (subject to availability)",
        "Late checkout until 4pm (subject to availability)",
        "Complimentary welcome minibar (non-alcoholic)",
        "Complimentary bottled water daily",
        "Gift upon arrival (varies by property)"
      ]
    }
  ]'::jsonb,

  lounge_access = 'myBarcelo Benefits includes no airport lounge access at any tier.

On-property, Unique-tier members receive room upgrades and preferential room assignments -- some Royal Hideaway Luxury Hotels feature exclusive guest areas and facilities that Unique members may access as part of their room allocation. No formal lounge benefit is published in the program terms.',

  transfer_partners          = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  quirks = '- **Book direct or forgo your benefits.** Only bookings made through barcelo.com or the Barcelo Call Center qualify for member discounts, tier credit, and in-stay amenities. OTA bookings (Expedia, Booking.com, Hotels.com, etc.) receive no membership benefits and do not count toward tier qualification.
- **Consecutive same-property stays count as one.** Two consecutive reservations at the same hotel on back-to-back check-in/check-out dates are treated as a single stay for tier qualification purposes. Spread stays across properties or add a gap night to earn two separate qualifying-stay credits.
- **Cuba is excluded.** Barcelo Hotel Group operates properties in Cuba, but myBarcelo Benefits does not apply -- no member discounts, no tier credit, no in-stay amenities at Cuban hotels.
- **Earn airline miles on stays (not hotel points).** myBarcelo has no redeemable points currency. Declare your LifeMiles membership (Avianca / Star Alliance) at checkout to earn 1 LifeMile per USD 1 spent on applicable charges. Copa Airlines ConnectMiles members can also earn on Barcelo stays; visit barcelo.com/en-us/bhg/partners/ for current partner terms.
- **Spend thresholds are in euros.** The EUR 1,000 (Special) and EUR 3,000 (Unique) cumulative spend thresholds are denominated in euros. Stays charged in other currencies are converted using the rate applicable at time of charge.
- **24-month rolling window (no annual reset).** Tier qualification looks at your last 24 months of activity continuously -- there is no January 1 reset. If your qualifying stay count drops below the threshold, your tier reverts at the next review cycle.
- **Barcelo Pro Rewards is a separate program.** Barcelo also operates Barcelo Pro Rewards, a points-earning scheme for travel agents and trade partners. It is not the same as myBarcelo Benefits and cannot be combined with it.',

  scrape_urls = '{
    "tiers": "https://www.barcelo.com/en-us/mybarcelo/",
    "outbound_transfers": "https://www.barcelo.com/en-us/bhg/partners/",
    "tc": "https://www.barcelo.com/en-us/mybarcelo/general-conditions/",
    "news": "https://www.barcelo.com/en-us/bhg/press-room/"
  }'::jsonb,

  is_active          = true,
  content_updated_at = now(),
  last_verified      = current_date,
  updated_at         = now()
where slug = 'barcelo';
