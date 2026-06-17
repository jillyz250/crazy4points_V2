-- Seed Omni Select Guest program page at /programs/omni.
-- All tier thresholds, earn rates, benefits, and redemption rules sourced directly from
-- official omnihotels.com pages (scraped via Firecrawl 2026-06-17):
--   - /loyalty/member-tiers   (tier thresholds, earn rates, per-tier benefits)
--   - /loyalty/member-benefits (full benefits matrix, revised January 2024)
--   - /loyalty/faq            (Tier Dollar definition, redemption rules, 36-month expiry, 2024 relaunch)
-- Mesa (the only inbound transfer partner, added June 2025) shut down Dec 12, 2025 -- no active
-- transfer partners as of June 2026. No co-brand Omni credit card exists.
-- Revenue-based program: status by annual Tier Dollars; flat 100 Omni Credits = 1 Free Night anywhere.

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'Select Guest is the loyalty program for Omni Hotels & Resorts -- an upscale collection of 50+ properties concentrated in the US, from downtown business hotels to golf-and-spa resorts like Omni Amelia Island, Bedford Springs, PGA National, and Barton Creek. Omni relaunched the program in January 2024 as a fully revenue-based system: your status tier is set by annual Tier Dollars (qualifying spend charged to your room folio), and you earn Omni Credits toward Free Nights for both nights stayed and on-property spend.

The mechanic that makes this program worth understanding is its flat redemption: 100 Omni Credits books a Free Night at any Omni property, regardless of how expensive that hotel''s cash rate is. There is no award chart, no peak pricing, no category system. That means a Free Night at one of Omni''s premium resorts -- where rooms can run several hundred dollars a night -- delivers dramatically more value than burning the same 100 credits at a modest city hotel. Omni also waives Resort Service Charges and Destination Fees on Free Night stays, which sweetens resort redemptions further. The catch: there is no co-brand credit card and no active transfer partner, so credits come almost entirely from staying and spending at Omni.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Free Nights (100 Omni Credits each, flat)**: Redeem 100 Omni Credits for a Free Night at any Omni Hotel or Resort -- every property costs the same regardless of location or room rate. The redemption covers room and taxes, and Omni waives Resort Service Charges and Destination Fees on Free Night stays. Free Nights must be reserved in advance and are subject to availability and blackout dates.
- **Stack multiple Free Nights**: You can redeem more than one Free Night on a single reservation. If you want to combine Free Nights with paid nights on the same trip, Omni requires those to be booked as separate reservations.
- **Suite redemptions (Icon only)**: Icon-status members can apply a suite upgrade when redeeming Free Nights, subject to availability -- effectively a free suite night for top-tier members.
- **No cash, transfer, or merchandise redemptions**: Omni Credits exist for one purpose -- Free Nights. There is no points-for-cash option, no airline transfer, and no merchandise catalog. The value proposition is entirely about free hotel stays.',

  sweet_spots = '- **Redeem at Omni''s premium resorts, not city hotels**: Because every Free Night costs a flat 100 Omni Credits, the single biggest value lever is where you redeem. A Free Night at a high-end resort like Omni Amelia Island, Bedford Springs, PGA National, or Barton Creek -- where cash rates can run several hundred dollars a night -- returns far more value per credit than redeeming at a sub-$200 downtown property. Same credit cost, very different cash value.
