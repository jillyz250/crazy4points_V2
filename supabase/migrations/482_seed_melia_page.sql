-- Seed and activate the Melia Rewards hotel program page.
-- Authored 2026-06-17. ASCII-only in all text strings.
--
-- PROGRAM SHAPE:
--   Melia Hotels International = Spanish hotel group founded Palma de Mallorca 1956.
--   7 brands: Gran Melia (ultra-luxury), Melia Hotels & Resorts, ME by Melia (lifestyle),
--   The Melia Collection (boutique), Paradisus by Melia (all-inclusive Caribbean/Mexico),
--   Innside by Melia (urban lifestyle), Sol by Melia (budget beach), Affiliated by Melia.
--   350+ properties in 40+ countries.
--
--   Currency: Melia Rewards points. Earn 10-14 pts per euro/dollar of eligible spend.
--   NO US credit card currencies transfer in (no Amex, Chase, Citi, CapOne, Bilt, WF).
--   Outbound transfers to Avios-family airlines, Air Europa SUMA, Copa ConnectMiles.
--
--   Tiers (13-month rolling window):
--     White:    automatic on join
--     Silver:   2 stays OR 5 nights OR 10,000 hotel pts
--     Gold:     15 stays OR 30 nights OR 60,000 hotel pts
--     Platinum: 30 stays OR 50 nights OR 150,000 hotel pts
--
--   Award pricing is dynamic (no published chart). Blog-sourced ranges hedged in award_chart.
--
-- SOURCES (official, T&C scraped 2026-06-17):
--   melia.com/en/meliarewards (program overview)
--   melia.com/en/meliarewards/terms-conditions (Dec 2025 update -- tier thresholds,
--     earn rates, expiry, lounge access, VIP area access, breakfast benefit conditions)
--   aireuropa.com/us/en/aea/suma/our-program/our-partners/hotels/melia.html (Air Europa ratio)
--   vueling.com/en/vueling-club/partners/melia-hotels-international (Vueling ratio)
--   iberiaclubmagazine.iberia.com/en/collect-more-avios/hotels/melia-hotels-international (Iberia)
-- MEDIUM confidence: Avios ratios from multiple third-party sources (100:30 = 3.33:1),
--   award point ranges from Milesopedia / Upgraded Points / Turning Left for Less (not official).

update programs set
  name = 'Melia Rewards',
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.melia.com/en/meliarewards',
  intro = 'Melia Hotels International is a Spanish hotel company founded in Palma de Mallorca in 1956, with more than 350 properties across seven brands - from Sol by Melia (budget beach resorts in the Canaries and Balearics) to Paradisus by Melia (luxury all-inclusive in the Caribbean and Mexico) to Gran Melia (ultra-luxury). Melia Rewards is the program: earn 10 to 14 points per euro or dollar of eligible hotel spend depending on your tier, and redeem for award nights across the full portfolio. No US credit card currency transfers directly into Melia Rewards - these points are earned the old-fashioned way, by staying. The upside: if you are heading to Spain, the Balearic Islands, or a Paradisus property in Mexico or the Dominican Republic, Melia Hotels often occupy the best positions in those markets, and the points stack fast enough to matter. The outbound transfer story exists too - Melia Rewards points convert to Iberia, British Airways, Vueling, and Aer Lingus Avios (at unfavorable 100:30 ratios), Air Europa SUMA miles (3:1), and Copa ConnectMiles (6:1) - useful only as a top-up for a specific upcoming award booking.',
  how_to_spend = '- **Book award stays through melia.com or the Melia app.** Points cannot be redeemed at the hotel reception - all bookings must be made through a Melia own channel (melia.com, the Melia Group app, or the contact centre). OTA bookings are excluded.
- **Points only or points-plus-cash.** Award stays can be fully covered in points or split between points and a cash payment. You continue to earn points on the cash portion of a mixed redemption.
- **Earn and redeem at hotel restaurants and spas.** Dining, spa, and other extras at Participating Hotels generate points at rates set by each property during their own promotions - earn rates are not uniform across all hotels.
- **Transfer to airlines - only if you have a booking lined up.** Melia Rewards converts to Iberia Club, British Airways Executive Club, Vueling Club, and Aer Lingus AerClub at 100 Melia = 30 Avios; Air Europa SUMA at 3 Melia = 1 SUMA mile; Copa ConnectMiles at 6 Melia = 1 ConnectMile. Transfer ratios are unfavorable compared to using points for hotel stays directly. Only transfer to fill a gap for a specific upcoming award booking - not as a default strategy.
- **Transfer points to other MeliáRewards members.** Points can be shared between member accounts. Maximum 250,000 points per calendar year. Transferred points do not count toward tier qualification.',
  sweet_spots = '- **Paradisus all-inclusive in the Caribbean and Mexico.** Paradisus by Melia runs full-board resorts in the Dominican Republic (Punta Cana, Samana) and Mexico (Cancun, Los Cabos, Riviera Maya) where published rates regularly run USD 400-600+ per night. Award redemptions at blog-reported ranges of 50,000-80,000 pts/night at those rates can put you near 1 cent per point - among the strongest in the program. All-inclusive framing means the award is covering food and beverages too, not just the room.
