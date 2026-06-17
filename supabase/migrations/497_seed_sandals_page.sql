-- Seed Island Insiders Club (Sandals / Beaches) page at /programs/sandals
--
-- The program was formerly "Sandals Select Rewards" and rebrands to "Island Insiders Club"
-- effective July 1, 2026 (announced June 15, 2026). Existing status, points, and nights
-- carry over with no reset. Tier "Select" renamed to "Shell" only.
--
-- All tier thresholds, earn rates, bonus points, and discount %s sourced directly from
-- the official benefit table at sandals.com/about/rewards-program/ (scraped 2026-06-17).
-- Benefit checkmarks that did not render in scrape are excluded; only text-confirmed
-- per-tier assignments are stated. Per-tier items where only a checkmark would indicate
-- eligibility are noted as "see program terms" rather than guessed.
--
-- Co-brand: Bank of America Sandals Visa Signature (4x at Sandals/Beaches, 2x restaurants/
-- grocery, 1x elsewhere; no annual fee; no FX fee). Earns directly into Island Insiders Club.
-- BofA card is NOT a transferable-currency card -- no major issuer transfers to this program.
--
-- Source: sandals.com/about/rewards-program/ (official scrape 2026-06-17)

update programs set
  name             = 'Island Insiders Club',
  alliance         = 'none',
  hubs             = '{}',
  partner_chart_url = 'https://www.sandals.com/about/rewards-program/',

  intro = 'Island Insiders Club -- formerly Sandals Select Rewards, rebranded July 1, 2026 -- is the loyalty program for Sandals and Beaches Resorts, two all-inclusive Caribbean brands that together cover 16 properties across Jamaica, St. Lucia, Antigua, the Bahamas, Grenada, Barbados, and Turks and Caicos. Sandals is adults-only (couples); Beaches is family-friendly. Your status and points work across both.

The program is a classic nights-and-spend loyalty structure: earn points on every stay, move through seven tiers (Shell, Coral, Sapphire, Emerald, Diamond, Pearl, Ambassador), and collect milestone perks including a complimentary week after every 70 paid nights. No major credit card currency transfers in -- the only points on-ramp is staying at properties or using the Bank of America co-brand Visa. That makes this a "commit to the brand" program: meaningful if Sandals or Beaches is a regular destination, thin if you visit once every few years.',

  how_to_spend = '- **Points toward stays:** Points earned in Island Insiders Club can be applied toward future Sandals and Beaches bookings. Point value established from the referral program: 10,000 points = USD 250 toward stays (2.5 cents per point). Check sandals.com/about/rewards-program/faqs/ for current redemption mechanics and any per-stay redemption cap.
- **Spa and excursion credits:** Each stay includes a Choice of Insider Reward -- a credit redeemable for Red Lane Spa services or an Island Routes excursion (not combinable with other credits; excludes certain tour types). Claimed via the Sandals and Beaches app 30 days before arrival.
- **Free Week Award at 70 nights:** After every 70 paid nights, members receive a certificate for a complimentary 7-night stay for two at any participating Sandals or Beaches resort. Room category is based on the average of the 70 paid nights -- more nights in premium rooms means a higher-value free week.
- **On-resort discounts:** Coral tier and above receive 10-20% off at resort gift shops, watersports, EPIX photo shop, and specialty Candlelight Dinners (not on room rates).
- **Future Memories Discount:** Book your next stay at the Island Insiders Lounge on-resort for up to 12% off.',

  award_chart = 'Island Insiders Club uses a points-earn-and-redeem model anchored to nights stayed and money spent at Sandals and Beaches properties. There is no published award chart with fixed point costs for specific room categories -- points reduce the cash cost of a booking at a rate of approximately 2.5 cents per point (10,000 points = USD 250 confirmed from the referral program).

The most concrete milestone redemption is the **Free Week Award**: after every 70 paid nights, a 7-night stay certificate is issued. The room category granted is the average of the member''s prior 70 paid nights -- a meaningful incentive to book premium rooms consistently.