- **Resort Service Charge and Destination Fee waiver**: Omni resorts often carry daily resort/destination fees. Those are waived on Free Night redemptions, on top of the room itself being free -- a meaningful extra saving at resort properties that a paid stay would not avoid.
- **Status carries into the following year**: Tier Dollars earned in a calendar year set your status for the rest of that year plus the entire following year. A single big-spend year (a conference block, a wedding, a golf trip) can lock in elevated status well into the next year.
- **Beyond-room spend counts toward both status and credits**: Dining, spa, golf, and retail charged to your room earn Tier Dollars (toward status) and Omni Credits (1 per $100, or 2 per $100 at Icon). At a resort where you''re already golfing and dining on property, this accelerates both tracks meaningfully.
- **Reality check on the revenue-based model**: This is a spend-driven program. With no co-brand card and no active transfer partner, there is no shortcut to credits -- you earn them by staying and spending at Omni. For occasional Omni guests the math is modest; the program rewards travelers who concentrate stays at Omni properties.',

  tier_benefits = '[
    {
      "name": "Member",
      "qualification": "$0 to $999 in annual Tier Dollars (free to join)",
      "benefits": [
        "Earn 5 Omni Credits per qualifying room night",
        "Earn 1 Omni Credit per $100 of qualifying purchases beyond your room",
        "Free Deluxe Wi-Fi",
        "Bottled water on night of arrival",
        "Welcome drink",
        "Access to on-property Loyalty Ambassadors"
      ]
    },
    {
      "name": "Insider",
      "qualification": "$1,000 to $3,999 in annual Tier Dollars (formerly Gold tier)",
      "benefits": [
        "Earn 5 Omni Credits per qualifying room night",
        "Earn 1 Omni Credit per $100 of qualifying purchases beyond your room",
        "Free Deluxe Wi-Fi",
        "Bottled water on night of arrival",
        "Daily complimentary beverage",
        "Two items pressed or two shoeshines per stay, complimentary",
        "Access to on-property Loyalty Ambassadors"
      ]
    },
    {
      "name": "Champion",
      "qualification": "$4,000 to $7,999 in annual Tier Dollars (formerly Platinum tier)",
      "benefits": [
        "Earn 10 Omni Credits per qualifying room night (double the base rate)",
        "Earn 1 Omni Credit per $100 of qualifying purchases beyond your room",
        "Free Deluxe Wi-Fi",
        "Free upgrade by one room-type level (subject to availability)",
        "Early check-in as early as 1pm (subject to availability)",
        "Late check-out as late as 3pm (subject to availability)",
        "Daily bottled water",
        "Daily complimentary beverage, with optional morning delivery to your room",
        "Four items pressed or four shoeshines per stay, complimentary",
        "Locally crafted welcome amenity on arrival",
        "On-site Loyalty Ambassador priority support",
        "Guaranteed room availability with 24 hours prior notice"
      ]
    },
    {
      "name": "Icon",
      "qualification": "$8,000+ in annual Tier Dollars (formerly Black tier)",
      "benefits": [
        "Earn 10 Omni Credits per qualifying room night (double the base rate)",
        "Earn 2 Omni Credits per $100 of qualifying purchases beyond your room",
        "Free Premier Wi-Fi",
        "Free upgrade by two room-type levels (subject to availability)",
        "Early check-in as early as 9am (subject to availability)",
        "Late check-out as late as 6pm (subject to availability)",
        "Suite upgrade when redeeming Free Nights (subject to availability)",
        "Guaranteed room availability up to 4pm on the day of arrival (limit one room per member)",
        "Evening housekeeping service, including turndown",
        "Daily bottled water",
        "Daily complimentary beverage, with optional morning delivery to your room",
        "Unlimited complimentary pressing and shoeshines",
        "Chef-created welcome amenity",
        "Chef-inspired amenity/snack and choice of beverage on night of arrival",
        "On-site Loyalty Ambassador priority support",
        "Ability to gift Champion status to one person"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Select Guest does not include any club lounge or executive lounge access as a program benefit, and Omni Hotels do not operate brand-wide club lounges of the kind found at large chain hotels.

Omni''s elite recognition is delivered through in-room and on-property perks instead -- room upgrades, early check-in / late check-out, complimentary pressing, daily beverages with optional morning room delivery (Champion and Icon), and chef-created welcome amenities (Icon). There is no airport lounge access at any tier, and no co-brand credit card to confer one.',

  quirks = '- **Flat redemption, no award chart**: 100 Omni Credits = 1 Free Night at any property, full stop. No categories, no peak/off-peak pricing, no property-tier surcharges. This is the program''s defining feature and the reason redemption location matters so much.
- **Omni Credits expire 36 months from issue (fixed clock)**: Unlike most hotel programs where activity resets the expiry, Omni Credits have a fixed 36-month lifespan from the date each batch is issued -- activity does not extend already-earned credits. Plan redemptions before the 3-year mark.
- **Status is set by the prior year''s Tier Dollars**: Tier Dollars earned in a calendar year determine your status for the rest of that year plus the entire following year, then reset. There is no published lifetime status.
- **Tier Dollars vs Omni Credits are two separate tracks**: Tier Dollars (qualifying room-folio spend, rounded down to the nearest dollar) drive your status tier. Omni Credits (5 or 10 per night + 1-2 per $100 beyond-room) drive Free Nights. Taxes, gratuities, and fees count toward neither.
- **Beyond-room credits only post in whole $100 increments**: Spend beyond your room is totaled at checkout; $100-$199 earns 1 credit, $200 earns 2, and so on. Partial increments do not earn fractional credits (though every dollar still earns Tier Dollars toward status).
- **Max two rooms earn Free Night awards per stay**: If you book and pay for multiple rooms, Free Night awards accrue on a maximum of two rooms. Free Nights are non-transferable between members.
- **No co-brand credit card; no active transfer partner**: There is no Omni co-brand card. Mesa briefly offered point transfers into Omni (added June 2025) but the Mesa program shut down in December 2025, leaving no active transfer route as of June 2026. Credits come from Omni stays and on-property spend. (Separately, the Amex Platinum Fine Hotels + Resorts / The Hotel Collection program includes some Omni properties when booked through Amex Travel -- an Amex card benefit, not part of Select Guest.)
- **OTA and discounted-rate bookings do not qualify**: Stays booked through online travel agencies (Expedia, Booking.com, Hotels.com, Priceline, etc.), wholesale, airline, or employee/friends-and-family rates do not earn Tier Dollars or Omni Credits. Book direct to earn.
- **A few Omni-managed brands are excluded**: Stays at Villas of Amelia Island Plantation, The Lodge at Bretton Woods, and Townhomes at Bretton Woods do not participate in Select Guest.',

  award_chart = 'Omni Select Guest does not use a traditional award chart. Free Nights are a single flat price:

**Free Night redemption:**
- 100 Omni Credits = 1 Free Night at any Omni Hotel or Resort (every property, same cost)
- Covers room rate and taxes
- Resort Service Charges and Destination Fees are waived on Free Night stays
- Must be reserved in advance; subject to availability and blackout dates
- Multiple Free Nights can be combined on one reservation; Free Nights and paid nights on the same trip require separate reservations
- Icon members can add a suite upgrade when redeeming a Free Night (subject to availability)

**How Omni Credits are earned:**
- Nights stayed: 5 Omni Credits per qualifying night (Member, Insider); 10 per night (Champion, Icon)
- Beyond-room spend: 1 Omni Credit per $100 charged to your room (Member, Insider, Champion); 2 per $100 (Icon). Room rate, taxes, fees, and gratuities are excluded; credits post in whole $100 increments.

**Status (separate from credits) -- annual Tier Dollars:**
- Member: $0-$999
- Insider: $1,000-$3,999
- Champion: $4,000-$7,999
- Icon: $8,000+
Tier Dollars = qualifying charges on the room folio (room rate, resort/destination service charges, food and beverage, retail, spa, golf, activities). Taxes, gratuities, and fees do not count. Status earned in a calendar year is valid for the remainder of that year plus the following year.

**Legacy conversion (January 2024 relaunch):** Old Award Credits converted at 1 Award Credit = 5 Omni Credits. The previous 20-Award-Credit Free Night became 100 Omni Credits, preserving redemption value. Former Gold, Platinum, and Black tiers became Insider, Champion, and Icon respectively.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'omni';