- **Sol by Melia for off-peak Mediterranean travel.** Sol by Melia and Innside properties in the Canary Islands, Majorca, and mainland Spain can price at 5,000-15,000 pts/night during shoulder season. If Spain is on your calendar and you can be flexible on dates, these are the lowest-cost redemptions in the portfolio and genuinely useful.
- **Silver status in 2 stays.** The Silver tier requires just 2 qualifying stays or 5 nights within a 13-month window. A single long weekend trip can push you there, unlocking companion breakfast on room-only stays, priority communications, and the 11 pts/euro earn rate. Achievable on any Spain or Caribbean trip.
- **Time your stays around a Paradisus reload.** The 12-month inactivity expiry is strict - any earn or redeem transaction resets the clock. Plan a small Melia stay or redemption (even a Sol property) every 11 months to protect a Paradisus balance you are building toward.',
  tier_benefits = '[
    {"name":"White","qualification":"Automatic on joining. No stay or spend required.","benefits":["Earn 10 points per euro or dollar of eligible hotel spend (pre-tax)","Exclusive discounts on stays booked through Melia direct channels","Complimentary Wi-Fi","Birthday surprise from the programme"]},
    {"name":"Silver","qualification":"2 qualifying stays OR 5 qualifying nights OR 10,000 hotel points within 13 months of achieving Silver.","benefits":["Earn 11 points per euro or dollar","Free breakfast for one accompanying guest on room-only rate reservations (not available at all-inclusive hotels or hotels without a Melia-managed restaurant)","Exclusive discounts, Wi-Fi, birthday surprise"]},
    {"name":"Gold","qualification":"15 qualifying stays OR 30 qualifying nights OR 60,000 hotel points within 13 months of achieving Gold.","benefits":["Earn 13 points per euro or dollar","Free breakfast for one accompanying guest (room-only stays, same conditions as Silver)","Late checkout: 2:00 pm at resort hotels / 4:00 pm at urban hotels (subject to availability; also applies to a second room occupied by minor children or dependants)","Priority access upon arrival","3 x 20% discount vouchers on future stays (valid while Gold or Platinum; not combinable with other promotions; not usable on points-only bookings)"]},
    {"name":"Platinum","qualification":"30 qualifying stays OR 50 qualifying nights OR 150,000 hotel points within 13 months of achieving Platinum. Platinum for Life available for members who held Platinum for 10 consecutive qualifying periods from January 2013 and completed 500 qualifying nights during that period.","benefits":["Earn 14 points per euro or dollar","Free breakfast for one accompanying guest (room-only stays)","Late checkout (resort 2:00 pm / urban 4:00 pm, subject to availability)","Priority access upon arrival","3 x 20% discount vouchers on future stays","One-category room upgrade at check-in (subject to availability; excludes some room types such as presidential suites; must request at check-in)","Access to VIP areas (Club Floors / Regency Clubs) at Melia Hotels & Resorts, Gran Melia, and Paradisus by Melia properties (does not include breakfast unless booked; priority given to guests who paid for VIP access)","2 complimentary airport lounge visits per year at 1,200-plus airports globally (specific network details in logged-in area at melia.com/meliarewards)"]}
  ]'::jsonb,
  lounge_access = 'Melia Rewards does not include airport lounge access for White, Silver, or Gold tiers. Platinum members receive 2 complimentary airport lounge visits per year, valid at more than 1,200 airports globally. The specific lounge network (LoungeKey, DragonPass, or equivalent) is detailed in the logged-in area at melia.com/meliarewards - access terms may vary. Two visits per year is a very limited benefit, useful for an occasional international connection but not a substitute for a dedicated lounge card or airline lounge membership.

Within hotels: Platinum members have access to VIP lounge areas (Club Floors or Regency Clubs) at Melia Hotels & Resorts, Gran Melia, and Paradisus by Melia properties. This access does not automatically include breakfast unless breakfast is included in the reservation rate. Priority for VIP lounge access is given to guests who have purchased that access directly.',
  quirks = '- **Points expire after 12 months of inactivity.** Any qualifying earn or redeem transaction - a hotel stay, a redemption, a point transfer, or a points purchase - resets the 12-month clock. Stricter than Hyatt (24 months) or Marriott (no hard expiry with ongoing card activity). If you have a large balance and stay infrequently, set a 10-month reminder to trigger a small earn or redemption to keep points alive.