No major credit card program (Amex MR, Chase UR, Citi ThankYou, Bilt, Capital One, Wells Fargo) transfers points to Island Insiders Club. The Bank of America Sandals and Beaches Visa Signature (no annual fee; no FX fee) earns directly into the account: 4x at Sandals and Beaches properties, 2x at restaurants and grocery stores, 1x everywhere else.',

  tier_benefits = '[
    {
      "name": "Shell",
      "qualification": "Automatic after completing your 1st stay at any Sandals or Beaches resort (booking through official channels required).",
      "benefits": [
        "Earn 1 point per USD 1 spent on resort stays",
        "5,000 bonus points after the first stay (welcome bonus; applies at this tier only)",
        "Access to Exclusive Merchandise via the Insiders Shop (members-only online store)",
        "Room Upgrade Hotline access: request upgrades 30 days before arrival at up to 50% off",
        "Choice of Insider Reward per stay: Red Lane Spa credit OR Island Routes excursion credit (claim via app 30 days before arrival)",
        "Complimentary 5x7 photo print or digital image from Photo Shop (per stay)",
        "Invitation to Exclusive Insider Events",
        "Free Week Award certificate after every 70 paid nights (room category based on average of prior 70 nights)"
      ]
    },
    {
      "name": "Coral",
      "qualification": "After completing your 2nd qualifying stay at any Sandals or Beaches resort.",
      "benefits": [
        "Earn 1 point per USD 1 spent on resort stays",
        "250 bonus points after each stay",
        "10% on-resort Insider Discount at gift shops, watersports, EPIX, and Candlelight Dinners",
        "20% off the Manager''s Wine List",
        "All Shell benefits"
      ]
    },
    {
      "name": "Sapphire",
      "qualification": "25 paid nights OR USD 25,000 cumulative spend at Sandals and Beaches resorts.",
      "benefits": [
        "Earn 2 points per USD 1 spent on resort stays",
        "375 bonus points after each stay",
        "10% on-resort Insider Discount",
        "20% off the Manager''s Wine List",
        "All Coral benefits"
      ]
    },
    {
      "name": "Emerald",
      "qualification": "45 paid nights OR USD 40,000 cumulative spend at Sandals and Beaches resorts.",
      "benefits": [
        "Earn 2 points per USD 1 spent on resort stays",
        "500 bonus points after each stay",
        "15% on-resort Insider Discount",
        "20% off the Manager''s Wine List",
        "All Sapphire benefits"
      ]
    },
    {
      "name": "Diamond",
      "qualification": "100 paid nights OR USD 90,000 cumulative spend at Sandals and Beaches resorts.",
      "benefits": [
        "Earn 3 points per USD 1 spent on resort stays",
        "750 bonus points after each stay",
        "15% on-resort Insider Discount",
        "20% off the Manager''s Wine List",
        "VIP Concierge Service Line: dedicated one-stop service for vacation planning, butler preferences, and priority account support",
        "All Emerald benefits"
      ]
    },
    {
      "name": "Pearl",
      "qualification": "250 paid nights OR USD 220,000 cumulative spend at Sandals and Beaches resorts.",
      "benefits": [
        "Earn 4 points per USD 1 spent on resort stays",
        "1,000 bonus points after each stay",
        "20% on-resort Insider Discount",
        "20% off the Manager''s Wine List",
        "VIP Concierge Service Line",
        "All Diamond benefits"
      ]
    },
    {
      "name": "Ambassador",
      "qualification": "400 paid nights OR USD 345,000 cumulative spend at Sandals and Beaches resorts.",
      "benefits": [
        "Earn 4 points per USD 1 spent on resort stays",
        "2,000 bonus points after each stay",
        "20% on-resort Insider Discount",
        "20% off the Manager''s Wine List",
        "USD 200 Laundry Service Credit per stay (split stays at the same resort count as one continuous stay)",
        "Annual Thank You Gift",
        "VIP Concierge Service Line",
        "All Pearl benefits"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Island Insiders Club includes no airport lounge access at any tier.

On-resort, members at Sapphire tier and above may have access to a weekly VIP Insiders Event during their stay. Some resorts also feature an Island Insiders Lounge where members can book their next stay at up to 12% off (the Future Memories Discount). Specific lounge facilities vary by resort -- confirm with the property before arrival.',

  transfer_partners          = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  quirks = '- **No major credit card currencies transfer in.** Amex MR, Chase UR, Citi ThankYou, Bilt, Capital One, and Wells Fargo Rewards do not transfer to Island Insiders Club. The only outside on-ramp is the Bank of America Sandals and Beaches Visa Signature card (no annual fee, no FX fee), which earns 4x at Sandals and Beaches properties, 2x at restaurants and grocery, and 1x everywhere else directly into the program.
- **Points value: roughly 2.5 cents each.** The referral program confirms 10,000 points = USD 250 toward stays. This makes the BofA card''s 4x on-property earn worth approximately 10 cents per dollar spent at the resort -- a solid on-property rate.
- **Free Week room category averages your prior 70 nights.** Splurge on butler suites for 70 nights and your free week can be a butler suite. Stay in entry rooms for 70 nights and the certificate reflects that. The milestone rewards loyalty to premium rooms, not just paid nights.
- **Shell tier is your very first stay.** You graduate from Shell to Coral the moment you complete your second stay. The 5,000-point bonus (worth USD 125) is effectively a welcome bonus since you can only be at Shell for one stay.
- **Qualify by nights OR spend -- whichever comes first.** From Sapphire onward, both a nights threshold and a spend threshold are listed (e.g. 25 nights OR USD 25,000). High-spend trips to premium suites can outpace the spend threshold before the nights threshold.
- **Rebranded July 1, 2026 from Sandals Select Rewards.** The program name and entry-tier name (Select -> Shell) changed; all existing points, status, and paid nights carry over with no reset. The URL, the tiers, and benefit structures are the same program.
- **Beaches resorts count toward the same account.** Beaches Resorts (family-friendly) and Sandals Resorts (adults-only couples) share the same Island Insiders Club account and lifetime night totals.
- **Only direct bookings count toward tier.** Book through sandals.com, beaches.com, or the Call Center. OTA bookings (Expedia, Booking.com, etc.) do not earn points or count toward paid nights.',

  scrape_urls = '{
    "tiers": "https://www.sandals.com/about/rewards-program/",
    "announcement": "https://www.sandals.com/blog/island-insiders-club-loyalty-program/",
    "news": "https://news.sandals.com/article/1870/",
    "tc": "https://www.sandals.com/my-account/terms"
  }'::jsonb,

  is_active          = true,
  content_updated_at = now(),
  last_verified      = current_date,
  updated_at         = now()
where slug = 'sandals';
