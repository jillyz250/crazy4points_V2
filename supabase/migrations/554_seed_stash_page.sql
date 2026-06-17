-- Seed Stash Hotel Rewards program page at /programs/stash.
-- Sourced from official stashrewards.com (scraped via Firecrawl 2026-06-17):
--   /how-stash-works + /questions (FAQ). Flat program: NO status tiers.
-- Lean style: avoid derived math + over-specificity; keep only official figures, lightly.
-- No co-brand card, no transfer partners, points can't combine with other programs (official FAQ).

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'Stash Hotel Rewards is the points program for independent hotels -- the largest of its kind in North America. Instead of chains, the network is hundreds of handpicked, individually owned upscale and boutique properties across the U.S., Mexico, Canada, and the Caribbean, the kind that show up in Conde Nast Traveler and Travel + Leisure rather than in a brand portfolio.

It is about as simple as a loyalty program gets, which is the appeal. There are no status tiers and no elite levels: every member earns the same flat rate on eligible room nights and redeems points for free stays at any partner hotel. Points never expire and there are no blackout dates, so a balance you build today is good years from now on whatever night you want. The trade-off is that value stays entirely inside the Stash network -- there is no co-brand card, no airline or bank transfers, and points cannot be combined with any other program. For travelers who genuinely prefer independent hotels over chains, it is the rare way to earn free nights at them.',

  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Free nights at any partner hotel**: Redeem points for award stays at any Stash Partner Hotel, booked through StashRewards.com. There are no blackout dates -- you can use points year-round, including peak periods, subject to availability.
- **No award chart**: Redemption pricing is dynamic, varying by hotel, room type, season, demand, and local events, so there is no fixed points-per-night figure -- you see the cost when you look up a specific hotel and date.
- **Full points only**: A redemption must be covered entirely by your points balance; Stash does not currently accept cash to top up a partial balance (the company has said it is exploring that for the future).
- **Book for someone else**: You can redeem your points for another person''s stay by entering their name as the guest at booking -- though points themselves cannot be transferred between member accounts.
- **Stays only**: Points are earned and redeemed on room rates, not on incidentals like dining or spa.',

  sweet_spots = '- **Never-expire, no-blackout flexibility is the real draw**: Stash points do not expire and carry no blackout dates, so there is no pressure to burn them and no calendar games -- rare among hotel programs and genuinely valuable if you travel independent hotels only occasionally.
- **The only practical way to earn at independent hotels**: If you prefer boutique and independent properties over big chains, Stash is essentially the one program that rewards that choice -- every eligible stay builds toward a free night you could not earn anywhere else.
- **Easy bonus points**: Stash offers low-effort ways to pad a balance -- updating your travel preferences periodically, inviting friends (you earn when they stay), and property-specific promotions that run extra points. Many partner hotels will also negotiate bonus points for meetings and events.
- **Redeem where cash rates run high**: Because redemption pricing tracks each hotel''s rates, points stretch furthest at the higher-end independent properties where a paid night would cost the most -- the same logic that makes any free night most valuable at a pricey hotel.
- **Reality check**: Stash is a niche, network-bound program. Points have no value outside its partner hotels, there is no co-brand card, and they cannot transfer to or combine with any other currency. It rewards a specific travel style rather than functioning as a flexible points bank.',

  tier_benefits = '[
    {
      "name": "Member",
      "qualification": "Automatic on enrollment (free to join; no status tiers)",
      "benefits": [
        "Earn 5 Stash Points per dollar on eligible room rates (before taxes and fees) at Stash Partner Hotels",
        "Redeem points for free nights at any Stash Partner Hotel",
        "Points never expire",
        "No blackout dates on redemptions",
        "Redeem points for another person''s stay (enter their name as guest at booking)",
        "Bonus-point opportunities: travel-preference updates, friend invites, and property promotions"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Stash Hotel Rewards has no lounge program and no tier-based benefits of any kind -- it is a flat earn-and-redeem points program, not a status program. There is no airport lounge access and no club-lounge entitlement.

Because every Stash Partner Hotel is independently owned and operated, on-property amenities and any lounge or club spaces vary entirely by hotel and are set by that property, not by Stash. Check the individual hotel for its facilities.',

  quirks = '- **No status tiers at all**: Stash is a flat program -- there are no elite levels, no night requirements, and no tier benefits. Every member earns and redeems on the same terms.
- **Points never expire and have no blackout dates**: A balance stays good indefinitely and can be redeemed year-round, subject to availability. (Deleting your account, however, forfeits any accumulated points.)
- **Full points only, no cash-and-points**: You must hold enough points to cover the entire room cost; cash top-ups are not currently accepted.
- **Earn on room rates only, direct bookings only**: Points accrue on eligible room rates (before taxes and fees), booked through StashRewards.com or directly with a partner hotel. Third-party / OTA bookings (Expedia, Booking.com, etc.) do not earn, and incidentals like dining or spa do not earn.
- **Booking limits**: You can earn on up to two rooms for the same dates, and on up to 29 nights of an extended stay.
- **Points are account-bound but stays are giftable**: Points cannot be transferred or combined between member accounts, but you can book an award stay in someone else''s name.
- **No co-brand card and no transfer partners**: There is no Stash credit card, points do not transfer to airline or bank programs, and they cannot be combined with any other rewards program -- value exists only within the Stash network.
- **Independent-hotel network**: Hundreds of upscale and boutique independent hotels across the U.S., Mexico, Canada, and the Caribbean, each independently operated, so policies and amenities vary by property. New hotels join (and occasionally leave) the network over time.',

  award_chart = 'Stash Hotel Rewards does not publish an award chart. Redemption pricing is fully dynamic -- the points needed for a free night vary by hotel, room type, season, demand, and local events, and are shown when you look up a specific property and date on StashRewards.com. There are no blackout dates, and redemptions must be covered entirely by points (no cash top-ups).

**How points are earned:**
- 5 Stash Points per dollar on eligible room rates, before taxes and fees, at Stash Partner Hotels
- Earned only on stays booked through StashRewards.com or directly with a partner hotel; third-party / OTA bookings do not earn, and only room rates (not incidentals) qualify
- Earn on up to two rooms for the same dates, and up to 29 nights of an extended stay

**Status:** None. Stash has no tiers or elite levels -- every member earns and redeems on identical terms. Points never expire.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'stash';