- **No US credit card currency transfers in.** No Amex Membership Rewards, Chase Ultimate Rewards, Citi ThankYou, Bilt Rewards, Capital One miles, or Wells Fargo Autograph Journey transfers to Melia Rewards. Points accumulation is entirely stay-based.
- **OTA and group bookings earn nothing.** Reservations through Expedia, Booking.com, Hotels.com, tour operators, or group/crew rates do not generate points or tier credit. Book direct at melia.com or through the app.
- **Silver companion breakfast is room-only and restaurant-dependent.** The free breakfast for an accompanying guest (Silver and above) applies only to room-only rate reservations where breakfast is added at a standard daily rate. It is not available at all-inclusive properties, at hotels without a Melia-managed restaurant, or when breakfast is already included in the rate.
- **Platinum VIP area access excludes breakfast by default.** Access to Club Floors and Regency Clubs at qualifying Melia brands (for Platinum) does not include the hotel breakfast service unless the reservation rate already includes it. Priority access is given to guests who paid for the VIP floor directly.
- **Award point ranges are dynamic - no published chart.** Melia does not publish a static points-per-night chart. The figures cited on this page (50,000-80,000 pts for Paradisus, etc.) are third-party estimates from travel blogs and may not reflect current pricing. Always search melia.com with your specific dates to see the actual award cost before planning around a specific point range.
- **Transfer limits and restrictions.** Maximum 250,000 Melia Rewards points can be transferred to airline programs per calendar year (January to December). Minimum 2,000 points per transfer. Promotional points cannot be transferred to any airline programme.
- **Platinum for Life is effectively closed to new earners.** The qualification requires 10 consecutive 12-month qualifying periods starting from January 2013, plus 500 qualifying nights. This was only achievable for members who consistently held Platinum beginning in 2013 - anyone starting after that point has missed the window.
- **Circle by Melia is a separate paid subscription.** Circle by Melia is a paid membership club (not a MeliáRewards tier) that grants automatic Silver status in Melia Rewards and access to some hotels outside the Melia portfolio. It operates independently of the standard tier structure.',
  award_chart = 'Melia Rewards does not publish a static award chart. Award stays use dynamic pricing - the points required for a given night vary by property, date, and availability. The figures below are third-party blog estimates from 2025-2026 sources and are not official Melia figures. Always search melia.com with your specific travel dates to see the actual award cost.

Approximate award cost ranges by brand (third-party estimates, not official):
- Sol by Melia (budget beach/resort): approximately 5,000-15,000 points per night
- Innside by Melia / Affiliated by Melia (urban lifestyle): approximately 15,000-30,000 points per night
- Melia Hotels & Resorts (urban and resort): approximately 20,000-40,000 points per night
- ME by Melia (lifestyle, major cities): approximately 30,000-50,000 points per night
- Paradisus by Melia (all-inclusive, Caribbean/Mexico): approximately 50,000-80,000 points per night
- Gran Melia / The Melia Collection (ultra-luxury): approximately 80,000-150,000 points per night

Earn rates per euro or dollar of eligible stay spend (pre-tax):
- White: 10 points
- Silver: 11 points
- Gold: 13 points
- Platinum: 14 points

Points expiry: 12 months of inactivity (no earn or redeem). Any qualifying transaction resets the clock. Discretionary points from the programme owner are valid 24 months from award date.',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[
    {"from_slug": "iberia", "ratio": "100:30", "notes": "100 Melia Rewards points = 30 Iberia Club Avios. All four Avios-family carriers (Iberia, British Airways, Vueling, Aer Lingus) transfer at the same 100:30 ratio. You can set up automatic conversion in your Melia Rewards profile. No transfer tax. Minimum 2,000 Melia points per transfer (= 600 Avios). Max 250,000 Melia points per calendar year to airline partners. Promotional points ineligible.", "bonus_active": false},
    {"from_slug": "british-airways", "ratio": "100:30", "notes": "100 Melia Rewards points = 30 British Airways Executive Club Avios. Same 100:30 ratio as other Avios-family programs. No transfer tax.", "bonus_active": false},
    {"from_slug": "vueling", "ratio": "100:30", "notes": "100 Melia Rewards points = 30 Vueling Club Avios. Same 100:30 ratio as other Avios-family programs. No transfer tax.", "bonus_active": false},
    {"from_slug": "aer-lingus", "ratio": "100:30", "notes": "100 Melia Rewards points = 30 Aer Lingus AerClub Avios. Same 100:30 ratio as other Avios-family programs. No transfer tax.", "bonus_active": false},
    {"from_slug": "air-europa", "ratio": "3:1", "notes": "3 Melia Rewards points = 1 Air Europa SUMA Mile. The transfer is also bidirectional - Air Europa SUMA miles can transfer into Melia Rewards (5 SUMA miles = 4 Melia points). No transfer tax.", "bonus_active": false},
    {"from_slug": "copa", "ratio": "6:1", "notes": "6 Melia Rewards points = 1 Copa Airlines ConnectMile. No transfer tax.", "bonus_active": false}
  ]'::jsonb,
  is_active = true,
  content_updated_at = now(),
  last_verified = current_date,
  updated_at = now()
where slug = 'melia';
